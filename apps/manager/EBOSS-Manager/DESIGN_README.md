# ANA EBOSS Manager - Design System & Builder.io Setup

## 🎨 What's Been Set Up

I've created a comprehensive design system and integration guides for your ANA EBOSS Manager application. Here's what you now have:

### ✅ Figma Design System (Ready to Customize)

**📁 File:** [ANA EBOSS Manager Design System](https://www.figma.com/design/RYlgzrqVZ673tdPxIf9wQD/ANA-EBOSS-Manager-Design-System)

- ✨ Complete design system template duplicated to your workspace
- 🎨 55+ pre-built mobile app screens
- 📦 Component library with buttons, cards, forms, and more
- 🌓 Light and dark mode support
- 📱 Mobile-responsive designs

**Status:** Ready for brand customization (colors need to be updated from blue → ANA red/green)

### ✅ Comprehensive Documentation

Three detailed guides have been created in your project:

1. **`DESIGN_SYSTEM.md`** - Complete design system specification
   - Brand colors (ANA Corporate Red, Energy Green, ANA Black)
   - Typography scale
   - Spacing and layout guidelines
   - Component specifications
   - Data visualization guidelines
   - Accessibility standards
   - Dark mode implementation

2. **`BUILDER_IO_GUIDE.md`** - Builder.io integration instructions
   - Installation steps
   - React component registration
   - Visual editing setup
   - Custom component creation
   - Content management workflows
   - A/B testing setup

3. **`FIGMA_CUSTOMIZATION_GUIDE.md`** - Step-by-step Figma tutorial
   - How to update brand colors
   - Creating custom components
   - Building page templates
   - Exporting assets
   - Dev handoff process

## 🚀 Quick Start

### For Designers

1. **Open the Figma file:**
   ```
   https://www.figma.com/design/RYlgzrqVZ673tdPxIf9wQD/ANA-EBOSS-Manager-Design-System
   ```

2. **Follow the customization guide:**
   ```
   Read: FIGMA_CUSTOMIZATION_GUIDE.md
   ```

3. **Update colors:**
   - Navigate to Design System page
   - Replace blue (#2563EB) with ANA Red (#e31b23)
   - Add ANA Energy Green (#8dc63f) as accent color
   - Update all component variants

4. **Create custom components:**
   - Telemetry widgets
   - Dashboard cards
   - Status badges
   - Charts and graphs

### For Developers

1. **Review the design system:**
   ```
   Read: DESIGN_SYSTEM.md
   ```

2. **Your colors are already defined in `index.html`:**
   ```html
   <script>
     tailwind.config = {
       theme: {
         extend: {
           colors: {
             brand: { 500: '#e31b23', ... },
             accent: { 500: '#8dc63f', ... },
             dark: { 900: '#1a1a1a', ... }
           }
         }
       }
     }
   </script>
   ```

3. **To add Builder.io (optional):**
   ```bash
   npm install @builder.io/react
   ```

   Then follow: `BUILDER_IO_GUIDE.md`

## 📊 Design System Highlights

### Brand Colors

```css
/* Primary - ANA Corporate Red */
#e31b23  /* Buttons, CTAs, alerts */

/* Accent - ANA Energy Green */
#8dc63f  /* Success states, eco-friendly features */

/* Dark - ANA Black */
#1a1a1a  /* Dark mode backgrounds */
```

### Typography

- **Headings:** 36px → 20px (H1 → H4)
- **Body:** 16px (default), 18px (large), 14px (small)
- **Captions:** 12px
- **Font:** System default (-apple-system, Segoe UI, Roboto)

### Components Already in Your App

✅ Navigation sidebar
✅ Dashboard cards
✅ Unit list/detail views
✅ Customer management
✅ Service tickets
✅ Analytics charts
✅ Dark mode toggle
✅ Responsive layout

### Components to Design in Figma

📝 Enhanced telemetry widgets
📝 Advanced chart templates
📝 Custom dashboard layouts
📝 Mobile-optimized views
📝 Print-friendly reports
📝 Onboarding flows

## 🎯 Recommended Workflow

### Phase 1: Customize Figma (1-2 days)
1. Update all colors to ANA brand
2. Create 5-10 core custom components
3. Design 3-5 page templates
4. Export design tokens

### Phase 2: Implement Components (2-3 days)
1. Build new components in React
2. Apply design system tokens
3. Add to component library
4. Test in light/dark modes

### Phase 3: Builder.io Integration (Optional, 1-2 days)
1. Install Builder.io SDK
2. Register custom components
3. Create editable page models
4. Set up content management

### Phase 4: Advanced Features (Ongoing)
1. Data visualization enhancements
2. Mobile responsiveness improvements
3. Accessibility audit and fixes
4. Performance optimization

## 📁 Project Structure

```
EBOSS-Manager/
├── components/           # React components
│   ├── Dashboard.tsx
│   ├── UnitList.tsx
│   ├── Analytics.tsx
│   └── ...
├── mockData.ts          # Mock data
├── types.ts             # TypeScript types
├── index.html           # Tailwind config with ANA colors
├── DESIGN_SYSTEM.md     # ← Design system reference
├── BUILDER_IO_GUIDE.md  # ← Builder.io integration
├── FIGMA_CUSTOMIZATION_GUIDE.md  # ← Figma instructions
└── DESIGN_README.md     # ← This file
```

## 🎨 Design Tokens Summary

### Colors
- **Brand:** 7 shades (#e31b23 primary)
- **Accent:** 5 shades (#8dc63f primary)
- **Dark:** 5 shades (#1a1a1a primary)
- **Semantic:** Success, Warning, Error, Info
- **Status:** In Service, Maintenance, Down
- **Telemetry:** Online, Warning, Critical, Offline

### Spacing
- Base unit: 4px
- Scale: 1 → 16 (4px → 64px)
- Consistent grid system

### Typography
- 8 text sizes (xs → 4xl)
- 4 font weights (normal → bold)
- System font stack

### Components
- 15+ UI components specified
- 10+ data visualization widgets
- 5+ page templates
- Mobile/desktop variants

## 🔗 Resources

### Documentation
- [Design System Spec](./DESIGN_SYSTEM.md)
- [Builder.io Guide](./BUILDER_IO_GUIDE.md)
- [Figma Tutorial](./FIGMA_CUSTOMIZATION_GUIDE.md)

### Design Files
- [Figma Design System](https://www.figma.com/design/RYlgzrqVZ673tdPxIf9wQD/ANA-EBOSS-Manager-Design-System)
- Logo assets: `/public/logo.png`, `/public/logo-mobile.png`

### External Links
- [Builder.io Docs](https://www.builder.io/c/docs/developers)
- [Figma Help Center](https://help.figma.com/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Lucide Icons](https://lucide.dev/) (already installed)
- [Recharts](https://recharts.org/) (for graphs, already installed)

## 💡 Pro Tips

1. **Use the design system as a reference** - All colors, spacing, and typography are already defined and match your codebase

2. **Customize Figma gradually** - Start with colors, then components, then page templates

3. **Builder.io is optional** - Only add it if you need non-technical users to edit content

4. **Maintain consistency** - Always use design tokens instead of hardcoded values

5. **Test dark mode** - Your app already supports it; make sure new designs do too

6. **Mobile first** - Design for mobile screens first, then scale up

7. **Accessibility matters** - Follow the 4.5:1 contrast ratio for text

8. **Document as you go** - Update the design system docs when you add new components

## 🤝 Next Steps

Choose your path:

### Path A: Visual Design Focus
1. Open Figma file
2. Update brand colors
3. Create custom widgets and templates
4. Export assets for development

### Path B: Builder.io CMS
1. Install Builder.io SDK
2. Register components
3. Set up visual editor
4. Enable content management

### Path C: Direct Development
1. Reference DESIGN_SYSTEM.md
2. Build components in code
3. Apply design tokens
4. Skip Figma customization

## ❓ Questions?

**Q: Do I need to use Figma?**
A: No, the design system is fully documented in `DESIGN_SYSTEM.md`. Figma is useful for visual mockups but not required.

**Q: Do I need Builder.io?**
A: Only if you want non-technical users to edit content visually. Your app works fine without it.

**Q: Can I change the colors in Figma?**
A: Yes! Follow `FIGMA_CUSTOMIZATION_GUIDE.md` for step-by-step instructions.

**Q: Are the design tokens already in my code?**
A: Yes! Check `index.html` - all ANA brand colors are already defined in Tailwind config.

**Q: How do I export from Figma?**
A: Select component → Export section → Choose format (SVG/PNG) → Export

---

**Created:** 2026-01-03
**Figma File:** https://www.figma.com/design/RYlgzrqVZ673tdPxIf9wQD/ANA-EBOSS-Manager-Design-System
**Version:** 1.0
