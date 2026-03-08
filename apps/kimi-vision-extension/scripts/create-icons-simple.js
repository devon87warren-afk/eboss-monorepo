/**
 * Simple Icon Generator - No dependencies required
 * Creates basic PNG icons for the extension
 */

const fs = require('fs');
const path = require('path');

// Simple PNG encoder function
function createSimplePNG(width, height, r, g, b, a = 255) {
  // PNG signature
  const signature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  
  // Create IHDR chunk
  function createIHDR(w, h) {
    const data = Buffer.alloc(13);
    data.writeUInt32BE(w, 0);
    data.writeUInt32BE(h, 4);
    data[8] = 8;  // bit depth
    data[9] = 6;  // color type (RGBA)
    data[10] = 0; // compression
    data[11] = 0; // filter method
    data[12] = 0; // interlace
    return createChunk('IHDR', data);
  }
  
  // Create IDAT chunk with compressed image data
  function createIDAT(width, height, r, g, b, a) {
    const rowSize = 1 + width * 4; // filter byte + RGBA for each pixel
    const imageData = Buffer.alloc(rowSize * height);
    
    for (let y = 0; y < height; y++) {
      const rowStart = y * rowSize;
      imageData[rowStart] = 0; // filter type: none
      
      for (let x = 0; x < width; x++) {
        const pixelStart = rowStart + 1 + x * 4;
        // Create a simple gradient pattern
        const gradient = Math.floor((x / width + y / height) * 40);
        imageData[pixelStart] = Math.min(255, r + gradient);     // R
        imageData[pixelStart + 1] = Math.min(255, g + gradient); // G
        imageData[pixelStart + 2] = Math.min(255, b + gradient); // B
        imageData[pixelStart + 3] = a;                           // A
      }
    }
    
    // Simple zlib compression (deflate)
    const zlib = require('zlib');
    const compressed = zlib.deflateSync(imageData);
    return createChunk('IDAT', compressed);
  }
  
  // Create IEND chunk
  function createIEND() {
    return createChunk('IEND', Buffer.alloc(0));
  }
  
  // Create a PNG chunk
  function createChunk(type, data) {
    const chunk = Buffer.alloc(4 + 4 + data.length + 4);
    chunk.writeUInt32BE(data.length, 0);
    chunk.write(type, 4, 4);
    data.copy(chunk, 8);
    const crc = require('zlib').crc32(Buffer.concat([Buffer.from(type), data]));
    chunk.writeUInt32BE(crc >>> 0, 8 + data.length);
    return chunk;
  }
  
  // Build PNG
  return Buffer.concat([
    signature,
    createIHDR(width, height),
    createIDAT(width, height, r, g, b, a),
    createIEND()
  ]);
}

// Create icons directory
const iconsDir = path.join(__dirname, '../icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Colors matching our design: indigo with emerald accent
const primaryColor = { r: 99, g: 102, b: 241 };  // Indigo
const sizes = [16, 32, 48, 128];

console.log('Generating icons...');

sizes.forEach(size => {
  const png = createSimplePNG(size, size, primaryColor.r, primaryColor.g, primaryColor.b);
  fs.writeFileSync(path.join(iconsDir, `icon${size}.png`), png);
  console.log(`Created icon${size}.png`);
});

console.log('\nAll icons generated successfully!');
console.log('Note: These are gradient icons. For the full design with orbital rings,');
console.log('open icons/generate.html in a browser and use that instead.');
