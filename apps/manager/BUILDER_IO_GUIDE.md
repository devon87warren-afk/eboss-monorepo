# Builder.io Integration Guide for ANA EBOSS Manager

## Overview
This guide explains how to integrate Builder.io with your ANA EBOSS Manager application to enable visual editing capabilities while maintaining the design system standards.

## What is Builder.io?

Builder.io is a visual development platform that allows non-technical users to create and edit website content through a drag-and-drop interface. For the EBOSS Manager, it can be used to:

- **Content Management:** Update text, images, and static content without code changes
- **Page Building:** Create new dashboard views or reports visually
- **A/B Testing:** Test different UI variations for optimal user experience
- **Marketing Pages:** Build landing pages or documentation without developer involvement

## Installation

### 1. Install Builder.io SDK

```bash
npm install @builder.io/react
```

### 2. Get Your API Key

1. Sign up at [builder.io](https://www.builder.io)
2. Create a new space called "ANA EBOSS Manager"
3. Copy your Public API Key from Settings

### 3. Set Up Environment Variables

Add to `.env.local`:

```
VITE_BUILDER_API_KEY=your_public_api_key_here
```

## Integration with React App

### 1. Create Builder Component Wrapper

Create `components/BuilderPage.tsx`:

```typescript
import { BuilderComponent, builder, useIsPreviewing } from '@builder.io/react';
import { useEffect, useState } from 'react';

// Initialize Builder with your API key
builder.init(import.meta.env.VITE_BUILDER_API_KEY);

interface BuilderPageProps {
  modelName: string;
  content?: any;
}

export default function BuilderPage({ modelName, content: initialContent }: BuilderPageProps) {
  const isPreviewingInBuilder = useIsPreviewing();
  const [content, setContent] = useState(initialContent);
  const [loading, setLoading] = useState(!initialContent);

  useEffect(() => {
    if (!initialContent) {
      builder
        .get(modelName, {
          url: window.location.pathname,
        })
        .promise()
        .then(setContent)
        .finally(() => setLoading(false));
    }
  }, [modelName, initialContent]);

  if (loading) {
    return <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
    </div>;
  }

  if (!content && !isPreviewingInBuilder) {
    return <div className="text-center p-8">
      <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Page not found</h2>
    </div>;
  }

  return <BuilderComponent model={modelName} content={content} />;
}
```

### 2. Register Custom Components

Create `builder/registerComponents.ts`:

```typescript
import { Builder } from '@builder.io/react';
import Dashboard from '../components/Dashboard';
import UnitList from '../components/UnitList';
import CustomerList from '../components/CustomerList';
import Analytics from '../components/Analytics';

// Register your existing React components with Builder
Builder.registerComponent(Dashboard, {
  name: 'Dashboard',
  inputs: [],
});

Builder.registerComponent(UnitList, {
  name: 'Unit List',
  inputs: [],
});

Builder.registerComponent(CustomerList, {
  name: 'Customer List',
  inputs: [],
});

Builder.registerComponent(Analytics, {
  name: 'Analytics',
  inputs: [],
});

// Register design system components
Builder.registerComponent(
  (props: { variant: 'primary' | 'secondary' | 'success'; children: string; onClick?: () => void }) => (
    <button
      onClick={props.onClick}
      className={`
        px-6 py-3 rounded-lg font-semibold transition-all
        ${props.variant === 'primary' ? 'bg-brand-600 hover:bg-brand-700 text-white shadow-md' : ''}
        ${props.variant === 'secondary' ? 'border-2 border-brand-600 text-brand-600 hover:bg-brand-50' : ''}
        ${props.variant === 'success' ? 'bg-accent-600 hover:bg-accent-800 text-white shadow-md' : ''}
      `}
    >
      {props.children}
    </button>
  ),
  {
    name: 'ANA Button',
    inputs: [
      {
        name: 'variant',
        type: 'string',
        enum: ['primary', 'secondary', 'success'],
        defaultValue: 'primary',
      },
      {
        name: 'children',
        type: 'string',
        defaultValue: 'Click me',
      },
    ],
  }
);

// Register Stats Card
Builder.registerComponent(
  (props: { title: string; value: string; icon: string; change?: string }) => (
    <div className="bg-white dark:bg-dark-900 rounded-lg p-6 shadow-md">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">{props.title}</p>
          <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">{props.value}</p>
          {props.change && (
            <p className="text-sm text-accent-600 mt-1">↑ {props.change}</p>
          )}
        </div>
        <div className="w-12 h-12 bg-brand-100 dark:bg-brand-900/20 rounded-full flex items-center justify-center">
          <span className="text-2xl">{props.icon}</span>
        </div>
      </div>
    </div>
  ),
  {
    name: 'Stats Card',
    inputs: [
      { name: 'title', type: 'string', defaultValue: 'Total Units' },
      { name: 'value', type: 'string', defaultValue: '124' },
      { name: 'icon', type: 'string', defaultValue: '📊' },
      { name: 'change', type: 'string', defaultValue: '+12%' },
    ],
  }
);
```

### 3. Initialize Builder in Your App

Update `App.tsx`:

```typescript
import { useEffect } from 'react';
import './builder/registerComponents'; // Import to register components

function App() {
  // ... existing code ...

  useEffect(() => {
    // Import Builder components registration
    import('./builder/registerComponents');
  }, []);

  // ... rest of your app ...
}
```

### 4. Add Builder Route (Optional)

If you want editable marketing/info pages:

```typescript
// In App.tsx
import BuilderPage from './components/BuilderPage';

// Add to your routes:
<Route path="/builder/:page" element={<BuilderPage modelName="page" />} />
```

## Creating Custom Models in Builder.io

### 1. Dashboard Layouts Model

1. Go to Builder.io dashboard
2. Click "Models" → "New Model"
3. Name: `dashboard-layout`
4. Type: `Page`
5. Add custom fields:
   - `title` (Text)
   - `widgets` (List of components)
   - `refreshInterval` (Number)

### 2. Report Templates Model

1. Create new model: `report-template`
2. Add fields:
   - `reportName` (Text)
   - `dateRange` (Text)
   - `charts` (List)
   - `filters` (List)

## Using Builder.io Visual Editor

### For Content Editors:

1. **Login to Builder.io**
   - Go to your Builder space
   - Navigate to the model you want to edit

2. **Edit Existing Pages**
   - Select the page/component
   - Drag and drop components from the left panel
   - Edit text, images, and styles in the right panel
   - Click "Publish" when done

3. **Create New Pages**
   - Click "New Entry"
   - Choose a template or start from scratch
   - Add components from your registered custom components
   - Style using the design system values

### For Developers:

1. **Fetch Content Programmatically**

```typescript
import { builder } from '@builder.io/react';

const content = await builder
  .get('dashboard-layout', {
    userAttributes: {
      role: userRole,
    },
  })
  .promise();
```

2. **Targeting & Personalization**

```typescript
// Show different dashboards based on user role
builder.get('dashboard-layout', {
  userAttributes: {
    role: 'technician', // or 'admin', 'manager'
  },
});
```

## Design System Integration

### 1. Import Design Tokens

Create `builder/theme.ts`:

```typescript
export const builderTheme = {
  colors: {
    brand: {
      50: '#fff1f2',
      100: '#ffe4e6',
      500: '#e31b23',
      600: '#be123c',
      700: '#9f1239',
      800: '#881337',
      900: '#4c0519',
    },
    accent: {
      50: '#f7fee7',
      100: '#ecfccb',
      500: '#8dc63f',
      600: '#65a30d',
      800: '#3f6212',
    },
    dark: {
      950: '#0a0a0a',
      900: '#1a1a1a',
      800: '#262626',
      700: '#404040',
      600: '#525252',
    },
  },
  spacing: {
    1: '0.25rem',
    2: '0.5rem',
    3: '0.75rem',
    4: '1rem',
    5: '1.25rem',
    6: '1.5rem',
    8: '2rem',
    10: '2.5rem',
    12: '3rem',
    16: '4rem',
  },
  borderRadius: {
    sm: '0.375rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
    full: '9999px',
  },
};
```

### 2. Set Custom Styles in Builder

In Builder.io editor:
1. Click on any component
2. Go to "Styles" tab
3. Use CSS variables:
   ```css
   background-color: #e31b23; /* brand-500 */
   border-radius: 0.5rem; /* radius-md */
   padding: 1.5rem; /* spacing-6 */
   ```

## Best Practices

### 1. Component Organization
- Keep Builder-editable components simple
- Use composition over complexity
- Provide sensible defaults
- Document input options clearly

### 2. Content Structure
```
builder/
├── models/
│   ├── dashboard-layout.json
│   ├── report-template.json
│   └── marketing-page.json
├── components/
│   ├── StatsCard.tsx
│   ├── ChartWidget.tsx
│   └── AlertBanner.tsx
└── registerComponents.ts
```

### 3. Performance
- Use static generation for marketing pages
- Cache Builder content with appropriate TTL
- Lazy load Builder components
- Use CDN for Builder assets

### 4. Security
- Keep API key in environment variables
- Use private keys for write operations only
- Validate user permissions before rendering
- Sanitize user-generated content

## Example Use Cases

### 1. Editable Dashboard Cards

```typescript
// Register a configurable metric card
Builder.registerComponent(MetricCard, {
  name: 'Metric Card',
  inputs: [
    { name: 'metric', type: 'string', enum: ['units', 'tickets', 'uptime'] },
    { name: 'customTitle', type: 'string' },
    { name: 'showTrend', type: 'boolean', defaultValue: true },
  ],
});
```

### 2. Custom Report Builder

```typescript
// Allow users to build custom reports
const ReportBuilder = () => {
  return (
    <BuilderComponent
      model="report-template"
      context={{
        units: appContext.units,
        tickets: appContext.tickets,
      }}
    />
  );
};
```

### 3. A/B Test Dashboard Layouts

```typescript
// Test different dashboard arrangements
builder.get('dashboard-layout', {
  testId: 'dashboard-v2-test',
}).then(content => {
  // Builder automatically handles A/B test assignment
  renderDashboard(content);
});
```

## Troubleshooting

### Common Issues

**1. Components not showing in Builder**
- Ensure `registerComponents.ts` is imported
- Check that Builder.init() is called with correct API key
- Verify component inputs are properly typed

**2. Styles not applying**
- Ensure Tailwind classes are in your safelist
- Check dark mode class is on `<html>` element
- Verify CSS is loaded before Builder content

**3. Content not updating**
- Check Builder publish status
- Clear browser cache
- Verify API key has read permissions

## Resources

- [Builder.io Documentation](https://www.builder.io/c/docs/developers)
- [React SDK](https://github.com/BuilderIO/builder/tree/main/packages/react)
- [Design System Reference](./DESIGN_SYSTEM.md)
- [Figma Design File](https://www.figma.com/design/RYlgzrqVZ673tdPxIf9wQD/ANA-EBOSS-Manager-Design-System)

---

**Last Updated:** 2026-01-03
**Version:** 1.0
