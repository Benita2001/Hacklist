import assert from 'node:assert/strict';
import test from 'node:test';
import { existsSync } from 'node:fs';

test('critical public and submission routes exist for browser smoke setup', () => {
  const routes = [
    'src/app/page.tsx',
    'src/app/submit/page.tsx',
    'src/app/api/submit/route.ts',
    'src/app/sitemap.ts',
  ];
  for (const route of routes) assert.equal(existsSync(route), true, route);
});
