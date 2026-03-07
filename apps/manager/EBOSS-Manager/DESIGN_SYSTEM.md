# ANA EBOSS Manager Design System

## Overview
This design system provides comprehensive guidelines for designing and building the ANA EBOSS (Electric Bus Operations Support System) Manager interface. It ensures consistency, accessibility, and alignment with the ANA Energy brand.

## Brand Colors

### Primary Brand Colors (ANA Corporate Red)
```css
--brand-50: #fff1f2
--brand-100: #ffe4e6
--brand-500: #e31b23  /* Primary brand color */
--brand-600: #be123c
--brand-700: #9f1239
--brand-800: #881337
--brand-900: #4c0519
```

**Usage:**
- Primary CTAs (buttons, links)
- Active states in navigation
- Important alerts and notifications
- Brand identity elements

### Accent Colors (ANA Energy Green - Hybrid)
```css
--accent-50: #f7fee7
--accent-100: #ecfccb
--accent-500: #8dc63f  /* Accent/success color */
--accent-600: #65a30d
--accent-800: #3f6212
```

**Usage:**
- Success states
- Energy/environmental indicators
- Positive metrics
- "In Service" unit status

### Dark Mode Colors (ANA Black)
```css
--dark-950: #0a0a0a  /* Deepest black */
--dark-900: #1a1a1a  /* Primary dark background */
--dark-800: #262626  /* Secondary dark background */
--dark-700: #404040  /* Border/divider */
--dark-600: #525252  /* Muted text */
```

**Usage:**
- Dark mode backgrounds
- Sidebar navigation
- Header/footer
- Card backgrounds in dark mode

### Semantic Colors

#### Status Colors
```css
/* Success */
--success-light: #ecfccb
--success: #8dc63f
--success-dark: #3f6212

/* Warning */
--warning-light: #fef3c7
--warning: #f59e0b
--warning-dark: #92400e

/* Error */
--error-light: #fee2e2
--error: #e31b23
--error-dark: #881337

/* Info */
--info-light: #dbeafe
--info: #3b82f6
--info-dark: #1e40af
```

#### Unit Status Colors
```css
/* In Service */
--status-active: #8dc63f
--status-active-bg: #ecfccb

/* Maintenance */
--status-maintenance: #f59e0b
--status-maintenance-bg: #fef3c7

/* Down */
--status-down: #e31b23
--status-down-bg: #fee2e2
```

#### Telemetry Status Colors
```css
/* Online */
--telemetry-online: #22c55e
--telemetry-online-bg: #dcfce7

/* Warning */
--telemetry-warning: #f59e0b
--telemetry-warning-bg: #fef3c7

/* Critical */
--telemetry-critical: #e31b23
--telemetry-critical-bg: #fee2e2

/* Offline */
--telemetry-offline: #6b7280
--telemetry-offline-bg: #f3f4f6
```

### Neutral Colors (Light Mode)
```css
--slate-50: #f8fafc
--slate-100: #f1f5f9
--slate-200: #e2e8f0
--slate-300: #cbd5e1
--slate-400: #94a3b8
--slate-500: #64748b
--slate-600: #475569
--slate-700: #334155
--slate-800: #1e293b
--slate-900: #0f172a
```

## Typography

### Font Family
```css
--font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
--font-mono: "SF Mono", "Monaco", "Inconsolata", "Fira Code", monospace;
```

### Font Sizes
```css
/* Headings */
--text-xs: 0.75rem;    /* 12px */
--text-sm: 0.875rem;   /* 14px */
--text-base: 1rem;     /* 16px */
--text-lg: 1.125rem;   /* 18px */
--text-xl: 1.25rem;    /* 20px */
--text-2xl: 1.5rem;    /* 24px */
--text-3xl: 1.875rem;  /* 30px */
--text-4xl: 2.25rem;   /* 36px */
```

### Font Weights
```css
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

### Line Heights
```css
--leading-tight: 1.25;
--leading-normal: 1.5;
--leading-relaxed: 1.625;
```

### Typography Scale
| Element | Size | Weight | Line Height | Usage |
|---------|------|--------|-------------|-------|
| H1 | 2.25rem (36px) | 700 | 1.25 | Page titles |
| H2 | 1.875rem (30px) | 600 | 1.25 | Section headers |
| H3 | 1.5rem (24px) | 600 | 1.25 | Subsection headers |
| H4 | 1.25rem (20px) | 600 | 1.5 | Card titles |
| Body Large | 1.125rem (18px) | 400 | 1.625 | Important body text |
| Body | 1rem (16px) | 400 | 1.5 | Default body text |
| Body Small | 0.875rem (14px) | 400 | 1.5 | Secondary text |
| Caption | 0.75rem (12px) | 500 | 1.5 | Labels, metadata |

## Spacing Scale

Based on 4px base unit:
```css
--spacing-1: 0.25rem;  /* 4px */
--spacing-2: 0.5rem;   /* 8px */
--spacing-3: 0.75rem;  /* 12px */
--spacing-4: 1rem;     /* 16px */
--spacing-5: 1.25rem;  /* 20px */
--spacing-6: 1.5rem;   /* 24px */
--spacing-8: 2rem;     /* 32px */
--spacing-10: 2.5rem;  /* 40px */
--spacing-12: 3rem;    /* 48px */
--spacing-16: 4rem;    /* 64px */
```

## Border Radius

```css
--radius-sm: 0.375rem;  /* 6px - Small elements */
--radius-md: 0.5rem;    /* 8px - Cards, inputs */
--radius-lg: 0.75rem;   /* 12px - Modals, large cards */
--radius-xl: 1rem;      /* 16px - Special elements */
--radius-full: 9999px;  /* Fully rounded (pills, avatars) */
```

## Shadows

### Light Mode
```css
--shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
--shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
--shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
--shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1);
```

### Dark Mode
```css
--shadow-sm-dark: 0 1px 2px 0 rgb(0 0 0 / 0.3);
--shadow-md-dark: 0 4px 6px -1px rgb(0 0 0 / 0.4);
--shadow-lg-dark: 0 10px 15px -3px rgb(0 0 0 / 0.5);
--shadow-xl-dark: 0 20px 25px -5px rgb(0 0 0 / 0.6);
```

## Component Library

### Buttons

#### Primary Button (Brand)
```
Background: var(--brand-600)
Hover: var(--brand-700)
Text: white
Padding: 12px 24px
Border Radius: var(--radius-md)
Font Weight: 600
Font Size: 1rem
Shadow: var(--shadow-sm)
```

#### Secondary Button
```
Background: transparent
Border: 2px solid var(--brand-600)
Hover Background: var(--brand-50)
Text: var(--brand-600)
Padding: 12px 24px
Border Radius: var(--radius-md)
Font Weight: 600
Font Size: 1rem
```

#### Success Button
```
Background: var(--accent-600)
Hover: var(--accent-800)
Text: white
Padding: 12px 24px
Border Radius: var(--radius-md)
Font Weight: 600
Font Size: 1rem
Shadow: var(--shadow-sm)
```

#### Icon Button
```
Width: 40px
Height: 40px
Background: transparent
Hover Background: var(--slate-100) (light) / var(--dark-800) (dark)
Border Radius: var(--radius-md)
Icon Size: 20px
```

### Cards

#### Standard Card
```
Background: white (light) / var(--dark-900) (dark)
Border: 1px solid var(--slate-200) (light) / var(--dark-800) (dark)
Border Radius: var(--radius-lg)
Padding: 24px
Shadow: var(--shadow-md)
```

#### Interactive Card (Hover)
```
Hover Shadow: var(--shadow-lg)
Hover Transform: translateY(-2px)
Transition: all 0.2s ease
Cursor: pointer
```

### Status Badges

#### Badge Base Style
```
Padding: 4px 12px
Border Radius: var(--radius-full)
Font Size: 0.75rem
Font Weight: 600
Text Transform: uppercase
Letter Spacing: 0.05em
```

#### Status Variants
```
In Service:
  Background: #ecfccb
  Text: #3f6212
  Icon: CheckCircle (green)

Maintenance:
  Background: #fef3c7
  Text: #92400e
  Icon: Wrench (amber)

Down:
  Background: #fee2e2
  Text: #881337
  Icon: AlertTriangle (red)
```

### Input Fields

#### Text Input
```
Background: white (light) / var(--dark-800) (dark)
Border: 1px solid var(--slate-300) (light) / var(--dark-700) (dark)
Focus Border: var(--brand-500)
Border Radius: var(--radius-md)
Padding: 12px 16px
Font Size: 1rem
Height: 44px
```

#### Textarea
```
Same as text input
Min Height: 120px
Resize: vertical
```

#### Select Dropdown
```
Same as text input
Icon: ChevronDown (right side)
Padding Right: 40px
```

### Navigation

#### Sidebar (Desktop)
```
Width: 256px (16rem)
Background: var(--dark-900)
Border Right: 1px solid var(--dark-800)
```

#### Sidebar Link
```
Padding: 12px 16px
Border Radius: var(--radius-lg)
Font Weight: 500
Color: var(--slate-400)

Hover:
  Background: var(--dark-800)
  Color: white

Active:
  Background: var(--brand-600)
  Color: white
  Shadow: var(--shadow-md)
```

## Data Visualization Components

### Chart Color Palette
```
Primary Series: #e31b23
Secondary Series: #8dc63f
Tertiary Series: #3b82f6
Quaternary Series: #f59e0b
Quinary Series: #8b5cf6
```

### Chart Guidelines
- Use consistent colors for similar data types
- Ensure adequate contrast for accessibility
- Provide tooltips with detailed information
- Use responsive sizing
- Include clear legends and axis labels

### Telemetry Widgets

#### Sensor Reading Card
```
Background: white (light) / var(--dark-900) (dark)
Border Radius: var(--radius-lg)
Padding: 20px
Shadow: var(--shadow-md)

Components:
- Icon (top left, 24px)
- Label (small, gray)
- Value (large, bold)
- Unit (medium, gray)
- Trend indicator (arrow up/down with percentage)
- Mini sparkline (optional)
```

#### Alert Card
```
Border Left: 4px solid [status-color]
Background: [status-color-bg]
Padding: 16px
Border Radius: var(--radius-md)

Components:
- Alert icon
- Alert severity badge
- Sensor type label
- Alert message
- Timestamp
- Acknowledge button
```

### Dashboard Cards

#### Stats Card
```
Display: grid
Grid Template Columns: 1fr auto
Padding: 24px
Border Radius: var(--radius-lg)
Background: white (light) / var(--dark-900) (dark)

Components:
- Title (top)
- Value (large, bold)
- Change indicator (small, colored)
- Icon (right side, large, colored background circle)
```

#### Chart Card
```
Padding: 24px
Border Radius: var(--radius-lg)
Background: white (light) / var(--dark-900) (dark)

Components:
- Header with title and time range selector
- Chart area (recharts component)
- Legend
- Optional export button
```

## Page Templates

### Dashboard Layout
```
Structure:
- Header bar (sticky, h-16)
- Main content area
  - Stats grid (4 columns on desktop, responsive)
  - Charts section (2 columns on desktop)
  - Recent activity list (full width)
```

### Unit Detail Layout
```
Structure:
- Breadcrumb navigation
- Unit header
  - Unit image (left)
  - Unit info (center)
  - Quick actions (right)
- Tabs (Overview, Telemetry, Maintenance History, Documents)
- Tab content area
```

### List View Layout
```
Structure:
- Page title and description
- Filters and search (sticky)
- Action buttons (New, Export, etc.)
- Table or card grid
- Pagination
```

## Accessibility Guidelines

### Color Contrast
- **Text on background:** Minimum 4.5:1 ratio (WCAG AA)
- **Large text (18px+):** Minimum 3:1 ratio
- **Interactive elements:** Minimum 3:1 ratio
- **Status indicators:** Don't rely on color alone; use icons + text

### Focus States
```css
Focus Ring:
  outline: 2px solid var(--brand-500)
  outline-offset: 2px
  border-radius: var(--radius-md)
```

### Interactive Elements
- Minimum touch target size: 44x44px
- Clear hover states for all clickable elements
- Disabled states should have reduced opacity (0.5) and cursor: not-allowed

## Animation & Transitions

### Standard Transitions
```css
--transition-fast: 150ms ease-in-out;
--transition-base: 200ms ease-in-out;
--transition-slow: 300ms ease-in-out;
```

### Common Animations
```
Hover: transform, shadow (200ms)
Page transitions: opacity, transform (300ms)
Modal open/close: opacity, scale (200ms)
Toast notifications: slide-in from top (300ms)
```

## Dark Mode Implementation

### Background Layers
```
Level 0 (Base): var(--dark-950)
Level 1 (Cards): var(--dark-900)
Level 2 (Elevated): var(--dark-800)
Level 3 (Overlays): var(--dark-700)
```

### Text Hierarchy
```
Primary: rgba(255, 255, 255, 0.95)
Secondary: rgba(255, 255, 255, 0.7)
Tertiary: rgba(255, 255, 255, 0.5)
Disabled: rgba(255, 255, 255, 0.3)
```

## Icon Library

Using Lucide React icons (already installed in dependencies)

### Common Icons
- **Navigation:** LayoutDashboard, Package, ClipboardList, BarChart3, Users, MessageSquare, BookOpen
- **Actions:** PlusCircle, Edit, Trash2, Download, Upload, RefreshCw, Save
- **Status:** CheckCircle, AlertTriangle, XCircle, Info, Clock
- **UI:** ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Menu, X, Search, Filter

### Icon Sizes
```
Small: 16px
Medium: 20px
Large: 24px
Extra Large: 32px
```

## Responsive Breakpoints

```css
/* Mobile first approach */
--screen-sm: 640px;   /* Small devices */
--screen-md: 768px;   /* Tablets */
--screen-lg: 1024px;  /* Desktops */
--screen-xl: 1280px;  /* Large desktops */
--screen-2xl: 1536px; /* Extra large screens */
```

### Layout Behavior
- **Mobile (<768px):** Single column, collapsible sidebar, stacked cards
- **Tablet (768-1024px):** 2 columns for stats/cards, sidebar toggleable
- **Desktop (>1024px):** Full layout with persistent sidebar, multi-column grids

## Implementation Notes

### Tailwind CSS Configuration
The design system is implemented using Tailwind CSS with custom color extensions defined in `index.html`:

```javascript
tailwind.config = {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: { /* ANA Corporate Red */ },
        accent: { /* ANA Energy Green */ },
        dark: { /* ANA Black */ }
      }
    }
  }
}
```

### Component Consistency
- All components should use the design tokens defined in this system
- Maintain consistent spacing using the 4px grid
- Use semantic color names (brand, accent, success, warning, error) instead of hardcoded hex values
- Follow the established typography scale

## Figma Design File

**File:** `ANA EBOSS Manager Design System` (Figma)
**URL:** https://www.figma.com/design/RYlgzrqVZ673tdPxIf9wQD/ANA-EBOSS-Manager-Design-System

### Pages in Figma:
1. **Design System** - Color palette, typography, spacing tokens
2. **Components** - Button variants, cards, inputs, badges
3. **Data Visualizations** - Charts, telemetry widgets, dashboards
4. **Page Templates** - Dashboard, Unit Detail, List views
5. **Mobile Designs** - Responsive mobile layouts

---

**Last Updated:** 2026-01-03
**Version:** 1.0
**Maintainer:** ANA Energy Design Team
