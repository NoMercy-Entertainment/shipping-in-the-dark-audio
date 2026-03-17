#!/usr/bin/env node

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
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

	for (const line of lines) {
		// Skip metadata header
		if (line.startsWith('#') || line.startsWith('**') || line.startsWith('---')) continue;

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
				current.text += (current.text ? ' ' : '') + line.trim();
			} else if (current.text.trim()) {
				// Empty line = paragraph break, push current and start new with same settings
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
		let speechXml = text;

		// Wrap in express-as style if not default
		if (style && style !== 'default') {
			speechXml = `    <mstts:express-as style="${style}">${speechXml}</mstts:express-as>`;
		}

		// Wrap in prosody if mood has settings
		if (prosody) {
			speechXml = `    <prosody ${prosody}>${speechXml}</prosody>`;
		}

		// Wrap in emphasis if marked
		if (segment.emphasis) {
			speechXml = `    <emphasis level="moderate">${speechXml}</emphasis>`;
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

		console.log('🎙️  Generating full audio...\n');

		const segments = parseSpeechScript(scriptPath);
		const ssml = buildSsml(segments);

		const chars = countBillableCharacters(ssml);
		console.log(`  Segments: ${segments.length}`);
		console.log(`  Billable characters: ${chars.toLocaleString()}`);

		try {
			const size = await synthesizeToAudio(ssml, outputPath);
			console.log(`\n  ✅ Audio generated: ${outputPath}`);
			console.log(`  File size: ${(size / 1024).toFixed(1)} KB`);
			console.log(`  Characters used: ${chars.toLocaleString()}`);
		} catch (err) {
			console.error(`\n  ❌ Synthesis failed: ${err.message}`);
			const debugPath = join(outputDir, 'debug.ssml');
			writeFileSync(debugPath, ssml);
			console.log(`  SSML saved to: ${debugPath}`);
			process.exit(1);
		}
		break;
	}

	default:
		console.log('Usage:');
		console.log('  node synthesize.mjs parse <script.speech.md>   — Parse script into segments (JSON)');
		console.log('  node synthesize.mjs ssml <script.speech.md>    — Generate SSML from script');
		console.log('  node synthesize.mjs test <script.speech.md>    — Synthesize first few segments (test)');
		console.log('  node synthesize.mjs full <script.speech.md>    — Synthesize full audio');
}
