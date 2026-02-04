#!/usr/bin/env node
/**
 * Scanne src/ pour t('key', { defaultValue: 'value' }) et ajoute les clés
 * manquantes dans src/locales/fr.json et en.json avec la defaultValue.
 *
 * Usage: pnpm run i18n:sync-defaults
 */

import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const root = join(__dirname, '..');
const srcDir = join(root, 'src');
const localesDir = join(root, 'src', 'locales');

// Regex: t('key', { defaultValue: 'value' }) ou t("key", { defaultValue: "value" })
const PATTERN = /t\s*\(\s*['"]([^'"]+)['"]\s*,\s*\{\s*defaultValue:\s*['"]([^'"]*)['"]/g;

// Template literal: t(`portal.new.status.${status}`, { defaultValue: status })
const APPLICATION_STATUSES = [
  'draft',
  'applied',
  'screening',
  'interview',
  'offer',
  'rejected',
  'hired',
];

function* walkTsFiles(dir) {
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = join(dir, e.name);
    if (e.isDirectory() && e.name !== 'node_modules') {
      yield* walkTsFiles(full);
    } else if (e.isFile() && (e.name.endsWith('.tsx') || e.name.endsWith('.ts'))) {
      yield full;
    }
  }
}

function extractDefaultsFromContent(content) {
  const found = new Map();
  let m;
  PATTERN.lastIndex = 0;
  while ((m = PATTERN.exec(content)) !== null) {
    const key = m[1];
    const value = m[2];
    if (!found.has(key)) found.set(key, value);
  }
  const templatePattern = /t\s*\(\s*`([^`]*)\$\{[^}]+\}`\s*,\s*\{\s*defaultValue:\s*(\w+)\s*\}\)/g;
  while ((m = templatePattern.exec(content)) !== null) {
    const prefix = m[1];
    const varName = m[2];
    if (varName === 'status' && prefix === 'portal.new.status.') {
      for (const status of APPLICATION_STATUSES) {
        const key = `${prefix}${status}`;
        if (!found.has(key)) found.set(key, status);
      }
    }
  }
  return found;
}

function extractAllDefaults() {
  const all = new Map();
  for (const file of walkTsFiles(srcDir)) {
    const content = readFileSync(file, 'utf-8');
    const found = extractDefaultsFromContent(content);
    for (const [key, value] of found) {
      if (!all.has(key)) all.set(key, value);
    }
  }
  return all;
}

function loadJson(path) {
  const raw = readFileSync(path, 'utf-8');
  return JSON.parse(raw);
}

function saveJson(path, obj) {
  const keys = Object.keys(obj).sort();
  const sorted = {};
  for (const k of keys) sorted[k] = obj[k];
  writeFileSync(path, JSON.stringify(sorted, null, 2) + '\n', 'utf-8');
}

function main() {
  const defaults = extractAllDefaults();
  if (defaults.size === 0) {
    console.log('Aucun t(..., { defaultValue }) trouvé.');
    return;
  }

  const frPath = join(localesDir, 'fr.json');
  const enPath = join(localesDir, 'en.json');
  const fr = loadJson(frPath);
  const en = loadJson(enPath);

  let addedFr = 0;
  let addedEn = 0;
  for (const [key, value] of defaults) {
    if (fr[key] === undefined) {
      fr[key] = value;
      addedFr++;
    }
    if (en[key] === undefined) {
      en[key] = value;
      addedEn++;
    }
  }

  if (addedFr > 0 || addedEn > 0) {
    saveJson(frPath, fr);
    saveJson(enPath, en);
    console.log(`Clés ajoutées: fr.json ${addedFr}, en.json ${addedEn}`);
  } else {
    console.log('Aucune clé manquante.');
  }
}

main();
