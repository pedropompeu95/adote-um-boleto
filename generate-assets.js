/**
 * Gera os assets visuais do app (icon, adaptive-icon, splash-icon, favicon)
 * Design: coração vermelho (#e94560) com linhas de boleto brancas, fundo escuro (#0f0f1a)
 * Execute: node generate-assets.js
 */
const { PNG } = require("pngjs");
const fs = require("fs");

function hexToRgb(hex) {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
}

function createImage(w, h) {
  const png = new PNG({ width: w, height: h, filterType: -1 });
  png.data.fill(0); // inicia transparente
  return png;
}

function fillBackground(png, r, g, b) {
  for (let i = 0; i < png.width * png.height; i++) {
    png.data[i * 4]     = r;
    png.data[i * 4 + 1] = g;
    png.data[i * 4 + 2] = b;
    png.data[i * 4 + 3] = 255;
  }
}

// Equação algébrica do coração: (x²+y²-1)³ - x²y³ ≤ 0
function isInHeart(px, py, cx, cy, scale) {
  const x = (px - cx) / scale;
  const y = -(py - cy) / scale;
  return Math.pow(x * x + y * y - 1, 3) - x * x * Math.pow(y, 3) <= 0;
}

function drawHeart(png, cx, cy, scale, r, g, b) {
  const x0 = Math.max(0, Math.floor(cx - scale * 1.2));
  const x1 = Math.min(png.width,  Math.ceil(cx + scale * 1.2));
  const y0 = Math.max(0, Math.floor(cy - scale * 1.35));
  const y1 = Math.min(png.height, Math.ceil(cy + scale * 1.1));

  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      if (isInHeart(x, y, cx, cy, scale)) {
        const idx = (png.width * y + x) * 4;
        png.data[idx]     = r;
        png.data[idx + 1] = g;
        png.data[idx + 2] = b;
        png.data[idx + 3] = 255;
      }
    }
  }
}

// Desenha barras de código de barras estilizadas
function drawBoleto(png, cx, cy, bw, bh, r, g, b) {
  // Alternância de larguras: 3 finas + 1 grossa, padrão de boleto
  const pattern = [2, 1, 3, 1, 2, 1, 4, 1, 2, 1, 3, 1, 2, 1, 4, 1, 2, 1, 3];
  const total = pattern.reduce((a, v) => a + v, 0);
  const unit = bw / total;

  let x = cx - bw / 2;
  for (let i = 0; i < pattern.length; i++) {
    const barW = pattern[i] * unit;
    if (i % 2 === 0) {
      // barra — altura varia levemente para parecer um boleto real
      const barH = i % 6 === 0 ? bh : bh * 0.88;
      const top    = Math.round(cy - barH / 2);
      const bottom = Math.round(cy + barH / 2);
      const left   = Math.round(x);
      const right  = Math.round(x + barW);
      for (let py = Math.max(0, top); py < Math.min(png.height, bottom); py++) {
        for (let px = Math.max(0, left); px < Math.min(png.width, right); px++) {
          const idx = (png.width * py + px) * 4;
          png.data[idx]     = r;
          png.data[idx + 1] = g;
          png.data[idx + 2] = b;
          png.data[idx + 3] = 255;
        }
      }
    }
    x += barW;
  }
}

function generate(size, hasBg, isSmall) {
  const png = createImage(size, size);
  const [bgR, bgG, bgB] = hexToRgb("#0f0f1a");
  const [hrR, hrG, hrB] = hexToRgb("#e94560");

  if (hasBg) fillBackground(png, bgR, bgG, bgB);

  const scale  = size * (isSmall ? 0.3 : 0.29);
  const cx     = size / 2;
  const cy     = size / 2 + size * 0.025;

  drawHeart(png, cx, cy, scale, hrR, hrG, hrB);

  if (!isSmall) {
    const bw = scale * 0.88;
    const bh = scale * 0.28;
    drawBoleto(png, cx, cy + scale * 0.22, bw, bh, 255, 255, 255);
  }

  return PNG.sync.write(png);
}

const assetsDir = "assets";

// icon.png — 1024×1024, fundo escuro
fs.writeFileSync(`${assetsDir}/icon.png`, generate(1024, true, false));
console.log("✓ assets/icon.png");

// adaptive-icon.png — 1024×1024, fundo transparente (Android)
fs.writeFileSync(`${assetsDir}/adaptive-icon.png`, generate(1024, false, false));
console.log("✓ assets/adaptive-icon.png");

// splash-icon.png — 512×512, fundo transparente, sem barcode (logo limpo)
fs.writeFileSync(`${assetsDir}/splash-icon.png`, generate(512, false, true));
console.log("✓ assets/splash-icon.png");

// favicon.png — 64×64, fundo escuro
fs.writeFileSync(`${assetsDir}/favicon.png`, generate(64, true, true));
console.log("✓ assets/favicon.png");

console.log("\nAssets gerados com sucesso! 🎉");
