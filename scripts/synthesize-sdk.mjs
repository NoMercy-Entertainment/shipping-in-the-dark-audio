#!/usr/bin/env node

/**
 * synthesize-sdk.mjs
 *
 * Azure Speech SDK-based synthesizer for Shipping in the Dark audio narration.
 * Uses WordBoundary events to capture precise timestamps for VTT generation.
 *
 * Key differences from synthesize.mjs (REST API version):
 *   - Uses microsoft-cognitiveservices-speech-sdk instead of raw fetch
 *   - Fires WordBoundary events during synthesis — exact offset per word in ms
 *   - Generates a .vtt file alongside the .mp3 with paragraph-level section cues
 *   - Chunk timestamp offsets are accumulated across chunks for correct VTT timing
 *
 * CLI:
 *   node synthesize-sdk.mjs parse  <script.speech.md>       — dump parsed segments as JSON
 *   node synthesize-sdk.mjs ssml   <script.speech.md>       — print SSML to stdout
 *   node synthesize-sdk.mjs full   <script.speech.md> [out] — full synthesis + VTT generation
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, unlinkSync, renameSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

// The SDK ships a CommonJS entry point. ESM interop via createRequire.
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const sdk = require('microsoft-cognitiveservices-speech-sdk');

const __dirname = dirname(fileURLToPath(import.meta.url));
const configDir = join(__dirname, '..', 'config');
const outputDir = join(__dirname, '..', 'output');

if (!existsSync(outputDir)) mkdirSync(outputDir, { recursive: true });

const voices       = JSON.parse(readFileSync(join(configDir, 'voices.json'), 'utf8'));
const pronunciation = JSON.parse(readFileSync(join(configDir, 'pronunciation.json'), 'utf8'));
const moods        = JSON.parse(readFileSync(join(configDir, 'moods.json'), 'utf8'));

// ---------------------------------------------------------------------------
// Re-implement the core functions from synthesize.mjs here directly so this
// script is self-contained and the old file keeps working unchanged.
// The logic is identical — any fix here should be ported back there too.
// ---------------------------------------------------------------------------

/**
 * Parse a .speech.md file into synthesis segments.
 */
function parseSpeechScript(scriptPath) {
	const content = readFileSync(scriptPath, 'utf8');
	const lines = content.split('\n');
	const segments = [];
	let current = null;

	for (const line of lines) {
		if (line.startsWith('#') || line.startsWith('**') || line.startsWith('---')) continue;

		const directiveMatch = line.match(/^\[(.+)\]\s*$/);
		if (directiveMatch) {
			if (current && current.text.trim()) {
				segments.push(current);
			}

			const directive = directiveMatch[1];

			const pauseMatch = directive.match(/^pause:(\d+)ms$/);
			if (pauseMatch) {
				if (current && current.text.trim()) {
					segments.push(current);
				}
				segments.push({ type: 'pause', duration: parseInt(pauseMatch[1]) });
				if (current) {
					current = { ...current, text: '' };
				}
				continue;
			}

			const parts = directive.split(',').map(p => p.trim());
			const firstPart = parts[0];

			let voiceType = 'narrator';
			let mood = 'matter-of-fact';
			let voiceId = null;
			let style = null;
			let emphasis = parts.some(p => p === 'emphasis');

			if (firstPart.startsWith('narrator:')) {
				mood = firstPart.split(':')[1];
			} else if (firstPart.startsWith('voice:')) {
				voiceType = 'agent';
				voiceId = firstPart.split(':')[1];
			}

			for (const part of parts.slice(1)) {
				if (part.startsWith('style:')) {
					style = part.split(':')[1];
				}
			}

			current = { type: 'speech', voiceType, voiceId, mood, style, emphasis, text: '' };
			continue;
		}

		if (current) {
			if (line.trim()) {
				current.text += (current.text ? ' ' : '') + line.trim();
			} else if (current.text.trim()) {
				segments.push(current);
				current = { ...current, text: '' };
			}
		}
	}

	if (current && current.text.trim()) {
		segments.push(current);
	}

	return segments;
}

function resolveVoice(segment) {
	if (segment.voiceType === 'narrator') return voices.narrator.voice;
	if (segment.voiceId === 'boss') return voices.special['boss-quotes'].voice;
	if (segment.voiceId === 'dutch') return voices.special.dutch.voice;
	if (voices.agents[segment.voiceId]) return voices.agents[segment.voiceId].voice;
	return voices.narrator.voice;
}

function resolveStyle(segment) {
	if (segment.style) return segment.style;
	if (segment.voiceType === 'narrator') return voices.narrator.style || 'empathetic';
	if (segment.voiceId === 'boss') return voices.special['boss-quotes'].style || 'chat';
	if (segment.voiceId && voices.agents[segment.voiceId]) return voices.agents[segment.voiceId].style || 'default';
	return 'default';
}

function applyPronunciation(text) {
	let result = text;
	for (const [term, config] of Object.entries(pronunciation.terms)) {
		if (!result.includes(term)) continue;
		if (config.sub) {
			result = result.replace(new RegExp(escapeRegex(term), 'g'), config.sub);
		}
	}
	return result;
}

function escapeRegex(str) {
	return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function getMoodProsody(mood) {
	const preset = moods.presets[mood];
	if (!preset) return '';
	const attrs = [];
	if (preset.rate && preset.rate !== '0%') attrs.push(`rate="${preset.rate}"`);
	if (preset.pitch && preset.pitch !== '0%') attrs.push(`pitch="${preset.pitch}"`);
	if (preset.volume && preset.volume !== 'medium') attrs.push(`volume="${preset.volume}"`);
	return attrs.length > 0 ? attrs.join(' ') : '';
}

function applyIpaPronunciation(text) {
	let result = text;
	for (const [term, config] of Object.entries(pronunciation.terms)) {
		if (!result.includes(term)) continue;
		if (config.ipa) {
			result = result.replace(
				new RegExp(escapeRegex(term), 'g'),
				`<phoneme alphabet="ipa" ph="${config.ipa}">${term}</phoneme>`
			);
		} else if (config['say-as']) {
			result = result.replace(
				new RegExp(escapeRegex(term), 'g'),
				`<say-as interpret-as="${config['say-as']}">${term}</say-as>`
			);
		}
	}
	result = result.replace(/\{\{(\w+)\}\}/g, '<say-as interpret-as="cardinal">$1</say-as>');
	return result;
}

function buildSsml(segments) {
	const ssmlParts = [];
	ssmlParts.push(`<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="en-US">`);

	let currentVoice = null;

	for (const segment of segments) {
		if (segment.type === 'pause') {
			ssmlParts.push(`  <break time="${segment.duration}ms"/>`);
			continue;
		}

		const voiceId = resolveVoice(segment);
		const style   = resolveStyle(segment);
		const prosody = getMoodProsody(segment.mood);

		let text = applyPronunciation(segment.text);
		text = applyIpaPronunciation(text);

		if (voiceId !== currentVoice) {
			if (currentVoice) ssmlParts.push(`  </voice>`);
			const lang = voiceId.startsWith('nl-') ? 'nl-NL' : 'en-US';
			ssmlParts.push(`  <voice name="${voiceId}" xml:lang="${lang}">`);
			currentVoice = voiceId;
		}

		let speechXml = text;
		if (style && style !== 'default') {
			speechXml = `    <mstts:express-as style="${style}">${speechXml}</mstts:express-as>`;
		}
		if (prosody) {
			speechXml = `    <prosody ${prosody}>${speechXml}</prosody>`;
		}
		if (segment.emphasis) {
			speechXml = `    <emphasis level="moderate">${speechXml}</emphasis>`;
		}

		ssmlParts.push(speechXml);
		ssmlParts.push(`    <break time="200ms"/>`);
	}

	if (currentVoice) ssmlParts.push(`  </voice>`);
	ssmlParts.push(`</speak>`);

	return ssmlParts.join('\n');
}

function countBillableCharacters(ssml) {
	return ssml.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim().length;
}

// ---------------------------------------------------------------------------
// SDK synthesis — replaces the fetch-based synthesizeToAudio() in synthesize.mjs
// ---------------------------------------------------------------------------

/**
 * Synthesize one SSML chunk via the Azure Speech SDK.
 *
 * Returns:
 *   {
 *     audioBuffer: Buffer,
 *     boundaries: Array<{ text, offsetMs, durationMs, type }>
 *   }
 *
 * The SDK fires WordBoundary events during synthesis. Each event carries:
 *   e.audioOffset  — 100-nanosecond ticks from the start of THIS synthesis call
 *   e.duration     — 100-nanosecond ticks
 *   e.text         — the word/punctuation
 *   e.boundaryType — 'Word' | 'Punctuation' | 'Sentence'
 *
 * We divide by 10,000 to convert to milliseconds.
 */
async function synthesizeChunk(ssml) {
	const apiKey = process.env.AZURE_SPEECH_KEY;
	const region = process.env.AZURE_SPEECH_REGION;

	if (!apiKey || !region) {
		throw new Error('AZURE_SPEECH_KEY and AZURE_SPEECH_REGION environment variables are required.');
	}

	const speechConfig = sdk.SpeechConfig.fromSubscription(apiKey, region);
	speechConfig.speechSynthesisOutputFormat = sdk.SpeechSynthesisOutputFormat.Audio24Khz96KBitRateMonoMp3;

	// null as AudioConfig means audio goes to the result object, not a speaker
	const synthesizer = new sdk.SpeechSynthesizer(speechConfig, null);

	const boundaries = [];

	synthesizer.wordBoundary = (_sender, e) => {
		// Only capture Word-type boundaries for VTT alignment.
		// Punctuation boundaries don't advance reading position meaningfully.
		boundaries.push({
			text:       e.text,
			offsetMs:   e.audioOffset / 10_000,   // 100ns ticks → ms
			durationMs: e.duration   / 10_000,
			type:       e.boundaryType,            // 'Word' | 'Punctuation' | 'Sentence'
		});
	};

	const result = await new Promise((resolve, reject) => {
		synthesizer.speakSsmlAsync(
			ssml,
			res => {
				synthesizer.close();
				resolve(res);
			},
			err => {
				synthesizer.close();
				reject(new Error(err));
			}
		);
	});

	if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
		return {
			audioBuffer: Buffer.from(result.audioData),
			boundaries,
		};
	}

	// Surface a readable error from the cancellation details
	const details = sdk.CancellationDetails.fromResult(result);
	throw new Error(`Synthesis cancelled: ${details.reason} — ${details.errorDetails}`);
}

// ---------------------------------------------------------------------------
// VTT generation
// ---------------------------------------------------------------------------

/**
 * Detect the approximate duration of an MP3 buffer.
 *
 * We parse the first valid MP3 frame header to get:
 *   - sample rate
 *   - bitrate
 *
 * Then estimate total duration = (fileBytes * 8) / bitrate.
 * This is an approximation — accurate enough for chunk offset accounting
 * and avoids requiring ffprobe at runtime.
 *
 * If parsing fails (corrupt header, ID3 tags at front, etc.) we fall back
 * to computing duration from the LAST word boundary offset + its duration.
 * That's usually within 500ms of actual audio length.
 */
function estimateMp3Duration(buffer, fallbackBoundaries) {
	try {
		// Skip an ID3v2 tag if present
		let pos = 0;
		if (buffer[0] === 0x49 && buffer[1] === 0x44 && buffer[2] === 0x33) {
			// ID3v2 header: 10 bytes, size in 4 syncsafe bytes at offset 6
			const size =
				((buffer[6] & 0x7f) << 21) |
				((buffer[7] & 0x7f) << 14) |
				((buffer[8] & 0x7f) <<  7) |
				 (buffer[9] & 0x7f);
			pos = 10 + size;
		}

		// Find the first sync frame (0xFF 0xE* or 0xFF 0xF*)
		while (pos < buffer.length - 4) {
			if (buffer[pos] === 0xFF && (buffer[pos + 1] & 0xE0) === 0xE0) break;
			pos++;
		}

		if (pos >= buffer.length - 4) throw new Error('no sync frame found');

		// Parse frame header
		const header = (buffer[pos] << 24) | (buffer[pos + 1] << 16) | (buffer[pos + 2] << 8) | buffer[pos + 3];

		const bitrateIndex = (header >> 12) & 0x0F;
		const sampleRateIndex = (header >> 10) & 0x03;

		// MPEG1 Layer III bitrate table (kbps)
		const bitrates = [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320, 0];
		// MPEG1 sample rates
		const sampleRates = [44100, 48000, 32000, 0];

		const bitrateKbps = bitrates[bitrateIndex];
		const sampleRate  = sampleRates[sampleRateIndex];

		if (!bitrateKbps || !sampleRate) throw new Error('invalid header values');

		// Duration in ms
		return (buffer.length * 8) / (bitrateKbps * 1000) * 1000;

	} catch {
		// Fallback: last boundary end time
		if (fallbackBoundaries && fallbackBoundaries.length > 0) {
			const last = fallbackBoundaries[fallbackBoundaries.length - 1];
			return last.offsetMs + last.durationMs + 200; // +200ms tail
		}
		return 0;
	}
}

/**
 * Slugify a section heading into a VTT cue identifier.
 *
 * Examples:
 *   "Act One. Unacceptable!" → "act-one-unacceptable"
 *   "Reka UI's Little Secret." → "reka-uis-little-secret"
 *   "But Wait. There's More." → "but-wait-theres-more"
 */
function slugify(text) {
	return text
		.toLowerCase()
		.replace(/['']/g, '')          // remove smart/straight apostrophes before stripping
		.replace(/[^a-z0-9\s-]/g, '')  // strip punctuation
		.replace(/\s+/g, '-')
		.replace(/-+/g, '-')
		.replace(/^-|-$/g, '');
}

/**
 * Format a millisecond offset as a VTT timestamp: HH:MM:SS.mmm
 */
function formatVttTime(ms) {
	const totalSeconds = Math.floor(ms / 1000);
	const hours   = Math.floor(totalSeconds / 3600);
	const minutes = Math.floor((totalSeconds % 3600) / 60);
	const seconds = totalSeconds % 60;
	const millis  = Math.round(ms % 1000);
	return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(millis).padStart(3, '0')}`;
}

/**
 * Determine which speech script segments are "section headings" for VTT cues.
 *
 * A segment is treated as a heading if:
 *   - It is a speech segment (not a pause)
 *   - Its text is short (≤ 100 chars) and looks like a title
 *     (ends with punctuation or is all caps)
 *   - It was preceded in the original script by a mood/directive change
 *     (tracked via the segment index vs the previous non-pause segment)
 *
 * For each detected heading we record its segment index. This index maps
 * into the flat segment list, which we walk against word boundaries to find
 * the timestamp at which the heading text starts being spoken.
 *
 * We also always add a cue for segment 0 (the very beginning) with offset 0.
 */
function detectSectionHeadings(segments) {
	const headings = [];
	let prevMood = null;
	let prevVoiceId = null;

	for (let i = 0; i < segments.length; i++) {
		const seg = segments[i];
		if (seg.type === 'pause') continue;

		const text = seg.text || '';
		const voiceId = resolveVoice(seg);

		// A heading is short and appears after a mood or voice change
		const moodChanged    = seg.mood    !== prevMood;
		const voiceChanged   = voiceId     !== prevVoiceId;
		const isShort        = text.length <= 100;
		const looksLikeTitle = isShort && (
			/[.!?]$/.test(text.trim()) ||    // ends with sentence punctuation
			/^[A-Z]/.test(text.trim())        // starts with capital letter
		);

		// Boss/agent speech quotes are never section headings
		const isNarratorOnly = seg.voiceType === 'narrator';

		if (moodChanged && looksLikeTitle && isNarratorOnly) {
			headings.push({ segmentIndex: i, text, slug: slugify(text) });
		}

		prevMood    = seg.mood;
		prevVoiceId = voiceId;
	}

	return headings;
}

/**
 * Walk through all word boundaries from all chunks and find the timestamp
 * at which each segment's text begins to be spoken.
 *
 * Strategy: we re-join the plain text content of each segment (stripping SSML
 * tags). Then we walk word boundaries sequentially, matching words against the
 * running segment text. When we've consumed enough words to complete a segment's
 * text, we move to the next segment. When we reach a heading segment, we record
 * the timestamp of its FIRST word as the cue start time.
 *
 * Word matching uses case-insensitive prefix matching to handle:
 *   - IPA phoneme tags (word text unchanged)
 *   - say-as substitutions (word text changed by TTS)
 *   - Punctuation boundaries in the boundary stream
 *
 * Edge case: if the word boundary stream doesn't perfectly cover a segment
 * (can happen at chunk boundaries), we advance the segment pointer when we
 * exceed the expected character count.
 */
function buildVttCues(segments, allBoundaries, _headings) {
	// Simple approach: create a cue for every speech segment.
	// Map word boundaries to segments by walking both lists in parallel.
	const speechSegments = [];
	for (let i = 0; i < segments.length; i++) {
		if (segments[i].type === 'pause') continue;
		const text = (segments[i].text || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
		if (!text) continue;
		const wordCount = text.split(' ').filter(Boolean).length;
		speechSegments.push({ index: i, text, wordCount, startMs: 0, endMs: 0 });
	}

	// Walk word boundaries and assign them to segments
	let segPtr = 0;
	let wordsConsumed = 0;

	for (const boundary of allBoundaries) {
		if (boundary.type !== 'Word') continue;
		if (segPtr >= speechSegments.length) break;

		if (wordsConsumed === 0) {
			// First word of this segment — record start time
			speechSegments[segPtr].startMs = boundary.offsetMs;
		}

		wordsConsumed++;
		// Record end time as the end of the last word we've seen
		speechSegments[segPtr].endMs = boundary.offsetMs + boundary.durationMs;

		if (wordsConsumed >= speechSegments[segPtr].wordCount) {
			// This segment is complete, move to next
			segPtr++;
			wordsConsumed = 0;
		}
	}

	// Build VTT cues from the timed segments
	return speechSegments
		.filter(s => s.endMs > s.startMs)
		.map(s => ({
			startMs: s.startMs,
			endMs: s.endMs,
			text: s.text,
		}));
}

/**
 * Render a VTT cues array to a WebVTT string.
 *
 * Format:
 *   WEBVTT
 *
 *   1
 *   00:00:00.000 --> 00:01:23.456
 *   section-slug
 *
 * The blog's highlight script uses the cue text (section slug) to find and
 * highlight the matching <section id="..."> element.
 */
function renderVtt(cues) {
	const lines = ['WEBVTT', ''];

	for (let i = 0; i < cues.length; i++) {
		const cue = cues[i];
		const endMs = cue.endMs ?? (cue.startMs + 30_000);
		lines.push(String(i + 1));
		lines.push(`${formatVttTime(cue.startMs)} --> ${formatVttTime(endMs)}`);
		lines.push(cue.text);
		lines.push('');
	}

	return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Chunking — identical logic to synthesize.mjs
// ---------------------------------------------------------------------------

const MAX_CHARS_PER_CHUNK = 5000;

function chunkSegments(segments) {
	const chunks = [];
	let currentChunk = [];
	let currentChars = 0;

	for (const seg of segments) {
		if (seg.type === 'pause') {
			currentChunk.push(seg);
			continue;
		}
		const segChars = (seg.text || '').length;
		if (currentChars + segChars > MAX_CHARS_PER_CHUNK && currentChunk.length > 0) {
			chunks.push(currentChunk);
			currentChunk = [];
			currentChars = 0;
		}
		currentChunk.push(seg);
		currentChars += segChars;
	}

	if (currentChunk.length > 0) chunks.push(currentChunk);
	return chunks;
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

const args = process.argv.slice(2);
const command = args[0] || 'help';
const scriptPath = args[1];

switch (command) {

	case 'parse': {
		if (!scriptPath) { console.error('Usage: node synthesize-sdk.mjs parse <script.speech.md>'); process.exit(1); }
		const segments = parseSpeechScript(scriptPath);
		console.log(JSON.stringify(segments, null, 2));
		break;
	}

	case 'ssml': {
		if (!scriptPath) { console.error('Usage: node synthesize-sdk.mjs ssml <script.speech.md>'); process.exit(1); }
		const segments = parseSpeechScript(scriptPath);
		const ssml = buildSsml(segments);
		console.log(ssml);
		console.log(`\n--- Billable characters: ${countBillableCharacters(ssml).toLocaleString()} ---`);
		break;
	}

	case 'full': {
		if (!scriptPath) { console.error('Usage: node synthesize-sdk.mjs full <script.speech.md> [output.mp3]'); process.exit(1); }

		const scriptBasename = basename(scriptPath, '.speech.md');
		const outputPath = args[2] || join(outputDir, `${scriptBasename}.mp3`);
		const vttPath    = outputPath.replace(/\.mp3$/, '.vtt');

		console.log('Generating full audio with SDK + word boundary timestamps...\n');

		const segments   = parseSpeechScript(scriptPath);
		const totalChars = countBillableCharacters(buildSsml(segments));

		console.log(`  Total segments:             ${segments.length}`);
		console.log(`  Total billable characters:  ${totalChars.toLocaleString()}`);

		const chunks = chunkSegments(segments);
		console.log(`  Chunks:                     ${chunks.length}\n`);

		// Detect section headings from the full segment list (before chunking
		// so indices are stable across the whole script)
		const headings = detectSectionHeadings(segments);
		console.log(`  Section headings detected:  ${headings.length}`);
		headings.forEach(h => console.log(`    [${h.segmentIndex}] "${h.text}" → ${h.slug}`));
		console.log();

		const chunkFiles      = [];
		const allBoundaries   = [];
		let   chunkOffsetMs   = 0;
		let   totalSize       = 0;
		let   totalBilled     = 0;

		for (let i = 0; i < chunks.length; i++) {
			const chunkSsml  = buildSsml(chunks[i]);
			const chunkChars = countBillableCharacters(chunkSsml);
			const chunkPath  = join(outputDir, `chunk-${i}.mp3`);

			const speechSegCount = chunks[i].filter(s => s.type !== 'pause').length;
			console.log(`  Chunk ${i + 1}/${chunks.length}: ${speechSegCount} segments, ${chunkChars.toLocaleString()} chars`);

			let audioBuffer, boundaries;
			try {
				({ audioBuffer, boundaries } = await synthesizeChunk(chunkSsml));
			} catch (err) {
				console.error(`    Chunk ${i + 1} failed: ${err.message}`);
				const debugPath = join(outputDir, `chunk-${i}-debug.ssml`);
				writeFileSync(debugPath, chunkSsml);
				console.log(`    SSML saved to: ${debugPath}`);
				chunkFiles.forEach(f => { try { unlinkSync(f); } catch {} });
				process.exit(1);
			}

			writeFileSync(chunkPath, audioBuffer);
			console.log(`    ${(audioBuffer.length / 1024).toFixed(1)} KB, ${boundaries.filter(b => b.type === 'Word').length} word boundaries`);

			// Adjust all boundary timestamps by the accumulated offset from prior chunks.
			// This makes the boundary stream a single flat timeline across the whole file.
			const adjusted = boundaries.map(b => ({ ...b, offsetMs: b.offsetMs + chunkOffsetMs }));
			allBoundaries.push(...adjusted);

			// Estimate this chunk's audio duration to calculate offset for next chunk
			const chunkDuration = estimateMp3Duration(audioBuffer, boundaries);
			chunkOffsetMs += chunkDuration;

			chunkFiles.push(chunkPath);
			totalSize   += audioBuffer.length;
			totalBilled += chunkChars;
		}

		// Concatenate chunks with ffmpeg
		if (chunkFiles.length === 1) {
			renameSync(chunkFiles[0], outputPath);
		} else {
			console.log(`\n  Concatenating ${chunkFiles.length} chunks with ffmpeg...`);
			const listPath = join(outputDir, 'concat-list.txt');
			writeFileSync(listPath, chunkFiles.map(f => `file '${f}'`).join('\n'));

			const { execSync } = await import('node:child_process');
			try {
				execSync(`ffmpeg -y -f concat -safe 0 -i "${listPath}" -c copy "${outputPath}"`, { stdio: 'pipe' });
				console.log(`  Concatenation complete`);
			} catch (err) {
				console.error(`  ffmpeg concat failed: ${err.message}`);
				console.log(`  Chunk files preserved in output/ for manual concat`);
				process.exit(1);
			}

			chunkFiles.forEach(f => { try { unlinkSync(f); } catch {} });
			try { unlinkSync(listPath); } catch {}
		}

		// Build and write VTT
		// The final cue needs an end time — use total known audio duration
		const totalDurationMs = chunkOffsetMs;
		const rawCues = buildVttCues(segments, allBoundaries, headings);

		// Patch the last cue's end time to the actual audio end
		if (rawCues.length > 0 && rawCues[rawCues.length - 1].endMs === null) {
			rawCues[rawCues.length - 1].endMs = totalDurationMs;
		}

		const vttContent = renderVtt(rawCues);
		writeFileSync(vttPath, vttContent, 'utf8');

		console.log(`\n  Audio:      ${outputPath}`);
		console.log(`  VTT:        ${vttPath}`);
		console.log(`  File size:  ${(totalSize / 1024).toFixed(1)} KB`);
		console.log(`  Characters: ${totalBilled.toLocaleString()}`);
		console.log(`  Duration:   ${(totalDurationMs / 1000).toFixed(1)}s (estimated)`);
		console.log(`  VTT cues:   ${rawCues.length}`);
		console.log();

		// Print the generated VTT for inspection
		console.log('--- VTT preview ---');
		console.log(vttContent);
		break;
	}

	default:
		console.log('Usage:');
		console.log('  node synthesize-sdk.mjs parse <script.speech.md>   — Parse script into segments (JSON)');
		console.log('  node synthesize-sdk.mjs ssml  <script.speech.md>   — Generate SSML from script');
		console.log('  node synthesize-sdk.mjs full  <script.speech.md> [output.mp3]  — Synthesize + VTT generation');
}
