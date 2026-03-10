#!/usr/bin/env node
/**
 * Gera os assets de ícone e splash do "Adote um Boleto"
 * usando apenas módulos nativos do Node.js (sem dependências externas).
 *
 * Design: fundo escuro (#0f0f1a) + círculo rosa (#e94560) + coração branco
 */

const fs   = require("fs");
const path = require("path");
const zlib = require("zlib");

// ── CRC32 ──────────────────────────────────────────────────────────────────
const CRC_TABLE = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let j = 0; j < 8; j++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  CRC_TABLE[i] = c;
}
function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = (c >>> 8) ^ CRC_TABLE[(c ^ b) & 0xff];
  return ((c ^ 0xffffffff) >>> 0);
}

// ── PNG helpers ────────────────────────────────────────────────────────────
function u32be(n) { const b = Buffer.alloc(4); b.writeUInt32BE(n >>> 0); return b; }

function chunk(type, data) {
  const t = Buffer.from(type, "ascii");
  const crcVal = Buffer.alloc(4);
  crcVal.writeUInt32BE(crc32(Buffer.concat([t, data])));
  return Buffer.concat([u32be(data.length), t, data, crcVal]);
}

function makePNG(width, height, pixelFn) {
  const sig  = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = chunk("IHDR", Buffer.concat([
    u32be(width), u32be(height),
    Buffer.from([8, 2, 0, 0, 0]), // bit-depth=8, colorType=RGB, no interlace
  ]));

  // Build raw scanlines
  const raw = Buffer.allocUnsafe(height * (1 + width * 3));
  let pos = 0;
  for (let y = 0; y < height; y++) {
    raw[pos++] = 0; // filter: None
    for (let x = 0; x < width; x++) {
      const [r, g, b] = pixelFn(x, y, width, height);
      raw[pos++] = r; raw[pos++] = g; raw[pos++] = b;
    }
  }

  const idat = chunk("IDAT", zlib.deflateSync(raw, { level: 6 }));
  const iend = chunk("IEND", Buffer.alloc(0));
  return Buffer.concat([sig, ihdr, idat, iend]);
}

// ── Pixel functions ────────────────────────────────────────────────────────
const BG     = [15, 15, 26];      // #0f0f1a
const PINK   = [233, 69, 96];     // #e94560
const WHITE  = [255, 255, 255];

/** Retorna true se (nx, ny) está dentro do coração */
function inHeart(nx, ny) {
  const hx = nx * 1.15;
  const hy = -ny * 1.15 + 0.25;
  return Math.pow(hx*hx + hy*hy - 1, 3) - hx*hx * Math.pow(hy, 3) <= 0;
}

/** Ícone: fundo escuro → círculo rosa → coração branco */
function iconPixel(x, y, w, h) {
  const cx = w / 2, cy = h / 2;
  const r  = w * 0.40;
  const nx = (x - cx) / r;
  const ny = (y - cy) / r;
  const d2 = nx*nx + ny*ny;

  if (d2 > 1.0) return BG;
  if (inHeart(nx, ny)) return WHITE;
  return PINK;
}

/** Splash: fundo sólido + círculo+coração pequeno no centro */
function splashPixel(x, y, w, h) {
  const cx = w / 2, cy = h / 2;
  const r  = Math.min(w, h) * 0.18;
  const nx = (x - cx) / r;
  const ny = (y - cy) / r;
  const d2 = nx*nx + ny*ny;

  if (d2 > 1.0) return BG;
  if (inHeart(nx, ny)) return WHITE;
  return PINK;
}

// ── Generate ───────────────────────────────────────────────────────────────
const assetsDir = path.join(__dirname, "..", "assets");

const files = [
  { file: "icon.png",          w: 1024, h: 1024, fn: iconPixel,   label: "ícone principal (iOS + Play Store)" },
  { file: "adaptive-icon.png", w: 1024, h: 1024, fn: iconPixel,   label: "ícone adaptativo Android" },
  { file: "favicon.png",       w:  196, h:  196, fn: iconPixel,   label: "favicon web" },
  { file: "splash-icon.png",   w: 1024, h: 2048, fn: splashPixel, label: "splash screen" },
];

console.log("🎨 Gerando assets do Adote um Boleto...\n");
for (const { file, w, h, fn, label } of files) {
  process.stdout.write(`  ${label} (${w}×${h})... `);
  const buf = makePNG(w, h, fn);
  fs.writeFileSync(path.join(assetsDir, file), buf);
  console.log(`✓  ${(buf.length / 1024).toFixed(0)} KB`);
}
console.log("\n✅ Todos os assets gravados em /assets/");
