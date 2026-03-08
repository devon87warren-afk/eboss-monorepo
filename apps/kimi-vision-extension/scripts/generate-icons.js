/**
 * Icon Generator Script
 * Converts SVG icon to multiple PNG sizes for Chrome extension
 */

const fs = require('fs');
const path = require('path');

// Since we may not have sharp installed, create a simple HTML file
// that can be opened in browser to generate icons via canvas

const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <title>Icon Generator</title>
  <style>
    body { font-family: system-ui; padding: 40px; background: #1a1a2e; color: white; }
    canvas { border: 1px solid #333; margin: 10px; background: transparent; }
    .icon-row { display: flex; align-items: center; gap: 20px; margin: 20px 0; }
    button { padding: 10px 20px; background: #10b981; border: none; border-radius: 6px; color: white; cursor: pointer; }
    button:hover { background: #059669; }
  </style>
</head>
<body>
  <h1>Kimi Vision - Icon Generator</h1>
  <p>Open this file in a browser and click "Generate Icons" to create PNG files.</p>
  
  <div id="canvases"></div>
  
  <button onclick="generateIcons()">Generate Icons</button>
  <button onclick="downloadAll()">Download All</button>
  
  <script>
    const sizes = [16, 32, 48, 128];
    const svgContent = \`${fs.readFileSync(path.join(__dirname, '../icons/icon.svg'), 'utf8').replace(/`/g, '\\`')}\`;
    
    // Create canvases
    const container = document.getElementById('canvases');
    sizes.forEach(size => {
      const row = document.createElement('div');
      row.className = 'icon-row';
      row.innerHTML = \`
        <canvas id="canvas-\${size}" width="\${size}" height="\${size}"></canvas>
        <span>\${size}x\${size}</span>
      \`;
      container.appendChild(row);
    });
    
    function generateIcons() {
      const img = new Image();
      img.onload = () => {
        sizes.forEach(size => {
          const canvas = document.getElementById(\`canvas-\${size}\`);
          const ctx = canvas.getContext('2d');
          ctx.clearRect(0, 0, size, size);
          ctx.drawImage(img, 0, 0, size, size);
        });
      };
      img.src = 'data:image/svg+xml;base64,' + btoa(svgContent);
    }
    
    function downloadAll() {
      sizes.forEach(size => {
        const canvas = document.getElementById(\`canvas-\${size}\`);
        const link = document.createElement('a');
        link.download = \`icon\${size}.png\`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      });
    }
    
    // Auto-generate on load
    setTimeout(generateIcons, 100);
  </script>
</body>
</html>`;

fs.writeFileSync(path.join(__dirname, 'icon-generator.html'), htmlContent);
console.log('Created icon-generator.html');
console.log('Open this file in a browser to generate PNG icons');

// Also try to use sharp if available
try {
  const sharp = require('sharp');
  
  const svgBuffer = fs.readFileSync(path.join(__dirname, '../icons/icon.svg'));
  
  const sizes = [16, 32, 48, 128];
  
  Promise.all(sizes.map(size => 
    sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(path.join(__dirname, `../icons/icon${size}.png`))
  )).then(() => {
    console.log('Generated all PNG icons successfully!');
  }).catch(err => {
    console.error('Error generating icons:', err.message);
    console.log('Please use icon-generator.html instead');
  });
} catch (err) {
  console.log('Sharp not available, please use icon-generator.html to generate icons');
}
