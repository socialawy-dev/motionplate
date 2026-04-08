const fs = require('fs');
const path = require('path');

// Simple script to create valid PNGs using a small library or simply copy a valid base64 png
// A 1x1 black pixel base64:
const b64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";
const buffer = Buffer.from(b64, 'base64');

for (let i = 1; i <= 22; i++) {
  const file = path.join(__dirname, 'public/examples/prologue', `plate-${String(i).padStart(2, '0')}.png`);
  fs.writeFileSync(file, buffer);
}
console.log('Done');
