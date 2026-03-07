# Figma Customization Guide for ANA EBOSS Manager Design System

## Overview

This guide walks you through customizing the **ANA EBOSS Manager Design System** Figma file to match the ANA Energy brand and create custom components for your EBOSS Manager application.

**Figma File:** https://www.figma.com/design/RYlgzrqVZ673tdPxIf9wQD/ANA-EBOSS-Manager-Design-System

## Getting Started

### 1. Access the Figma File

The file has been duplicated to your Figma workspace. It's based on a comprehensive Home Service UI Kit and includes:
- ✅ Design System page with color, typography, and icon setups
- ✅ 55+ pre-built screens
- ✅ Component library
- ✅ Light and dark mode support

### 2. File Structure

```
📁 ANA EBOSS Manager Design System
├── 📄 Showcase (Cover page)
├── 📄 💎 Design System
│   ├── Color Setup
│   ├── Typography Setup
│   ├── Icon Setup
│   ├── Buttons
│   └── System Defaults
└── 📄 🎨 Design (Screen templates)
```

## Step 1: Customize Brand Colors

### Navigate to Design System → Color Setup

1. **Click on the Design System page** (💎 icon in left sidebar)
2. **Locate the "Color Setup" section** on the left side
3. **Find the color swatches** organized by shade (50, 100, 200, etc.)

### Replace Primary Blue with ANA Corporate Red

The template uses blue as the primary color. Replace it with ANA Corporate Red:

| Template Blue | Replace With (ANA Red) | Usage |
|---------------|------------------------|-------|
| #2563EB (500) | **#e31b23** | Primary brand color |
| #1E40AF (600) | **#be123c** | Hover states |
| #1E3A8A (700) | **#9f1239** | Active/pressed |
| #1E2F5F (800) | **#881337** | Deep accents |
| #172554 (900) | **#4c0519** | Darkest shade |

### Add ANA Energy Green (Accent Color)

Create a new color set for the accent/success color:

| Shade | Hex Code | Usage |
|-------|----------|-------|
| 50    | #f7fee7  | Light backgrounds |
| 100   | #ecfccb  | Subtle highlights |
| 500   | **#8dc63f** | Primary accent |
| 600   | #65a30d  | Hover states |
| 800   | #3f6212  | Dark accents |

### How to Update Colors in Figma:

1. **Select a color swatch** in the Color Setup section
2. **In the right panel**, find the "Fill" property
3. **Click the color box** to open the color picker
4. **Enter the new hex code** (e.g., #e31b23)
5. **Repeat** for all shades in the palette

### Update Color Styles

After changing the swatches:

1. **Select all elements** using the old blue color (Cmd/Ctrl + Click)
2. **Right-click** → "Select all with same fill"
3. **Update to the new ANA Red** using the Fill panel
4. **Create color styles:**
   - Click the four-dot icon in Fill panel
   - Click "+" to create new style
   - Name it: `Brand/Red/500`, `Accent/Green/500`, etc.

## Step 2: Update Typography

### Navigate to Typography Setup

1. **Go to Design System page**
2. **Find "Typography Setup"** section
3. **Review the font scale:**
   - Heading 1: 36px / Bold
   - Heading 2: 30px / Semibold
   - Heading 3: 24px / Semibold
   - Body Large: 18px / Regular
   - Body: 16px / Regular
   - Caption: 12px / Medium

### Recommended Changes:

1. **Keep the existing font** (System default: -apple-system, SF Pro, etc.)
   - It's already optimized for cross-platform compatibility
   - Matches your current Tailwind setup

2. **Or change to a custom font:**
   - Click text element
   - In right panel, change "Font family"
   - Select from Google Fonts or upload custom font

### Create Text Styles

1. **Select a text element** (e.g., H1)
2. **Click the four-dot icon** next to "Text" in right panel
3. **Click "+" Create style**
4. **Name it:** `Typography/Heading 1`
5. **Repeat for all text variants**

## Step 3: Customize Components

### Buttons

1. **Navigate to the "Buttons" layer** in Design System page
2. **You'll see button variants:**
   - Primary (solid background)
   - Secondary (outline)
   - Icon buttons
   - Different sizes (sm, md, lg)

3. **Update Primary Button:**
   - Select the primary button
   - Change fill to `Brand/Red/600` (#be123c)
   - Update hover state to `Brand/Red/700` (#9f1239)

4. **Update Success Button:**
   - Select success button
   - Change fill to `Accent/Green/600` (#65a30d)
   - Update hover to `Accent/Green/800` (#3f6212)

5. **Create component variants:**
   - Select button group
   - Right-click → "Create component"
   - Click "Add variant property"
   - Add: `type` (primary, secondary, success)
   - Add: `size` (sm, md, lg)

### Cards

1. **Find card components** in the Design page
2. **Update card styling:**
   - Background: White (light mode) / `Dark/900` (#1a1a1a) dark mode
   - Border: 1px solid `Slate/200` / `Dark/800`
   - Border radius: 12px
   - Shadow: 0 4px 6px rgba(0,0,0,0.1)

3. **Create card variants:**
   - Default card
   - Hover card (elevated shadow)
   - Active/selected card (border color accent)

### Status Badges

Create status badges for unit statuses:

1. **Create a rectangle** (R key)
2. **Size:** Auto width × 24px height
3. **Border radius:** 9999px (full rounded)
4. **Padding:** 4px 12px
5. **Add text:** "IN SERVICE", "MAINTENANCE", "DOWN"

Status Badge Styles:

| Status | Background | Text Color | Icon |
|--------|-----------|----------|------|
| In Service | #ecfccb | #3f6212 | ✓ |
| Maintenance | #fef3c7 | #92400e | ⚠ |
| Down | #fee2e2 | #881337 | ✕ |

6. **Make it a component:**
   - Select badge
   - Cmd/Ctrl + Alt + K
   - Name: `Badge/Status`
   - Add variant property: `status` (in-service, maintenance, down)

## Step 4: Create Data Visualization Components

### Telemetry Widget Card

1. **Create a frame** (F key) - 320px × 200px
2. **Add background:** White / `Dark/900`
3. **Add border radius:** 12px
4. **Add shadow**

**Structure:**
```
Frame: Telemetry Card
├── Icon (top-left, 24×24px)
├── Label Text (small, gray)
├── Value Text (large, bold)
├── Unit Text (medium, gray)
├── Trend Indicator (↑/↓ with %)
└── Mini Sparkline (optional)
```

3. **Style the elements:**
   - Icon: 24px, color based on status
   - Label: 12px, medium weight, slate-500
   - Value: 32px, bold, slate-900/white
   - Unit: 14px, regular, slate-500
   - Trend: 12px, green (up) / red (down)

4. **Make it a component** with variants:
   - `metric`: (temperature, vibration, voltage, fuel)
   - `status`: (normal, warning, critical)

### Stats Dashboard Card

1. **Create frame:** 280px × 140px
2. **Layout:** Grid (2 columns)
   - Left: Text content
   - Right: Icon circle

**Structure:**
```
Frame: Stats Card
├── Text Group (left)
│   ├── Title
│   ├── Value
│   └── Change indicator
└── Icon Circle (right)
    └── Icon
```

3. **Styling:**
   - Icon circle: 48px diameter, brand-100 background
   - Icon: 24px, brand-600 color
   - Value: 36px, bold
   - Change: 12px with up/down arrow

### Chart Container Template

1. **Create frame:** 640px × 400px
2. **Add sections:**
   - Header (title + date range selector)
   - Chart area (placeholder)
   - Legend
   - Optional: Export button

3. **Use Auto Layout:**
   - Spacing: 24px
   - Padding: 24px
   - Align: Top left

## Step 5: Create Page Templates

### Dashboard Layout

1. **Create a new page** in Figma: "Templates"
2. **Create frame:** 1440px × 1024px (desktop)
3. **Add layout grid:**
   - Type: Columns
   - Count: 12
   - Gutter: 24px
   - Margin: 48px

**Layout Structure:**
```
Frame: Dashboard
├── Header (sticky, h-64px)
├── Stats Grid (4 columns)
│   ├── Total Units
│   ├── Active Tickets
│   ├── Uptime %
│   └── Revenue
├── Charts Section (2 columns)
│   ├── Units Performance
│   └── Telemetry Overview
└── Recent Activity (full width)
```

### Unit Detail Page Template

1. **Create frame:** 1440px × auto
2. **Structure:**
   ```
   ├── Breadcrumbs
   ├── Unit Header
   │   ├── Image (left)
   │   ├── Info (center)
   │   └── Actions (right)
   ├── Tabs (Overview, Telemetry, Maintenance)
   └── Tab Content
   ```

### Mobile Responsive Template

1. **Create frame:** 375px × 812px (iPhone)
2. **Key differences:**
   - Single column layout
   - Collapsible navigation
   - Stacked cards
   - Larger touch targets (44×44px minimum)

## Step 6: Export Assets

### Export Components for Development

1. **Select a component**
2. **Right panel → Export section**
3. **Click "+" to add export setting:**
   - Format: SVG (for icons)
   - Format: PNG @2x (for images)
4. **Click "Export [Component Name]"**

### Export Color Tokens

1. **Install "Design Tokens" plugin:**
   - Plugins → Browse plugins
   - Search "Design Tokens"
   - Install and run

2. **Export as JSON:**
   - Select Design System page
   - Run plugin
   - Export to JSON format
   - Use in your CSS/Tailwind config

### Export to Code

1. **Select any component**
2. **Right panel → Code tab**
3. **Choose:** CSS, iOS, Android
4. **Copy code** for implementation reference

## Step 7: Collaborate & Handoff

### For Designers:

1. **Share the Figma file:**
   - Click "Share" (top right)
   - Invite team members
   - Set permissions (view/edit)

2. **Leave comments:**
   - Press C key
   - Click on component
   - Add design notes/questions

3. **Version history:**
   - File menu → Show version history
   - Name important versions
   - Restore if needed

### For Developers:

1. **Inspect mode:**
   - Open Figma file
   - Click "Inspect" tab (top right)
   - Select component to see:
     - CSS properties
     - Spacing/dimensions
     - Color values
     - Typography specs

2. **Export assets:**
   - Select component
   - Click "Export" in right panel
   - Download assets

3. **Use Figma Dev Mode** (if available):
   - Click "Dev Mode" toggle
   - See code snippets
   - Copy CSS directly

## Tips & Best Practices

### 1. Use Auto Layout
- Select frame → Add auto layout (Shift + A)
- Set padding, spacing, alignment
- Makes responsive design easier

### 2. Create Component Library
- Build once, use everywhere
- Use variants for different states
- Name components clearly: `Component/Variant/State`

### 3. Consistent Naming
```
✅ Good:
- Button/Primary/Default
- Card/Stats/Default
- Badge/Status/Success

❌ Bad:
- btn_1
- card_copy
- green_badge
```

### 4. Use Constraints
- Set how elements resize
- Left/Right, Top/Bottom
- Scale proportionally

### 5. Document Your Designs
- Add description to components
- Use pages for organization
- Include usage guidelines

## Common Tasks

### Change Global Color
1. Right-click color style
2. "Edit style"
3. Update color
4. All instances update automatically

### Create Dark Mode Variant
1. Duplicate component
2. Change background/text colors
3. Name: `Component/Dark`
4. Or use component properties

### Add Custom Icons
1. Import SVG (Cmd/Ctrl + Shift + K)
2. Outline stroke (Cmd/Ctrl + Shift + O)
3. Make component
4. Add to icon library

### Responsive Resize
1. Select frame
2. Add constraints (right panel)
3. Set fixed/fill/hug content
4. Test with different widths

## Resources

- [Figma Official Tutorials](https://help.figma.com/hc/en-us/categories/360002051613-Get-started)
- [Design System Guide](./DESIGN_SYSTEM.md)
- [Figma Community](https://www.figma.com/community)
- [Auto Layout Guide](https://www.figma.com/best-practices/creating-dynamic-designs-with-auto-layout/)

## Next Steps

1. **Customize colors** to match ANA brand
2. **Create 5-10 core components** (buttons, cards, inputs)
3. **Build 2-3 page templates** (Dashboard, Unit Detail, List view)
4. **Export design tokens** for development
5. **Share with team** for feedback
6. **Iterate and refine** based on usage

---

**Figma File:** https://www.figma.com/design/RYlgzrqVZ673tdPxIf9wQD/ANA-EBOSS-Manager-Design-System

**Last Updated:** 2026-01-03
**Version:** 1.0
