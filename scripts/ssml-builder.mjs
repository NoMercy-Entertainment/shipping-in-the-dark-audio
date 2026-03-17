import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const configDir = join(__dirname, '..', 'config');

/**
 * SSML Builder for Shipping in the Dark audio narration.
 *
 * Converts a journal entry markdown into a multi-voice SSML document.
 * This is the skeleton — the actual SSML synthesis implementation
 * should be built with Azure Speech expertise (consider Copilot).
 *
 * The builder handles:
 * - Voice switching based on agent mentions and quoted speech
 * - Pronunciation dictionary application
 * - Mood/prosody changes based on section headings and content patterns
 * - Code block handling (read naturally, not literally)
 * - Callout block styling
 * - Language switching for non-English content (Dutch quotes)
 */

export function loadConfig() {
	return {
		voices: JSON.parse(readFileSync(join(configDir, 'voices.json'), 'utf8')),
		pronunciation: JSON.parse(readFileSync(join(configDir, 'pronunciation.json'), 'utf8')),
		moods: JSON.parse(readFileSync(join(configDir, 'moods.json'), 'utf8')),
	};
}

/**
 * Parse a journal entry markdown into sections for SSML generation.
 * Strips frontmatter, splits by headings, identifies:
 * - Narrative prose (narrator voice)
 * - Blockquotes (boss/human voice)
 * - Code blocks (skip or summarize)
 * - Callout blocks (narrator with emphasis)
 * - Agent mentions in context
 * - Dutch text (language switch)
 */
export function parseEntry(markdown) {
	const body = markdown.replace(/^---[\s\S]*?---\s*/, '');
	const sections = [];
	let currentSection = { heading: null, mood: 'cozy', blocks: [] };

	const lines = body.split('\n');
	let i = 0;

	while (i < lines.length) {
		const line = lines[i];

		// Heading
		const headingMatch = line.match(/^(#{1,4})\s+(.+)$/);
		if (headingMatch) {
			if (currentSection.blocks.length > 0) {
				sections.push(currentSection);
			}
			currentSection = {
				heading: headingMatch[2],
				depth: headingMatch[1].length,
				mood: detectMood(headingMatch[2]),
				blocks: [],
			};
			i++;
			continue;
		}

		// Fenced code block — skip (don't read code aloud)
		if (line.startsWith('```')) {
			const lang = line.slice(3).trim();
			i++;
			const codeLines = [];
			while (i < lines.length && !lines[i].startsWith('```')) {
				codeLines.push(lines[i]);
				i++;
			}
			i++; // skip closing ```
			currentSection.blocks.push({
				type: 'code',
				language: lang,
				content: codeLines.join('\n'),
			});
			continue;
		}

		// Callout block
		if (line.includes('<!--@callout')) {
			const typeMatch = line.match(/type="(\w+)"/);
			const calloutType = typeMatch ? typeMatch[1] : 'info';
			i++;
			const calloutLines = [];
			while (i < lines.length && !lines[i].includes('-->')) {
				calloutLines.push(lines[i]);
				i++;
			}
			i++; // skip -->
			currentSection.blocks.push({
				type: 'callout',
				calloutType,
				content: calloutLines.join('\n').trim(),
			});
			continue;
		}

		// Blockquote (boss speaking)
		if (line.startsWith('>')) {
			const quoteLines = [line.replace(/^>\s*/, '')];
			i++;
			while (i < lines.length && lines[i].startsWith('>')) {
				quoteLines.push(lines[i].replace(/^>\s*/, ''));
				i++;
			}
			currentSection.blocks.push({
				type: 'quote',
				speaker: 'boss',
				content: quoteLines.join(' ').trim(),
			});
			continue;
		}

		// Table — summarize, don't read cell by cell
		if (line.includes('|') && line.trim().startsWith('|')) {
			const tableLines = [line];
			i++;
			while (i < lines.length && lines[i].includes('|') && lines[i].trim().startsWith('|')) {
				tableLines.push(lines[i]);
				i++;
			}
			currentSection.blocks.push({
				type: 'table',
				content: tableLines.join('\n'),
			});
			continue;
		}

		// Regular paragraph
		if (line.trim().length > 0) {
			const paraLines = [line];
			i++;
			while (i < lines.length && lines[i].trim().length > 0 && !lines[i].startsWith('#') && !lines[i].startsWith('>') && !lines[i].startsWith('```') && !lines[i].startsWith('|')) {
				paraLines.push(lines[i]);
				i++;
			}
			currentSection.blocks.push({
				type: 'prose',
				content: paraLines.join(' ').trim(),
			});
			continue;
		}

		i++;
	}

	if (currentSection.blocks.length > 0) {
		sections.push(currentSection);
	}

	return sections;
}

/**
 * Detect mood from heading text or content.
 */
function detectMood(heading) {
	const config = JSON.parse(readFileSync(join(configDir, 'moods.json'), 'utf8'));
	const hints = config.section_hints?.headings || {};

	for (const [pattern, mood] of Object.entries(hints)) {
		if (heading.toLowerCase().includes(pattern.toLowerCase())) {
			return mood;
		}
	}

	return 'matter-of-fact';
}

/**
 * Strip markdown formatting from text for speech.
 * Removes: **bold**, *italic*, `code`, [links](url), etc.
 */
export function stripMarkdown(text) {
	return text
		.replace(/\*\*([^*]+)\*\*/g, '$1')         // bold
		.replace(/\*([^*]+)\*/g, '$1')               // italic
		.replace(/`([^`]+)`/g, '$1')                 // inline code
		.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')     // links
		.replace(/<!--[\s\S]*?-->/g, '')              // HTML comments
		.replace(/<[^>]+>/g, '')                      // HTML tags
		.trim();
}

/**
 * Count characters in a parsed entry (for budget estimation).
 * Only counts text that would be synthesized — skips code blocks.
 */
export function estimateCharacters(sections) {
	let count = 0;
	for (const section of sections) {
		if (section.heading) {
			count += stripMarkdown(section.heading).length;
		}
		for (const block of section.blocks) {
			if (block.type === 'code') continue; // skip code
			if (block.type === 'table') continue; // tables are summarized, estimate later
			count += stripMarkdown(block.content).length;
		}
	}
	return count;
}

/**
 * TODO: Build the actual SSML document from parsed sections.
 * This is where Azure Speech expertise is needed.
 * Consider bringing in Copilot for:
 * - Optimal SSML structure for multi-voice long-form synthesis
 * - Express-as style support per voice
 * - Prosody tag best practices
 * - Chunking strategy for Azure's character limits per request
 * - Audio output format (high quality MP3 for blog playback)
 */
export function buildSsml(sections, config) {
	// Skeleton — to be implemented with Azure Speech expertise
	throw new Error('SSML builder not yet implemented. See TODO in source.');
}
