# Builder.io Setup Guide for ANA EBOSS Planner

Builder.io is a visual CMS that allows you to edit UI components without writing code. This guide walks through setting it up for the ANA EBOSS Planner.

## Quick Start

### 1. Create Builder.io Account

1. Go to <https://builder.io/signup>
2. Sign up with your email or Google account
3. Create a new space called "ANA EBOSS Planner"

### 2. Get Your API Key

1. In Builder.io, go to **Settings** (gear icon)
2. Click **API Keys** in the left sidebar
3. Copy the **Public API Key**
4. In your app, run this in browser console:

```javascript
localStorage.setItem('builder_api_key', 'YOUR_COPIED_API_KEY_HERE');
```

   Replace `YOUR_COPIED_API_KEY_HERE` with your actual API key from Builder.io.

### 3. Start Development Server

```bash
npm run dev
```

### 4. Open Visual Editor

Click the **"Edit in Builder.io"** button (bottom-right corner) or visit:

```
https://builder.io/content?apiKey=YOUR_API_KEY&url=http://localhost:8080
```

## How It Works

### For Vanilla JS Apps

Since ANA EBOSS Planner uses vanilla JavaScript (not React), Builder.io integration works via:

1. **HTML Overlays** - Builder.io renders editable regions on top of your existing UI
2. **Component Templates** - Define editable sections in Builder.io, then inject them
3. **Content API** - Fetch designed content and inject into the DOM

### Editable Areas

The following UI sections are configured as Builder.io editable:

| Element | Builder Model | Description |
|---------|--------------|-------------|
| `.panel-header` | `side-panel-header` | Side panel header area |
| `#asset-list` | `asset-card` | Asset card template |
| `.dialog` | `dialog-*` | Dialog/popup templates |

## Creating Editable Components

### Step 1: Create a Model in Builder.io

1. Go to **Models** in Builder.io
2. Click **+ Create Model**
3. Name it (e.g., "asset-card")
4. Add custom fields:
   - `title` (text)
   - `description` (long text)
   - `backgroundColor` (color)
   - `icon` (file)

### Step 2: Design the Component

1. Go to **Content** → **+ Create Entry**
2. Select your model
3. Use the visual editor to design
4. Save

### Step 3: Use in Code

```javascript
// Render Builder.io component
const component = await BuilderIntegration.render('asset-card', {
  title: 'EBOSS-125-001',
  kw: 100
});

document.getElementById('asset-list').appendChild(component);
```

## Visual Editing Workflow

### 1. Edit Mode

When you click "Edit in Builder.io":

- Builder.io loads your app in an iframe
- You can visually click and edit elements
- Changes are previewed live

### 2. Save & Publish

1. Make visual changes
2. Click **Save** (saves draft)
3. Click **Publish** (goes live)

### 3. Changes Reflect Immediately

The app fetches the latest content from Builder.io's CDN on each load.

## Advanced Configuration

### Custom Components

Register custom components for Builder.io's editor:

```javascript
builder.registerComponent(YourComponent, {
  name: 'Generator Card',
  inputs: [
    { name: 'label', type: 'string' },
    { name: 'kw', type: 'number' },
    { name: 'photoUrl', type: 'file' }
  ]
});
```

### A/B Testing

Builder.io supports built-in A/B testing:

1. In Builder.io, click **A/B Test**
2. Create variations
3. Set traffic split
4. Builder.io automatically serves different versions

### Targeting

Show different content based on:

- URL path
- User attributes
- Device type
- Custom targeting rules

## Deployment

### For Production

Builder.io content is served from their CDN and works with any deployment:

```bash
# Deploy to Firebase (Builder.io content auto-loads)
npm run deploy
```

### Environment Variables

For production, set the API key via build-time injection:

```javascript
// In your build config (e.g., webpack, vite):
// Read from process.env.BUILDER_API_KEY during build
// Or pass via server-side config as a data attribute:
// <div id="app" data-builder-key="${BUILDER_API_KEY}"></div>
// Then read it in your app:
const apiKey = document.getElementById('app').dataset.builderKey;

// NEVER expose API keys on window.BUILDER_API_KEY globally
```

## Troubleshooting

### Editor Won't Load

- Check browser console for errors
- Ensure API key is set: `localStorage.getItem('builder_api_key')`
- Verify app is running on localhost:8080

### Changes Not Showing

- Check if content is published (not just saved)
- Clear browser cache
- Verify model name matches code

### CORS Errors

If you see CORS errors:

1. In Builder.io, go to **Settings** → **Advanced**
2. Add `http://localhost:8080` to allowed origins

## Best Practices

1. **Start Simple** - Make header/footer editable first
2. **Use Data Bindings** - Connect Builder.io fields to your data
3. **Test on Real Data** - Use actual generator data when designing
4. **Version Control** - Builder.io saves history, but document major changes
5. **Collaborate** - Share Builder.io login with team members

## Resources

- [Builder.io Documentation](https://www.builder.io/c/docs/intro)
- [HTML API Reference](https://www.builder.io/c/docs/html-api)
- [Web Components Docs](https://www.builder.io/c/docs/web-components) - For vanilla JS integration (not React-specific, unlike [React Components](https://www.builder.io/c/docs/custom-react-components))
- [YouTube Tutorials](https://www.youtube.com/@BuilderIO)

## Support

Having issues?

1. Check browser console for errors
2. Verify API key is correct
3. Try clearing localStorage and reloading
4. Contact Builder.io support: <https://www.builder.io/c/docs/help>
