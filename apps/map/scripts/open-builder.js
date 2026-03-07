#!/usr/bin/env node
/**
 * Open Builder.io Visual Editor
 * 
 * Usage: npm run builder
 * Or: node scripts/open-builder.js
 */

const open = require('open');
const http = require('http');

const BUILDER_URL = 'https://builder.io/content';
const LOCAL_APP_URL = 'http://localhost:8080';

// Check if local server is running
function checkLocalServer() {
  return new Promise((resolve) => {
    const req = http.get(LOCAL_APP_URL, (res) => {
      resolve(res.statusCode === 200);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(2000, () => {
      req.abort();
      resolve(false);
    });
  });
}

async function main() {
  console.log('🔧 Builder.io Visual Editor Launcher\n');

  // Check if app is running
  const isRunning = await checkLocalServer();
  
  if (!isRunning) {
    console.error('❌ Local development server is not running!');
    console.error('   Start it first with: npm run dev');
    console.error('');
    process.exit(1);
  }

  console.log('✅ Local server detected at ' + LOCAL_APP_URL);
  console.log('');

  // Prompt for API key
  console.log('To use Builder.io visual editor:');
  console.log('');
  console.log('1. Get your API key from https://builder.io/account/space');
  console.log('2. Add it to the app by running in browser console:');
  console.log('   localStorage.setItem("builder_api_key", "YOUR_API_KEY")');
  console.log('');
  console.log('Opening Builder.io...');
  console.log('');

  // Open Builder.io
  const url = `${BUILDER_URL}?url=${encodeURIComponent(LOCAL_APP_URL)}`;
  
  try {
    await open(url);
    console.log('✅ Builder.io opened in your browser');
    console.log('');
    console.log('📖 Read BUILDER_IO_SETUP.md for full setup instructions');
  } catch (error) {
    console.error('❌ Failed to open browser:', error.message);
    console.log('');
    console.log('Please open this URL manually:');
    console.log(url);
  }
}

main();
