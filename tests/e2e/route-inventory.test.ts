import assert from 'node:assert/strict';
import test from 'node:test';
import { existsSync } from 'node:fs';

test('critical public and submission routes exist for browser smoke setup', () => {
  const routes = [
    'src/app/page.tsx',
    'src/app/submit/page.tsx',
    'src/app/api/submit/route.ts',
    'src/app/api/auth/request-code/route.ts',
    'src/app/api/auth/callback/route.ts',
    'src/app/api/auth/session/route.ts',
    'src/app/api/auth/signout/route.ts',
    'src/app/api/me/saves/route.ts',
    'src/app/api/me/follows/route.ts',
    'src/app/api/me/alerts/route.ts',
    'src/app/login/page.tsx',
    'src/proxy.ts',
    'src/app/sitemap.ts',
  ];
  for (const route of routes) assert.equal(existsSync(route), true, route);
});
