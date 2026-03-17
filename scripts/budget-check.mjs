import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const budgetPath = join(__dirname, '..', 'config', 'budget.json');

/**
 * Check if we have enough budget to generate audio for the given character count.
 */
export function canAfford(characterCount) {
	const budget = JSON.parse(readFileSync(budgetPath, 'utf8'));
	const currentMonth = getCurrentMonth();
	const usedThisMonth = budget.generated
		.filter(g => g.month === currentMonth)
		.reduce((sum, g) => sum + g.characters, 0);

	const remaining = budget.journal_reserve - usedThisMonth;
	return {
		canAfford: characterCount <= remaining,
		remaining,
		requested: characterCount,
		monthlyReserve: budget.journal_reserve,
		usedThisMonth,
	};
}

/**
 * Record a generation in the budget.
 */
export function recordGeneration(slug, characterCount) {
	const budget = JSON.parse(readFileSync(budgetPath, 'utf8'));
	budget.generated.push({
		slug,
		characters: characterCount,
		month: getCurrentMonth(),
		timestamp: new Date().toISOString(),
	});
	writeFileSync(budgetPath, JSON.stringify(budget, null, '\t') + '\n');
}

/**
 * Show budget status.
 */
export function getBudgetStatus() {
	const budget = JSON.parse(readFileSync(budgetPath, 'utf8'));
	const currentMonth = getCurrentMonth();
	const usedThisMonth = budget.generated
		.filter(g => g.month === currentMonth)
		.reduce((sum, g) => sum + g.characters, 0);

	return {
		monthlyLimit: budget.monthly_limit,
		journalReserve: budget.journal_reserve,
		usedThisMonth,
		remaining: budget.journal_reserve - usedThisMonth,
		twitchRemaining: budget.monthly_limit - budget.journal_reserve,
		entries: budget.generated.filter(g => g.month === currentMonth),
	};
}

function getCurrentMonth() {
	const now = new Date();
	return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}
