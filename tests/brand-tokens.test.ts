import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const tokens = JSON.parse(readFileSync('brand/tokens/brand.json', 'utf8')) as {
  status: string;
  colors: Record<string, string>;
  typography: Record<string, string>;
  motion: Record<string, string>;
  deferred: string[];
};
const css = readFileSync('brand/tokens/brand.css', 'utf8');
const reviewCss = readFileSync('src/styles/brand-review.css', 'utf8');
const reviewPage = readFileSync('src/app/brand/page.tsx', 'utf8');

test('brand package stays provisional until rights and master geometry are approved', () => {
  assert.equal(tokens.status, 'provisional-digital-study');
  for (const role of ['ink', 'forest', 'forest2', 'cream', 'paper', 'olive', 'signal', 'gold']) {
    assert.match(tokens.colors[role], /^#[0-9A-F]{6}$/i);
  }
  for (const role of ['display', 'interface', 'evidence']) {
    assert.ok(tokens.typography[role]);
  }
  for (const deliverable of ['vector-master', 'lockups', 'favicon-family', 'font-licenses']) {
    assert.ok(tokens.deferred.includes(deliverable));
  }
  assert.match(css, /provisional digital-study/i);
  assert.match(reviewPage, /existing PNG remains unchanged|supplied compass/i);
});

test('brand motion review provides a reduced-motion alternative', () => {
  assert.match(tokens.motion.radar, /^\d+s$/);
  assert.match(css, /--hl-motion-radar/);
  assert.match(reviewCss, /prefers-reduced-motion/);
});
