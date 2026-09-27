#!/usr/bin/env node
// Append a raw captured stdout stream as one command entry in
// src/data/captured/<id>.json. The shell orchestrator resets the target file
// before the first command of a project, so a multi-command demo (e.g. the
// resume builder's --help/--schema/--list/--lint) accumulates here.
//
// Usage: node scripts/capture-to-json.mjs <id> <label> <exitCode> <durationMs> <rawFile>
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const [, , id, label, exitCodeRaw, durationMsRaw, rawFile] = process.argv;
if (!id || !label || exitCodeRaw === undefined || durationMsRaw === undefined || !rawFile) {
  console.error('usage: capture-to-json.mjs <id> <label> <exitCode> <durationMs> <rawFile>');
  process.exit(1);
}

const exitCode = Number(exitCodeRaw);
const durationMs = Number(durationMsRaw);
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

const outPath = fileURLToPath(new URL(`../src/data/captured/${id}.json`, import.meta.url));
let demo = { prompt: '', commands: [] };
try {
  const existing = JSON.parse(await readFile(outPath, 'utf8'));
  if (existing && Array.isArray(existing.commands)) {
    demo = { prompt: existing.prompt ?? '', commands: existing.commands };
  }
} catch {
  // No prior file for this project: start a fresh demo document.
}

demo.commands.push({ command: label, output, exitCode, status, durationMs });

await mkdir(fileURLToPath(new URL('../src/data/captured/', import.meta.url)), { recursive: true });
await writeFile(outPath, `${JSON.stringify(demo, null, 2)}\n`, 'utf8');
