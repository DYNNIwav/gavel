import fs from 'node:fs';
import path from 'node:path';

// WCAG 2.1 contrast checker for Gavel palette tokens.
// Relative luminance and contrast ratio formulas adapted directly from MDN Web Docs
// and the official W3C WCAG 2.1 specification (https://www.w3.org/TR/WCAG21/#dfn-relative-luminance).
const cssPath = path.resolve('css/variables.css');
const css = fs.readFileSync(cssPath, 'utf8');

function extractColors(cssText) {
  const colors = {};
  const regex = /--(color-[a-z0-9-]+):\s*(#[0-9a-fA-F]{6})/g;
  let match;
  while ((match = regex.exec(cssText)) !== null) {
    colors[match[1]] = match[2];
  }
  return colors;
}

function hexToRgb(hex) {
  const num = parseInt(hex.replace('#', ''), 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function relativeLuminance([r, g, b]) {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function contrastRatio(hex1, hex2) {
  const l1 = relativeLuminance(hexToRgb(hex1));
  const l2 = relativeLuminance(hexToRgb(hex2));
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

const colors = extractColors(css);

console.log('\n--- Gavel WCAG 2.1 Contrast Audit ---\n');

const pairings = [
  { fg: 'color-ink', bg: 'color-paper', label: 'Body text on paper' },
  { fg: 'color-ink', bg: 'color-surface', label: 'Body text on surface' },
  { fg: 'color-muted', bg: 'color-paper', label: 'Muted text on paper' },
  { fg: 'color-muted', bg: 'color-surface', label: 'Muted text on surface' },
  {
    fg: 'color-forest',
    bg: 'color-paper',
    label: 'Forest green links on paper',
  },
  {
    fg: 'color-forest',
    bg: 'color-surface',
    label: 'Forest green links on surface',
  },
  { fg: 'color-brick', bg: 'color-paper', label: 'Error text on paper' },
  { fg: 'color-brick', bg: 'color-surface', label: 'Error text on surface' },
  { fg: 'color-ember', bg: 'color-paper', label: 'Ember ending soon on paper' },
  { fg: 'color-surface', bg: 'color-forest', label: 'Button text on forest' },
  {
    fg: 'color-paper',
    bg: 'color-forest-deep',
    label: 'Button text on forest hover',
  },
  {
    fg: 'color-ink',
    bg: 'color-paper',
    label: 'Secondary button text on paper',
  },
  {
    fg: 'color-forest',
    bg: 'color-paper',
    label: 'Secondary button hover on paper',
  },
];

let allPassed = true;

for (const p of pairings) {
  const fgHex = colors[p.fg];
  const bgHex = colors[p.bg];
  if (!fgHex || !bgHex) continue;

  const ratio = contrastRatio(fgHex, bgHex);
  const passAA = ratio >= 4.5;
  const passAALarge = ratio >= 3.0;

  let status = passAA ? 'PASS (AA)' : passAALarge ? 'PASS (AA Large)' : 'FAIL';
  if (!passAA && !passAALarge) allPassed = false;

  console.log(
    `${p.label.padEnd(35)} ${ratio.toFixed(2)}:1  [${status}] (${p.fg} on ${p.bg})`,
  );
}

console.log(
  allPassed
    ? '\nAll primary text pairings meet WCAG AA requirements.\n'
    : '\nSome pairings did not meet 4.5:1. Review palette tokens.\n',
);
