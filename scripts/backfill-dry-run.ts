import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { inspectLegacyBackfill } from '../src/domain/opportunities/backfill.ts';

const file = resolve(process.cwd(), 'data', 'hackathons.json');
const rows = JSON.parse(readFileSync(file, 'utf8')) as Array<Record<string, unknown>>;
const report = inspectLegacyBackfill([{ type: 'hackathon', rows }]);
console.log(JSON.stringify({ source: 'data/hackathons.json', ...report }, null, 2));
