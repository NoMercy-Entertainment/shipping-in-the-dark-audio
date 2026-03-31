#!/usr/bin/env node

/**
 * synthesize-edge.mjs
 *
 * Edge TTS synthesizer for Shipping in the Dark audio narration.
 * Uses edge-tts CLI (free, no API key, same Microsoft Neural voices).
 * Generates MP3 + VTT with paragraph-level sync from <!-- p-N --> markers.
 *
 * CLI:
 *   node synthesize-edge.mjs full <script.speech.md> [output.mp3]
 *   node synthesize-edge.mjs test <script.speech.md>
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, unlinkSync, renameSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const configDir = join(__dirname, '..', 'config');
const outputDir = join(__dirname, '..', 'output');

if (!existsSync(outputDir)) mkdirSync(outputDir, { recursive: true });

const voices = JSON.parse(readFileSync(join(configDir, 'voices.json'), 'utf8'));
const pronunciation = JSON.parse(readFileSync(join(configDir, 'pronunciation.json'), 'utf8'));
const moods = JSON.parse(readFileSync(join(configDir, 'moods.json'), 'utf8'));

// Edge TTS voice mapping — replacements for voices not available in Edge TTS
const EDGE_VOICE_MAP = {
	'en-US-DavisNeural': 'en-US-AndrewNeural',
	'en-AU-WilliamNeural': 'en-AU-WilliamMultilingualNeural',
	'en-US-JaneNeural': 'en-US-EmmaNeural',
	'en-US-SaraNeural': 'en-US-AvaNeural',
	'en-US-TonyNeural': 'en-US-ChristopherNeural',
	'en-US-NancyNeural': 'en-US-MichelleNeural',
	'en-US-BrandonNeural': 'en-US-EricNeural',
	'en-US-JasonNeural': 'en-US-BrianNeural',
};

function mapVoice(azureVoice) {
	return EDGE_VOICE_MAP[azureVoice] || azureVoice;
}

// ---------------------------------------------------------------------------
// Speech script parser (same as synthesize.mjs + p-N support)
// ---------------------------------------------------------------------------

function parseSpeechScript(scriptPath) {
	const content = readFileSync(scriptPath, 'utf8');
	const lines = content.split('\n');
	const segments = [];
	let current = null;
	let nextParagraphId = null;

	for (const line of lines) {
		if (line.startsWith('#') || line.startsWith('**') || line.startsWith('---')) continue;

		const pidMatch = line.match(/^<!--\s*(p-\d+)\s*-->$/);
		if (pidMatch) {
			nextParagraphId = pidMatch[1];
			continue;
		}

		// Skip heading markers (h-1, h-2, etc.) — structural only, not spoken
		if (/^<!--\s*h-\d+\s*-->$/.test(line)) continue;

		const directiveMatch = line.match(/^\[(.+)\]\s*$/);
		if (directiveMatch) {
			if (current && current.text.trim()) segments.push(current);

			const directive = directiveMatch[1];
			const pauseMatch = directive.match(/^pause:(\d+)ms$/);
			if (pauseMatch) {
				segments.push({ type: 'pause', duration: parseInt(pauseMatch[1]) });
				if (current) current = { ...current, text: '', paragraphId: undefined };
				continue;
			}

			const parts = directive.split(',').map(p => p.trim());
			const firstPart = parts[0];
			let voiceType = 'narrator', mood = 'matter-of-fact', voiceId = null, style = null;
			let emphasis = parts.some(p => p === 'emphasis');

			if (firstPart.startsWith('narrator:')) mood = firstPart.split(':')[1];
			else if (firstPart.startsWith('voice:')) { voiceType = 'agent'; voiceId = firstPart.split(':')[1]; }

			for (const part of parts.slice(1)) {
				if (part.startsWith('style:')) style = part.split(':')[1];
			}

			current = { type: 'speech', voiceType, voiceId, mood, style, emphasis, text: '', paragraphId: undefined };
			continue;
		}

		if (current) {
			if (line.trim()) {
				if (nextParagraphId) { current.paragraphId = nextParagraphId; nextParagraphId = null; }
				current.text += (current.text ? ' ' : '') + line.trim();
			} else if (current.text.trim()) {
				segments.push(current);
				current = { ...current, text: '', paragraphId: undefined };
			}
		}
	}
	if (current && current.text.trim()) segments.push(current);
	return segments;
}

// ---------------------------------------------------------------------------
// Voice resolution
// ---------------------------------------------------------------------------

function resolveVoice(segment) {
	let voice;
	if (segment.voiceType === 'narrator') voice = voices.narrator.voice;
	else if (segment.voiceId === 'boss') voice = voices.special['boss-quotes'].voice;
	else if (segment.voiceId === 'dutch') voice = voices.special.dutch.voice;
	else if (voices.agents[segment.voiceId]) voice = voices.agents[segment.voiceId].voice;
	else voice = voices.narrator.voice;
	return mapVoice(voice);
}

// ---------------------------------------------------------------------------
// Pronunciation
// ---------------------------------------------------------------------------

function escapeRegex(str) {
	return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function applyPronunciation(text) {
	let result = text;
	for (const [term, config] of Object.entries(pronunciation.terms)) {
		if (!result.includes(term)) continue;
		if (config.sub) {
			result = result.replace(new RegExp(escapeRegex(term), 'g'), config.sub);
		}
	}
	// {{N}} cardinal markers — just remove the braces, edge-tts handles numbers naturally
	result = result.replace(/\{\{(\w+)\}\}/g, '$1');
	return result;
}

// ---------------------------------------------------------------------------
// Synthesis — one segment at a time via edge-tts CLI
// ---------------------------------------------------------------------------

function synthesizeSegment(text, voice, outputPath) {
	// Escape text for shell
	const escaped = text.replace(/"/g, '\\"').replace(/\$/g, '\\$');
	const cmd = `edge-tts --voice "${voice}" --text "${escaped}" --write-media "${outputPath}" --write-subtitles "${outputPath}.vtt"`;
	try {
		execSync(cmd, { stdio: 'pipe', timeout: 60000 });
		return true;
	} catch (err) {
		console.error(`    Failed: ${err.message.slice(0, 100)}`);
		return false;
	}
}

// ---------------------------------------------------------------------------
// VTT helpers
// ---------------------------------------------------------------------------

function formatVttTime(ms) {
	const totalSeconds = Math.floor(ms / 1000);
	const hours = Math.floor(totalSeconds / 3600);
	const minutes = Math.floor((totalSeconds % 3600) / 60);
	const seconds = totalSeconds % 60;
	const millis = Math.round(ms % 1000);
	return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(millis).padStart(3, '0')}`;
}

function getAudioDurationMs(filePath) {
	try {
		const result = execSync(
			`ffprobe -v quiet -show_entries format=duration -of csv=p=0 "${filePath}"`,
			{ encoding: 'utf-8', timeout: 10000 }
		).trim();
		return parseFloat(result) * 1000;
	} catch {
		return 0;
	}
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const args = process.argv.slice(2);
const command = args[0] || 'help';
const scriptPath = args[1];

switch (command) {
	case 'test':
	case 'full': {
		if (!scriptPath) { console.error('Usage: node synthesize-edge.mjs full <script.speech.md> [output.mp3]'); process.exit(1); }
		const outputPath = args[2] || join(outputDir, basename(scriptPath, '.speech.md') + '.mp3');

		console.log(`Synthesizing: ${basename(scriptPath, '.speech.md')}\n`);

		const segments = parseSpeechScript(scriptPath);
		const speechSegs = segments.filter(s => s.type === 'speech' && s.text.trim());
		const maxSegs = command === 'test' ? Math.min(5, speechSegs.length) : speechSegs.length;

		console.log(`  Total segments: ${segments.length}`);
		console.log(`  Speech segments: ${speechSegs.length}`);
		console.log(`  Processing: ${maxSegs}\n`);

		const segmentFiles = [];
		const segmentMeta = []; // { file, paragraphId, durationMs, text }
		let segNum = 0;

		for (const seg of segments) {
			if (seg.type === 'pause') {
				// Generate silence with ffmpeg
				const silenceFile = join(outputDir, `seg-${segNum}-silence.mp3`);
				try {
					execSync(
						`ffmpeg -y -f lavfi -i anullsrc=r=24000:cl=mono -t ${seg.duration / 1000} -c:a libmp3lame -b:a 96k "${silenceFile}"`,
						{ stdio: 'pipe', timeout: 10000 }
					);
					segmentFiles.push(silenceFile);
					segmentMeta.push({ file: silenceFile, paragraphId: null, durationMs: seg.duration, text: null });
				} catch { /* skip failed silence */ }
				segNum++;
				continue;
			}

			if (!seg.text.trim()) continue;
			if (command === 'test' && segmentFiles.filter(f => !f.includes('silence')).length >= maxSegs) break;

			const voice = resolveVoice(seg);
			const text = applyPronunciation(seg.text);
			const segFile = join(outputDir, `seg-${segNum}.mp3`);

			process.stdout.write(`  [${segmentFiles.filter(f => !f.includes('silence')).length + 1}/${maxSegs}] ${voice} → ${(seg.paragraphId || '--').padEnd(5)} ${text.slice(0, 50)}...`);

			if (synthesizeSegment(text, voice, segFile)) {
				const dur = getAudioDurationMs(segFile);
				segmentFiles.push(segFile);
				segmentMeta.push({ file: segFile, paragraphId: seg.paragraphId || null, durationMs: dur, text: seg.text });
				console.log(` ${(dur / 1000).toFixed(1)}s`);
			} else {
				console.log(' FAILED');
			}
			segNum++;
		}

		if (segmentFiles.length === 0) {
			console.error('\n  No segments synthesized.');
			process.exit(1);
		}

		// Concatenate all segments with ffmpeg
		console.log(`\n  Concatenating ${segmentFiles.length} segments...`);
		const listPath = join(outputDir, 'concat-list.txt');
		writeFileSync(listPath, segmentFiles.map(f => `file '${f.replace(/\\/g, '/')}'`).join('\n'));

		try {
			execSync(`ffmpeg -y -f concat -safe 0 -i "${listPath}" -c:a libmp3lame -b:a 96k "${outputPath}"`, { stdio: 'pipe', timeout: 120000 });
			console.log(`  Concatenation complete.`);
		} catch (err) {
			console.error(`  ffmpeg concat failed: ${err.message}`);
			process.exit(1);
		}

		// Build VTT from actual segment durations
		const vttLines = ['WEBVTT', ''];
		let cueNum = 1;
		let offsetMs = 0;

		for (const meta of segmentMeta) {
			if (!meta.text) {
				// Pause/silence segment — just advance the offset
				offsetMs += meta.durationMs;
				continue;
			}

			const startMs = offsetMs;
			const endMs = offsetMs + meta.durationMs;
			const cueText = meta.paragraphId || ('--' + meta.text);

			vttLines.push(String(cueNum));
			vttLines.push(`${formatVttTime(startMs)} --> ${formatVttTime(endMs)}`);
			vttLines.push(cueText);
			vttLines.push('');

			offsetMs = endMs;
			cueNum++;
		}

		const vttPath = outputPath.replace(/\.mp3$/, '.vtt');
		writeFileSync(vttPath, vttLines.join('\n'));

		// Clean up segment files
		for (const f of segmentFiles) { try { unlinkSync(f); } catch {} }
		try { unlinkSync(listPath); } catch {}
		// Clean up edge-tts VTT files
		for (const f of segmentFiles) { try { unlinkSync(f + '.vtt'); } catch {} }

		const finalSize = readFileSync(outputPath).length;
		console.log(`\n  Audio: ${outputPath} (${(finalSize / 1024).toFixed(1)} KB)`);
		console.log(`  VTT:   ${vttPath} (${cueNum - 1} cues)`);
		console.log(`  Done.`);
		break;
	}

	default:
		console.log('Usage:');
		console.log('  node synthesize-edge.mjs test <script.speech.md>   — Synthesize first 5 segments (test)');
		console.log('  node synthesize-edge.mjs full <script.speech.md>   — Full synthesis + VTT generation');
}
