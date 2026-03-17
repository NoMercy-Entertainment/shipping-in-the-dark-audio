import { createHash } from 'node:crypto';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outputDir = join(__dirname, '..', 'output');
const configDir = join(__dirname, '..', 'config');

/**
 * Generate a content hash for an entry.
 * Hash includes: entry body + voice cast + pronunciation dict + mood config.
 * If any of these change, the audio should be regenerated.
 */
export function hashEntry(entryPath) {
	const hash = createHash('sha256');

	// Entry body (strip frontmatter)
	const content = readFileSync(entryPath, 'utf8');
	const body = content.replace(/^---[\s\S]*?---\s*/, '');
	hash.update(body);

	// Voice cast config
	const voices = readFileSync(join(configDir, 'voices.json'), 'utf8');
	hash.update(voices);

	// Pronunciation dictionary
	const pronunciation = readFileSync(join(configDir, 'pronunciation.json'), 'utf8');
	hash.update(pronunciation);

	// Mood config
	const moods = readFileSync(join(configDir, 'moods.json'), 'utf8');
	hash.update(moods);

	return hash.digest('hex');
}

/**
 * Load previously generated hashes.
 */
export function loadHashes() {
	const hashFile = join(outputDir, 'hashes.json');
	if (!existsSync(hashFile)) return {};
	return JSON.parse(readFileSync(hashFile, 'utf8'));
}

/**
 * Check if an entry needs regeneration.
 */
export function needsRegeneration(slug, entryPath) {
	const currentHash = hashEntry(entryPath);
	const stored = loadHashes();
	return stored[slug] !== currentHash;
}

/**
 * Get the current hash for an entry.
 */
export function getHash(entryPath) {
	return hashEntry(entryPath);
}
