#!/usr/bin/env node

import { readFileSync, writeFileSync, mkdirSync, existsSync, unlinkSync, renameSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const configDir = join(__dirname, '..', 'config');
const outputDir = join(__dirname, '..', 'output');

if (!existsSync(outputDir)) mkdirSync(outputDir, { recursive: true });

const voices = JSON.parse(readFileSync(join(configDir, 'voices.json'), 'utf8'));
const pronunciation = JSON.parse(readFileSync(join(configDir, 'pronunciation.json'), 'utf8'));
const moods = JSON.parse(readFileSync(join(configDir, 'moods.json'), 'utf8'));

/**
 * Parse a .speech.md file into synthesis segments.
 * Each segment has a voice, style, mood, and text.
 */
function parseSpeechScript(scriptPath) {
	const content = readFileSync(scriptPath, 'utf8');
	const lines = content.split('\n');
	const segments = [];
	let current = null;

	let nextParagraphId = null;

	for (const line of lines) {
		// Skip metadata header
		if (line.startsWith('#') || line.startsWith('**') || line.startsWith('---')) continue;

		// Paragraph ID marker: <!-- p-N -->
		const pidMatch = line.match(/^<!--\s*(p-\d+)\s*-->$/);
		if (pidMatch) {
			nextParagraphId = pidMatch[1];
			continue;
		}

		// Directive: [narrator:mood] or [voice:id, style:style] or [pause:Nms] or [emphasis]
		const directiveMatch = line.match(/^\[(.+)\]\s*$/);
		if (directiveMatch) {
			if (current && current.text.trim()) {
				segments.push(current);
			}

			const directive = directiveMatch[1];

			// Pause directive
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

			// Parse voice/narrator directive
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

			// Parse style from remaining parts
			for (const part of parts.slice(1)) {
				if (part.startsWith('style:')) {
					style = part.split(':')[1];
				}
			}

			current = {
				type: 'speech',
				voiceType,
				voiceId,
				mood,
				style,
				emphasis,
				text: '',
			};
			continue;
		}

		// Regular text line
		if (current) {
			if (line.trim()) {
				if (nextParagraphId) {
					current.paragraphId = nextParagraphId;
					nextParagraphId = null;
				}
				current.text += (current.text ? ' ' : '') + line.trim();
			} else if (current.text.trim()) {
				// Empty line = paragraph break, push current and start new with same settings
				segments.push(current);
				current = { ...current, text: '', paragraphId: undefined };
			}
		}
	}

	if (current && current.text.trim()) {
		segments.push(current);
	}

	return segments;
}

/**
 * Resolve the Azure voice ID for a segment.
 */
function resolveVoice(segment) {
	if (segment.voiceType === 'narrator') {
		return voices.narrator.voice;
	}
	if (segment.voiceId === 'boss') {
		return voices.special['boss-quotes'].voice;
	}
	if (segment.voiceId === 'dutch') {
		return voices.special.dutch.voice;
	}
	if (voices.agents[segment.voiceId]) {
		return voices.agents[segment.voiceId].voice;
	}
	return voices.narrator.voice;
}

/**
 * Get the style for a segment.
 * Each voice has ONE consistent style. Moods only affect prosody, not style.
 */
function resolveStyle(segment) {
	if (segment.style) return segment.style;

	if (segment.voiceType === 'narrator') {
		return voices.narrator.style || 'empathetic';
	}
	if (segment.voiceId === 'boss') {
		return voices.special['boss-quotes'].style || 'chat';
	}
	if (segment.voiceId && voices.agents[segment.voiceId]) {
		return voices.agents[segment.voiceId].style || 'default';
	}
	return 'default';
}

/**
 * Apply pronunciation fixes to text.
 */
function applyPronunciation(text) {
	let result = text;

	for (const [term, config] of Object.entries(pronunciation.terms)) {
		if (!result.includes(term)) continue;

		if (config.sub) {
			// Simple substitution (PascalCase breaking etc.)
			result = result.replace(new RegExp(escapeRegex(term), 'g'), config.sub);
		}
		// IPA and say-as are handled in SSML generation, not text substitution
	}

	return result;
}

function escapeRegex(str) {
	return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Get prosody attributes for a mood.
 */
function getMoodProsody(mood) {
	const preset = moods.presets[mood];
	if (!preset) return '';

	const attrs = [];
	if (preset.rate && preset.rate !== '0%') attrs.push(`rate="${preset.rate}"`);
	if (preset.pitch && preset.pitch !== '0%') attrs.push(`pitch="${preset.pitch}"`);
	if (preset.volume && preset.volume !== 'medium') attrs.push(`volume="${preset.volume}"`);

	return attrs.length > 0 ? attrs.join(' ') : '';
}

/**
 * Apply IPA pronunciation via SSML phoneme tags.
 */
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

	// Handle {{number}} markers — force cardinal pronunciation
	result = result.replace(/\{\{(\w+)\}\}/g, '<say-as interpret-as="cardinal">$1</say-as>');

	return result;
}

/**
 * Build the complete SSML document from parsed segments.
 */
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
		const style = resolveStyle(segment);
		const prosody = getMoodProsody(segment.mood);

		// Apply text transformations
		let text = applyPronunciation(segment.text);
		text = applyIpaPronunciation(text);

		// Switch voice if needed
		if (voiceId !== currentVoice) {
			if (currentVoice) {
				ssmlParts.push(`  </voice>`);
			}
			const lang = voiceId.startsWith('nl-') ? 'nl-NL' : 'en-US';
			ssmlParts.push(`  <voice name="${voiceId}" xml:lang="${lang}">`);
			currentVoice = voiceId;
		}

		// Build the speech element
		// Azure nesting order: express-as > prosody > emphasis > text
		let speechXml = text;

		if (segment.emphasis) {
			speechXml = `<emphasis level="moderate">${speechXml}</emphasis>`;
		}
		if (prosody) {
			speechXml = `<prosody ${prosody}>${speechXml}</prosody>`;
		}
		if (style && style !== 'default') {
			speechXml = `    <mstts:express-as style="${style}">${speechXml}</mstts:express-as>`;
		}

		ssmlParts.push(speechXml);

		// Add a small break between paragraphs
		ssmlParts.push(`    <break time="200ms"/>`);
	}

	if (currentVoice) {
		ssmlParts.push(`  </voice>`);
	}

	ssmlParts.push(`</speak>`);

	return ssmlParts.join('\n');
}

/**
 * Call Azure Speech API to synthesize SSML to audio.
 */
async function synthesizeToAudio(ssml, outputPath) {
	const apiKey = process.env.AZURE_SPEECH_KEY;
	const region = process.env.AZURE_SPEECH_REGION;

	if (!apiKey || !region) {
		throw new Error('AZURE_SPEECH_KEY and AZURE_SPEECH_REGION environment variables are required.');
	}

	const url = `https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`;

	const response = await fetch(url, {
		method: 'POST',
		headers: {
			'Ocp-Apim-Subscription-Key': apiKey,
			'Content-Type': 'application/ssml+xml',
			'X-Microsoft-OutputFormat': 'audio-24khz-96kbitrate-mono-mp3',
			'User-Agent': 'ShippingInTheDark-AudioPipeline',
		},
		body: ssml,
	});

	if (!response.ok) {
		const errorBody = await response.text();
		throw new Error(`Azure Speech API error ${response.status}: ${errorBody}`);
	}

	const buffer = Buffer.from(await response.arrayBuffer());
	writeFileSync(outputPath, buffer);

	return buffer.length;
}

/**
 * Count characters that will be billed (text content only, not SSML tags).
 */
function countBillableCharacters(ssml) {
	// Strip all XML tags to get just the text content
	return ssml.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim().length;
}

function formatVttTime(ms) {
	const totalSeconds = Math.floor(ms / 1000);
	const hours = Math.floor(totalSeconds / 3600);
	const minutes = Math.floor((totalSeconds % 3600) / 60);
	const seconds = totalSeconds % 60;
	const millis = Math.round(ms % 1000);
	return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(millis).padStart(3, '0')}`;
}

// === CLI ===

const args = process.argv.slice(2);
const command = args[0] || 'help';
const scriptPath = args[1];

switch (command) {
	case 'parse': {
		if (!scriptPath) { console.error('Usage: node synthesize.mjs parse <script.speech.md>'); process.exit(1); }
		const segments = parseSpeechScript(scriptPath);
		console.log(JSON.stringify(segments, null, 2));
		break;
	}

	case 'ssml': {
		if (!scriptPath) { console.error('Usage: node synthesize.mjs ssml <script.speech.md>'); process.exit(1); }
		const segments = parseSpeechScript(scriptPath);
		const ssml = buildSsml(segments);
		console.log(ssml);
		console.log(`\n--- Billable characters: ${countBillableCharacters(ssml).toLocaleString()} ---`);
		break;
	}

	case 'test': {
		if (!scriptPath) { console.error('Usage: node synthesize.mjs test <script.speech.md>'); process.exit(1); }
		console.log('🎙️  Generating test audio (intro section)...\n');

		const segments = parseSpeechScript(scriptPath);
		const testSegments = segments.slice(0, 20);
		const ssml = buildSsml(testSegments);

		const chars = countBillableCharacters(ssml);
		console.log(`  Segments: ${testSegments.length}`);
		console.log(`  Billable characters: ${chars.toLocaleString()}`);

		const outputPath = join(outputDir, 'test-output.mp3');

		try {
			const size = await synthesizeToAudio(ssml, outputPath);
			console.log(`\n  ✅ Audio generated: ${outputPath}`);
			console.log(`  File size: ${(size / 1024).toFixed(1)} KB`);
		} catch (err) {
			console.error(`\n  ❌ Synthesis failed: ${err.message}`);
			// Save SSML for debugging
			const debugPath = join(outputDir, 'test-debug.ssml');
			writeFileSync(debugPath, ssml);
			console.log(`  SSML saved to: ${debugPath}`);
			process.exit(1);
		}
		break;
	}

	case 'full': {
		if (!scriptPath) { console.error('Usage: node synthesize.mjs full <script.speech.md> [output.mp3]'); process.exit(1); }
		const outputPath = args[2] || join(outputDir, 'full-output.mp3');

		console.log('🎙️  Generating full audio with chunking...\n');

		const segments = parseSpeechScript(scriptPath);
		const totalChars = countBillableCharacters(buildSsml(segments));
		console.log(`  Total segments: ${segments.length}`);
		console.log(`  Total billable characters: ${totalChars.toLocaleString()}`);

		// Chunk segments: keep each chunk under 5,000 billable chars
		// (safe margin — Azure allows 64KB SSML / 10 min audio)
		const MAX_CHARS_PER_CHUNK = 5000;
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

		console.log(`  Chunks: ${chunks.length}\n`);

		const chunkFiles = [];
		let totalSize = 0;
		let totalBilled = 0;

		for (let i = 0; i < chunks.length; i++) {
			const chunkSsml = buildSsml(chunks[i]);
			const chunkChars = countBillableCharacters(chunkSsml);
			const chunkPath = join(outputDir, `chunk-${i}.mp3`);

			console.log(`  Chunk ${i + 1}/${chunks.length}: ${chunks[i].filter(s => s.type !== 'pause').length} segments, ${chunkChars.toLocaleString()} chars`);

			try {
				const size = await synthesizeToAudio(chunkSsml, chunkPath);
				console.log(`    ✅ ${(size / 1024).toFixed(1)} KB`);
				chunkFiles.push(chunkPath);
				totalSize += size;
				totalBilled += chunkChars;
			} catch (err) {
				console.error(`    ❌ Chunk ${i + 1} failed: ${err.message}`);
				const debugPath = join(outputDir, `chunk-${i}-debug.ssml`);
				writeFileSync(debugPath, chunkSsml);
				console.log(`    SSML saved to: ${debugPath}`);
				// Clean up any successful chunks
				chunkFiles.forEach(f => { try { unlinkSync(f); } catch {} });
				process.exit(1);
			}
		}

		// Concatenate chunks with ffmpeg
		if (chunkFiles.length === 1) {
			// Single chunk — just rename
			renameSync(chunkFiles[0], outputPath);
		} else {
			console.log(`\n  Concatenating ${chunkFiles.length} chunks with ffmpeg...`);
			const listPath = join(outputDir, 'concat-list.txt');
			writeFileSync(listPath, chunkFiles.map(f => `file '${f}'`).join('\n'));

			const { execSync: exec } = await import('node:child_process');
			try {
				exec(`ffmpeg -y -f concat -safe 0 -i "${listPath}" -c copy "${outputPath}"`, { stdio: 'pipe' });
				console.log(`  ✅ Concatenation complete`);
			} catch (err) {
				console.error(`  ❌ ffmpeg concat failed: ${err.message}`);
				console.log(`  Chunk files preserved in output/ for manual concat`);
				process.exit(1);
			}

			// Clean up chunks and list
			chunkFiles.forEach(f => { try { unlinkSync(f); } catch {} });
			try { unlinkSync(listPath); } catch {}
		}

		// Generate VTT with estimated timing from character ratios
		// Average speech rate: ~150 words/min ≈ 750 chars/min ≈ 12.5 chars/sec
		const CHARS_PER_SECOND = 12.5;
		const speechSegs = segments.filter(s => s.type === 'speech' && s.text.trim());
		const totalTextChars = speechSegs.reduce((sum, s) => sum + s.text.length, 0);
		const totalPauseMs = segments.filter(s => s.type === 'pause').reduce((sum, s) => sum + s.duration, 0);

		// Estimate total audio duration from MP3 file size (96kbps = 12000 bytes/sec)
		const estimatedDurationSec = totalSize / 12000;
		const speechDurationSec = estimatedDurationSec - (totalPauseMs / 1000);
		const adjustedCharsPerSec = totalTextChars / Math.max(speechDurationSec, 1);

		let vttLines = ['WEBVTT', ''];
		let cueNum = 1;
		let offsetMs = 0;

		for (const seg of segments) {
			if (seg.type === 'pause') {
				offsetMs += seg.duration;
				continue;
			}
			if (!seg.text.trim()) continue;

			const durationMs = (seg.text.length / adjustedCharsPerSec) * 1000;
			const startMs = offsetMs;
			const endMs = offsetMs + durationMs;

			const cueText = seg.paragraphId || ('--' + seg.text);

			vttLines.push(String(cueNum));
			vttLines.push(`${formatVttTime(startMs)} --> ${formatVttTime(endMs)}`);
			vttLines.push(cueText);
			vttLines.push('');

			offsetMs = endMs + 200; // 200ms inter-segment gap
			cueNum++;
		}

		const vttPath = outputPath.replace(/\.mp3$/, '.vtt');
		writeFileSync(vttPath, vttLines.join('\n'));
		console.log(`  VTT: ${vttPath} (${cueNum - 1} cues, estimated timing)`);

		console.log(`\n  ✅ Audio generated: ${outputPath}`);
		console.log(`  File size: ${(totalSize / 1024).toFixed(1)} KB`);
		console.log(`  Characters used: ${totalBilled.toLocaleString()}`);
		break;
	}

	default:
		console.log('Usage:');
		console.log('  node synthesize.mjs parse <script.speech.md>   — Parse script into segments (JSON)');
		console.log('  node synthesize.mjs ssml <script.speech.md>    — Generate SSML from script');
		console.log('  node synthesize.mjs test <script.speech.md>    — Synthesize first few segments (test)');
		console.log('  node synthesize.mjs full <script.speech.md>    — Synthesize full audio');
}
