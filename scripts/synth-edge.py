#!/usr/bin/env python3
"""
Edge TTS synthesizer.
Each segment → MP3 chunk + VTT chunk.
Each pause → silence MP3 chunk + silence VTT chunk.
ffmpeg concat all MP3 chunks → final MP3.
Merge all VTT chunks with offset adjustment → final VTT.
"""
import asyncio, json, os, re, subprocess, sys, time
import edge_tts

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
CONFIG_DIR = os.path.join(SCRIPT_DIR, '..', 'config')
OUTPUT_DIR = os.path.join(SCRIPT_DIR, '..', 'output')
os.makedirs(OUTPUT_DIR, exist_ok=True)
CONCURRENCY = 10

voices = json.load(open(os.path.join(CONFIG_DIR, 'voices.json'), encoding='utf-8'))
pronunciation = json.load(open(os.path.join(CONFIG_DIR, 'pronunciation.json'), encoding='utf-8'))

EDGE_MAP = {
    'en-US-DavisNeural': 'en-US-AndrewNeural',
    'en-AU-WilliamNeural': 'en-AU-WilliamMultilingualNeural',
    'en-US-JaneNeural': 'en-US-EmmaNeural',
    'en-US-SaraNeural': 'en-US-AvaNeural',
    'en-US-TonyNeural': 'en-US-ChristopherNeural',
    'en-US-NancyNeural': 'en-US-MichelleNeural',
    'en-US-BrandonNeural': 'en-US-EricNeural',
    'en-US-JasonNeural': 'en-US-BrianNeural',
}

def map_voice(v): return EDGE_MAP.get(v, v)
def resolve_voice(seg):
    if seg['voice_type'] == 'narrator': v = voices['narrator']['voice']
    elif seg.get('voice_id') == 'boss': v = voices['special']['boss-quotes']['voice']
    elif seg.get('voice_id') == 'dutch': v = voices['special']['dutch']['voice']
    elif seg.get('voice_id') and seg['voice_id'] in voices.get('agents', {}):
        v = voices['agents'][seg['voice_id']]['voice']
    else: v = voices['narrator']['voice']
    return map_voice(v)

def apply_pronunciation(text):
    for term, cfg in pronunciation.get('terms', {}).items():
        if term in text and cfg.get('sub'):
            text = text.replace(term, cfg['sub'])
    return re.sub(r'\{\{(\w+)\}\}', r'\1', text)

def parse_script(path):
    segments, current, next_pid = [], None, None
    for line in open(path, encoding='utf-8'):
        line = line.rstrip('\n')
        if line.startswith('#') or line.startswith('**') or line.startswith('---'): continue
        m = re.match(r'^<!--\s*([phi]-\d+)\s*-->$', line)
        if m: next_pid = m.group(1); continue
        m = re.match(r'^\[(.+)\]\s*$', line)
        if m:
            if current and current.get('text', '').strip(): segments.append(current)
            d = m.group(1)
            pm = re.match(r'^pause:(\d+)ms$', d)
            if pm:
                segments.append({'type': 'pause', 'duration': int(pm.group(1))})
                if current: current = {**current, 'text': '', 'pid': None}
                continue
            parts = [p.strip() for p in d.split(',')]
            vt, vid = 'narrator', None
            if parts[0].startswith('narrator:'): pass
            elif parts[0].startswith('voice:'): vt = 'agent'; vid = parts[0].split(':')[1]
            current = {'type': 'speech', 'voice_type': vt, 'voice_id': vid, 'text': '', 'pid': None}
            continue
        if current is not None:
            if line.strip():
                if next_pid: current['pid'] = next_pid; next_pid = None
                current['text'] = (current['text'] + ' ' + line.strip()).strip()
            elif current.get('text', '').strip():
                segments.append(current)
                current = {**current, 'text': '', 'pid': None}
    if current and current.get('text', '').strip(): segments.append(current)
    return segments

def fmt_vtt(ms):
    ms = max(0, int(ms))
    h = ms // 3600000; ms %= 3600000
    m = ms // 60000; ms %= 60000
    s = ms // 1000; ms %= 1000
    return f'{h:02d}:{m:02d}:{s:02d}.{ms:03d}'

def parse_srt_time(t):
    t = t.strip().replace(',', '.')
    parts = t.split(':')
    return (int(parts[0]) * 3600 + int(parts[1]) * 60 + float(parts[2])) * 1000

def get_duration_ms(path):
    try:
        r = subprocess.run(
            ['ffprobe', '-v', 'quiet', '-show_entries', 'format=duration', '-of', 'csv=p=0', path],
            capture_output=True, text=True, timeout=10)
        val = r.stdout.strip()
        return float(val) * 1000 if val else 0
    except:
        return 0

async def synth_one(sem, idx, text, voice, mp3_path, vtt_path):
    """Synthesize one segment → MP3 + VTT via edge-tts CLI."""
    async with sem:
        proc = await asyncio.create_subprocess_exec(
            'edge-tts', '--voice', voice, '--text', text,
            '--write-media', mp3_path, '--write-subtitles', vtt_path,
            stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE)
        await proc.wait()

async def main():
    if len(sys.argv) < 2:
        print('Usage: python synth-edge.py <speech-script.md> [output.mp3]'); sys.exit(1)

    script_path = sys.argv[1]
    slug = os.path.basename(script_path).replace('.speech.md', '')
    out_mp3 = sys.argv[2] if len(sys.argv) > 2 else os.path.join(OUTPUT_DIR, f'{slug}.mp3')

    segments = parse_script(script_path)
    speech_segs = [(i, s) for i, s in enumerate(segments) if s['type'] == 'speech' and s.get('text', '').strip()]
    pause_segs = [(i, s) for i, s in enumerate(segments) if s['type'] == 'pause']
    print(f'Synthesizing: {slug}')
    print(f'  Total: {len(segments)}, Speech: {len(speech_segs)}, Pauses: {len(pause_segs)}')

    t0 = time.time()

    # Step 1: Generate silence MP3 + VTT chunks for each pause
    # Reuse files for same duration
    silence_cache = {}  # duration_ms → (mp3_path, actual_dur_ms)
    for i, seg in pause_segs:
        dur = seg['duration']
        if dur not in silence_cache:
            sf = os.path.join(OUTPUT_DIR, f'_silence_{dur}ms.mp3')
            subprocess.run(
                ['ffmpeg', '-y', '-f', 'lavfi', '-i', f'anullsrc=r=24000:cl=mono',
                 '-t', f'{dur/1000:.3f}', '-c:a', 'libmp3lame', '-b:a', '96k', sf],
                capture_output=True, timeout=10)
            silence_cache[dur] = (sf, get_duration_ms(sf))

    # Step 2: Synthesize all speech segments in parallel → MP3 + VTT per segment
    sem = asyncio.Semaphore(CONCURRENCY)
    tasks = []
    for i, seg in speech_segs:
        voice = resolve_voice(seg)
        text = apply_pronunciation(seg['text'])
        mp3 = os.path.join(OUTPUT_DIR, f'_chunk_{i:04d}.mp3')
        vtt = os.path.join(OUTPUT_DIR, f'_chunk_{i:04d}.vtt')
        tasks.append((i, seg, mp3, vtt, asyncio.create_task(synth_one(sem, i, text, voice, mp3, vtt))))

    print(f'  Synthesizing {len(tasks)} speech segments (concurrency={CONCURRENCY})...', flush=True)
    for _, _, _, _, task in tasks:
        await task
    synth_time = time.time() - t0
    print(f'  Synthesis: {synth_time:.0f}s')

    # Step 3: Walk segments in order, concat MP3s, merge VTTs
    concat_list = []  # ordered MP3 file paths
    vtt_cues = []     # (start_ms, end_ms, cue_id)
    offset_ms = 0.0

    # Index speech results by segment index for lookup
    speech_files = {}  # seg_index → (mp3, vtt)
    for i, seg, mp3, vtt, _ in tasks:
        speech_files[i] = (mp3, vtt)

    n = 0
    for i, seg in enumerate(segments):
        if seg['type'] == 'pause':
            dur = seg['duration']
            sf, actual_dur = silence_cache[dur]
            concat_list.append(sf)
            # Silence VTT cue — no highlight, just advance offset
            offset_ms += actual_dur
            continue

        if not seg.get('text', '').strip(): continue
        if i not in speech_files: continue
        n += 1

        mp3, vtt = speech_files[i]
        if not os.path.exists(mp3) or os.path.getsize(mp3) == 0:
            print(f'  [{n}/{len(speech_segs)}] SKIPPED (empty MP3)')
            continue
        concat_list.append(mp3)

        # Parse the edge-tts VTT to get segment duration
        seg_dur = 0
        if os.path.exists(vtt):
            content = open(vtt, encoding='utf-8').read()
            times = re.findall(r'(\d+:\d+:\d+[.,]\d+)\s*-->\s*(\d+:\d+:\d+[.,]\d+)', content)
            if times:
                seg_dur = parse_srt_time(times[-1][1])

        if seg_dur == 0:
            seg_dur = get_duration_ms(mp3)

        cue_id = seg.get('pid') or (seg['text'] if seg['text'].startswith('--') else ('--' + seg['text']))
        vtt_cues.append((offset_ms, offset_ms + seg_dur, cue_id))

        pid = seg.get('pid') or '--'
        print(f'  [{n}/{len(speech_segs)}] {pid:6s} {seg_dur/1000:.1f}s  @{offset_ms/1000:.1f}s')
        offset_ms += seg_dur

    # Step 4: ffmpeg concat all MP3 chunks → final MP3
    print(f'\n  Joining {len(concat_list)} chunks...')
    list_path = os.path.join(OUTPUT_DIR, '_list.txt')
    with open(list_path, 'w') as f:
        for cf in concat_list:
            f.write(f"file '{cf.replace(os.sep, '/')}'\n")

    subprocess.run(
        ['ffmpeg', '-y', '-f', 'concat', '-safe', '0', '-i', list_path,
         '-c:a', 'libmp3lame', '-b:a', '96k', out_mp3],
        capture_output=True, timeout=300)

    # Step 5: Write merged VTT
    vtt_out = out_mp3.replace('.mp3', '.vtt')
    with open(vtt_out, 'w', encoding='utf-8') as f:
        f.write('WEBVTT\n\n')
        for i, (start, end, cue_id) in enumerate(vtt_cues, 1):
            f.write(f'{i}\n{fmt_vtt(start)} --> {fmt_vtt(end)}\n{cue_id}\n\n')

    # Cleanup speech chunks + VTTs (keep silence cache for next entry)
    for _, _, mp3, vtt, _ in tasks:
        for f in [mp3, vtt]:
            try: os.unlink(f)
            except: pass
    try: os.unlink(list_path)
    except: pass

    elapsed = time.time() - t0
    print(f'\n  Audio: {out_mp3} ({os.path.getsize(out_mp3)/1024:.1f} KB)')
    print(f'  VTT:   {vtt_out} ({len(vtt_cues)} cues)')
    print(f'  Chunks: {len(concat_list)} ({len(speech_segs)} speech + {len(pause_segs)} silence)')
    print(f'  Time:  {elapsed:.0f}s (synthesis: {synth_time:.0f}s)')

asyncio.run(main())
