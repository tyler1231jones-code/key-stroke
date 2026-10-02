// Prints the figures the site computes from the ledger. Run: node tools/verify-ledger.mjs [YYYY-MM-DD]
import { readFileSync } from 'node:fs';
import { dateInZone, total, totalWeekAgo, clearedPerYear, accrual } from '../src/lib/ledger.ts';

const site = JSON.parse(readFileSync(new URL('../src/content/site.json', import.meta.url), 'utf8'));
const rows = JSON.parse(readFileSync(new URL('../src/content/ledger.json', import.meta.url), 'utf8'));
const date = process.argv[2] || dateInZone(site.timezone);

console.log(`date (${site.timezone}): ${date}`);
console.log(`homepage total: ${total(rows, date)}   seven days earlier: ${totalWeekAgo(rows, date)}`);
for (const u of [...new Set(rows.map((r) => r.crewUnit))].sort()) {
  console.log(`unit ${u}: ${total(rows.filter((r) => r.crewUnit === u), date)}`);
}
for (const r of rows) {
  console.log(`${r.id}  cleared/yr ${clearedPerYear(r)}  accrued ${accrual(r, date).toFixed(1)}`);
}
