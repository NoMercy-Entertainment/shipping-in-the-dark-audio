#!/usr/bin/env node

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { join, basename, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { hashEntry, loadHashes, getHash } from './hash.mjs';
import { canAfford, recordGeneration, getBudgetStatus } from './budget-check.mjs';
import { parseEntry, estimateCharacters, loadConfig, stripMarkdown } from './ssml-builder.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');
const entriesDir = join(rootDir, 'entries');
const outputDir = join(rootDir, 'output');

// Ensure output directory exists
if (!existsSync(outputDir)) {
	mkdirSync(outputDir, { recursive: true });
}

async function main() {
	const args = process.argv.slice(2);
	const command = args[0] || 'status';

	switch (command) {
		case 'status':
			showStatus();
			break;
		case 'check':
			checkEntries();
			break;
		case 'estimate':
			estimateCosts();
			break;
		case 'generate':
			await generateAudio(args[1]);
			break;
		default:
			console.log('Usage:');
			console.log('  node generate.mjs status     — Show budget and generation status');
			console.log('  node generate.mjs check      — Check which entries need (re)generation');
			console.log('  node generate.mjs estimate    — Estimate character costs for pending entries');
			console.log('  node generate.mjs generate    — Generate audio for all pending entries');
			console.log('  node generate.mjs generate <slug> — Generate audio for a specific entry');
	}
}

function getEntries() {
	if (!existsSync(entriesDir)) {
		console.log('No entries directory found. Clone entries from shipping-in-the-dark repo first.');
		return [];
	}
	return readdirSync(entriesDir)
		.filter(f => f.endsWith('.md'))
		.map(f => ({
			filename: f,
			path: join(entriesDir, f),
			slug: f.replace(/^\d{4}-\d{2}-\d{2}-\d{3}-/, '').replace(/\.md$/, ''),
		}));
}

function showStatus() {
	console.log('\n📊 Budget Status\n');
	const status = getBudgetStatus();
	console.log(`  Monthly limit:     ${status.monthlyLimit.toLocaleString()} characters`);
	console.log(`  Journal reserve:   ${status.journalReserve.toLocaleString()} characters`);
	console.log(`  Used this month:   ${status.usedThisMonth.toLocaleString()} characters`);
	console.log(`  Remaining:         ${status.remaining.toLocaleString()} characters`);
	console.log(`  Twitch remaining:  ${status.twitchRemaining.toLocaleString()} characters`);

	if (status.entries.length > 0) {
		console.log('\n  Generations this month:');
		status.entries.forEach(e => {
			console.log(`    ${e.slug}: ${e.characters.toLocaleString()} chars (${e.timestamp})`);
		});
	}
	console.log();
}

function checkEntries() {
	const entries = getEntries();
	if (entries.length === 0) return;

	const hashes = loadHashes();

	console.log('\n🔍 Entry Status\n');
	for (const entry of entries) {
		const currentHash = getHash(entry.path);
		const storedHash = hashes[entry.slug];
		const needsRegen = currentHash !== storedHash;

		const icon = needsRegen ? (storedHash ? '🔄' : '🆕') : '✅';
		const status = needsRegen ? (storedHash ? 'changed — needs regeneration' : 'new — needs generation') : 'up to date';
		console.log(`  ${icon} ${entry.slug}: ${status}`);
	}
	console.log();
}

function estimateCosts() {
	const entries = getEntries();
	if (entries.length === 0) return;

	const hashes = loadHashes();
	let totalChars = 0;

	console.log('\n💰 Character Estimates\n');
	for (const entry of entries) {
		const currentHash = getHash(entry.path);
		const needsRegen = hashes[entry.slug] !== currentHash;
		if (!needsRegen) {
			console.log(`  ⏭️  ${entry.slug}: up to date (skipping)`);
			continue;
		}

		const content = readFileSync(entry.path, 'utf8');
		const sections = parseEntry(content);
		const chars = estimateCharacters(sections);
		totalChars += chars;

		console.log(`  📝 ${entry.slug}: ~${chars.toLocaleString()} characters`);
	}

	console.log(`\n  Total pending: ~${totalChars.toLocaleString()} characters`);

	const budget = canAfford(totalChars);
	if (budget.canAfford) {
		console.log(`  ✅ Within budget (${budget.remaining.toLocaleString()} remaining after generation)`);
	} else {
		console.log(`  ❌ Over budget! Need ${totalChars.toLocaleString()} but only ${budget.remaining.toLocaleString()} remaining`);
	}
	console.log();
}

async function generateAudio(specificSlug) {
	const entries = getEntries();
	if (entries.length === 0) return;

	const hashes = loadHashes();
	const config = loadConfig();
	const pending = [];

	for (const entry of entries) {
		if (specificSlug && entry.slug !== specificSlug) continue;

		const currentHash = getHash(entry.path);
		if (hashes[entry.slug] === currentHash) {
			console.log(`⏭️  ${entry.slug}: hash unchanged, skipping`);
			continue;
		}
		pending.push({ ...entry, hash: currentHash });
	}

	if (pending.length === 0) {
		console.log('\n✅ All entries are up to date. Nothing to generate.\n');
		return;
	}

	// Estimate total characters
	let totalChars = 0;
	for (const entry of pending) {
		const content = readFileSync(entry.path, 'utf8');
		const sections = parseEntry(content);
		totalChars += estimateCharacters(sections);
	}

	// Budget check
	const budget = canAfford(totalChars);
	if (!budget.canAfford) {
		console.error(`\n❌ Cannot generate: need ~${totalChars.toLocaleString()} characters but only ${budget.remaining.toLocaleString()} remaining in budget.\n`);
		process.exit(1);
	}

	console.log(`\n🎙️  Generating audio for ${pending.length} entries (~${totalChars.toLocaleString()} characters)\n`);

	for (const entry of pending) {
		console.log(`  📝 ${entry.slug}...`);

		const content = readFileSync(entry.path, 'utf8');
		const sections = parseEntry(content);
		const chars = estimateCharacters(sections);

		// TODO: Build SSML and call Azure Speech API
		// This is where Copilot/Azure expertise comes in.
		// For now, just validate the pipeline works.
		console.log(`     Parsed ${sections.length} sections, ~${chars.toLocaleString()} characters`);
		console.log(`     ⚠️  SSML synthesis not yet implemented — dry run only`);

		// In production, after successful synthesis:
		// 1. Save MP3 to output/
		// 2. Record in budget
		// 3. Update hash
		// recordGeneration(entry.slug, chars);
		// hashes[entry.slug] = entry.hash;
	}

	// In production, save updated hashes:
	// writeFileSync(join(outputDir, 'hashes.json'), JSON.stringify(hashes, null, '\t') + '\n');

	console.log('\n✅ Dry run complete. Implement SSML synthesis to generate actual audio.\n');
}

main().catch(err => {
	console.error('Error:', err.message);
	process.exit(1);
});
