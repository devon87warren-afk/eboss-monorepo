# Kimi Vision

A refined Chrome extension that captures screenshots of web pages and analyzes them using the Kimi AI Vision API.

## Features

- **One-click Capture**: Instantly capture the visible area of any webpage
- **AI Analysis**: Get intelligent insights about page content, layout, and design
- **Elegant UI**: Refined cyber-professional aesthetic with smooth animations
- **Secure**: API key stored securely in Chrome's sync storage
- **Markdown Export**: Copy analysis results with formatting preserved

## Installation

### From Source (Developer Mode)

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top-right corner)
4. Click "Load unpacked" and select the `kimi-vision-extension` folder
5. The extension icon will appear in your Chrome toolbar

### Required Setup

1. Get your API key from [Moonshot AI Platform](https://platform.moonshot.cn/)
2. Click the extension icon and select the settings (gear) icon
3. Enter your Kimi API key and save

## Usage

1. Navigate to any webpage you want to analyze
2. Click the Kimi Vision extension icon
3. Click "Capture Screenshot"
4. Wait for the AI analysis to complete
5. View results and copy them if needed

## Design

The extension features a refined cyber-professional aesthetic:

- **Color Palette**: Deep indigo/violet tones with sharp emerald accents
- **Typography**: Space Grotesk (display) + JetBrains Mono (technical)
- **Animations**: Smooth orbital animations and scanning effects
- **Depth**: Multi-layered shadows and gradient backgrounds

## Permissions

- `activeTab`: To capture the current tab's screenshot
- `storage`: To securely store your API key
- `scripting`: For content script injection
- `host_permissions`: Access to Kimi API endpoint

## API Usage

This extension uses the [Moonshot AI (Kimi) API](https://platform.moonshot.cn/). You will need:

- A valid API key from Moonshot AI Platform
- Sufficient API credits for vision model requests

## Development

### Project Structure

```
kimi-vision-extension/
├── manifest.json      # Extension manifest (Manifest V3)
├── popup.html         # Popup UI markup
├── popup.js           # Popup logic
├── popup.css          # Popup styles
├── background.js      # Service worker
├── options.html       # Settings page
├── options.js         # Settings logic
├── icons/             # Extension icons
└── README.md          # This file
```

### Generating Icons

To generate PNG icons from the SVG:

```bash
# Requires Node.js and svgexport
npm install -g svgexport
npm run generate-icons
```

Or use the online converter at [cloudconvert.com](https://cloudconvert.com/svg-to-png)

## License

MIT License - feel free to use and modify as needed.

## Credits

- Icons: Custom SVG design
- Fonts: Space Grotesk & JetBrains Mono (Google Fonts)
- AI: Powered by Moonshot AI (Kimi)
