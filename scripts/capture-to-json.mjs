#!/usr/bin/env node
// Write a raw captured stdout stream into src/data/captured/<id>.json as a
// TerminalDemo-shaped command entry. Invoked by scripts/capture-demos.sh.
//
// Usage: node scripts/capture-to-json.mjs <id> <label> <exitCode> <rawFile>
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const [, , id, label, exitCodeRaw, rawFile] = process.argv;
if (!id || !label || exitCodeRaw === undefined || !rawFile) {
  console.error('usage: capture-to-json.mjs <id> <label> <exitCode> <rawFile>');
  process.exit(1);
}

const exitCode = Number(exitCodeRaw);
const raw = await readFile(rawFile, 'utf8');

const stripAnsi = (s) => s.replace(/\x1b\[[0-9;]*m/g, '');

function cleanLines(text) {
  const lines = stripAnsi(text)
    .split(/\r?\n/)
    .map((l) => l.trimEnd());
  while (lines.length > 0 && lines[0] === '') lines.shift();
  while (lines.length > 0 && lines[lines.length - 1] === '') lines.pop();
  if (lines.length <= 60) return lines;
  return [...lines.slice(0, 25), '…', ...lines.slice(-25)];
}

const output = cleanLines(raw);

const status = exitCode === 0 ? 'ok' : exitCode === 127 ? 'error' : 'warn';
const demo = {
  prompt: '',
  commands: [
    {
      command: label,
      output,
      exitCode,
      status,
    },
  ],
};

const outUrl = new URL(`../src/data/captured/${id}.json`, import.meta.url);
await mkdir(fileURLToPath(new URL('../src/data/captured/', import.meta.url)), {
  recursive: true,
});
await writeFile(fileURLToPath(outUrl), `${JSON.stringify(demo, null, 2)}\n`, 'utf8');