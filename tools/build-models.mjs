#!/usr/bin/env node
// 把 assets/**/*.glb 轉成 base64，產生 models.js（window.GG_MODELS = { 'weapons/smg': 'data:...', ... }）。
// 為什麼：file:// 雙擊開 index.html 時，瀏覽器會擋 fetch 本機檔案；改成 <script src="models.js"> 就不會被擋。
// 用法（在 repo 根目錄）：node tools/build-models.mjs
// 無外部依賴，Node 18+ 即可。換模型／加模型後重跑一次，再 commit models.js。
import { readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { join, relative, dirname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const assets = join(root, 'assets');
const out = join(root, 'models.js');

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap(d => {
    const p = join(dir, d.name);
    return d.isDirectory() ? walk(p) : d.name.toLowerCase().endsWith('.glb') ? [p] : [];
  });
}

const files = walk(assets).sort();
if (!files.length) { console.error('assets/ 底下找不到任何 .glb'); process.exit(1); }

let total = 0;
const lines = files.map(f => {
  const key = relative(assets, f).split(sep).join('/').replace(/\.glb$/i, ''); // 例：weapons/smg
  const buf = readFileSync(f);
  if (buf.readUInt32LE(0) !== 0x46546c67) throw new Error(`${f} 不是有效的 GLB（magic 不對）`);
  total += buf.length;
  console.log(`  ${key.padEnd(28)} ${(statSync(f).size / 1024).toFixed(0).padStart(5)} KB`);
  return `  ${JSON.stringify(key)}: "data:model/gltf-binary;base64,${buf.toString('base64')}",`;
});

const body = `// 自動產生，請勿手改。來源：assets/**/*.glb ／ 產生指令：node tools/build-models.mjs
// ${files.length} 個模型，原始合計 ${(total / 1024 / 1024).toFixed(2)} MB
window.GG_MODELS = {
${lines.join('\n')}
};
`;
writeFileSync(out, body);
console.log(`\n已產生 models.js：${files.length} 個模型，${(Buffer.byteLength(body) / 1024 / 1024).toFixed(2)} MB`);
