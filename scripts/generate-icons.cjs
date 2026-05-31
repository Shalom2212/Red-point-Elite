// Generates PNG icons for the Chrome extension using node-canvas.
// Run: node scripts/generate-icons.cjs
const { createCanvas } = require('canvas');
const fs   = require('fs');
const path = require('path');

const SIZES   = [16, 32, 48, 128];
const OUT_DIR = path.join(__dirname, '..', 'public', 'icons');

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y,     x + w, y + r,     r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x,      y + h, x,       y + h - r, r);
  ctx.lineTo(x,     y + r);
  ctx.arcTo(x,      y,     x + r,   y,         r);
  ctx.closePath();
}

function drawIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx    = canvas.getContext('2d');
  const s      = size;
  const cx     = s / 2;
  const cy     = s / 2;

  // ── Background: dark rounded square ──────────────────────────────────────
  roundRect(ctx, 0, 0, s, s, s * 0.22);
  ctx.fillStyle = '#111111';
  ctx.fill();

  // ── Open book ─────────────────────────────────────────────────────────────
  // Book rect: 72% wide, 52% tall, centered slightly above middle
  const bw = s * 0.72;
  const bh = s * 0.52;
  const bx = cx - bw / 2;
  const by = cy - bh / 2 - s * 0.02;

  const spineX  = cx;
  const pageGap = s * 0.012; // tiny gap at spine

  // Left page
  ctx.beginPath();
  ctx.moveTo(bx,            by + s * 0.025);
  ctx.lineTo(spineX - pageGap, by);
  ctx.lineTo(spineX - pageGap, by + bh);
  ctx.lineTo(bx,            by + bh - s * 0.025);
  ctx.closePath();
  ctx.fillStyle   = 'rgba(255,255,255,0.14)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.50)';
  ctx.lineWidth   = Math.max(1, s * 0.038);
  ctx.lineJoin    = 'round';
  ctx.stroke();

  // Right page
  ctx.beginPath();
  ctx.moveTo(spineX + pageGap, by);
  ctx.lineTo(bx + bw,          by + s * 0.025);
  ctx.lineTo(bx + bw,          by + bh - s * 0.025);
  ctx.lineTo(spineX + pageGap, by + bh);
  ctx.closePath();
  ctx.fillStyle   = 'rgba(255,255,255,0.09)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.50)';
  ctx.lineWidth   = Math.max(1, s * 0.038);
  ctx.stroke();

  // Spine shadow line
  ctx.beginPath();
  ctx.moveTo(spineX, by  - s * 0.01);
  ctx.lineTo(spineX, by + bh + s * 0.01);
  ctx.strokeStyle = 'rgba(255,255,255,0.55)';
  ctx.lineWidth   = Math.max(1, s * 0.025);
  ctx.stroke();

  // ── Text lines on right page (32 px+) ─────────────────────────────────────
  if (s >= 32) {
    const lineCount = s >= 48 ? 3 : 2;
    const lx1  = spineX + s * 0.06;
    const lx2  = bx + bw - s * 0.06;
    const topY = by + bh * 0.25;
    const step = (bh * 0.50) / Math.max(lineCount - 1, 1);

    ctx.strokeStyle = 'rgba(255,255,255,0.22)';
    ctx.lineWidth   = Math.max(1, s * 0.028);
    ctx.lineCap     = 'round';

    for (let i = 0; i < lineCount; i++) {
      const ly = topY + i * step;
      ctx.beginPath();
      ctx.moveTo(lx1, ly);
      ctx.lineTo(lx2, ly);
      ctx.stroke();
    }
  }

  // ── Red Point — the RSVP focal marker on the middle text line ─────────────
  const focalY = by + bh * 0.50;
  const focalX = spineX + bw * 0.20;

  ctx.lineCap = 'round';

  if (s >= 48) {
    // Short bold red bar (the ORP focus line)
    ctx.beginPath();
    ctx.moveTo(focalX - s * 0.085, focalY);
    ctx.lineTo(focalX + s * 0.085, focalY);
    ctx.strokeStyle = '#FF3B30';
    ctx.lineWidth   = s * 0.060;
    ctx.stroke();
  } else {
    // Just a clean red dot at small sizes
    ctx.beginPath();
    ctx.arc(focalX, focalY, s * 0.10, 0, Math.PI * 2);
    ctx.fillStyle = '#FF3B30';
    ctx.fill();
  }

  // ── Bottom spine shadow (gives depth at 128 px) ───────────────────────────
  if (s >= 128) {
    const shadowH = s * 0.055;
    const shadowY = by + bh + s * 0.008;
    const grad    = ctx.createLinearGradient(bx, shadowY, bx, shadowY + shadowH);
    grad.addColorStop(0, 'rgba(255,59,48,0.18)');
    grad.addColorStop(1, 'rgba(255,59,48,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(bx, shadowY, bw, shadowH);
  }

  return canvas.toBuffer('image/png');
}

SIZES.forEach(size => {
  const buf     = drawIcon(size);
  const outPath = path.join(OUT_DIR, `icon${size}.png`);
  fs.writeFileSync(outPath, buf);
  console.log(`✓ icon${size}.png  (${size}x${size})`);
});

console.log('\nIcons written to public/icons/');
