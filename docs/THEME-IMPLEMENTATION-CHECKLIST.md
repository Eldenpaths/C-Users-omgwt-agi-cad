# Theme System - Final Implementation Checklist

**Before deploying the theme system, ensure these integration steps are completed:**

---

## Required Integration Steps

### 1. Wrap Root Layout with ThemeProvider

**File to modify**: `app/layout.tsx` or `pages/_app.tsx`

```tsx
import { ThemeProvider } from '@/contexts/ThemeContext'

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider defaultTheme="blueprint">
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
```

**Status**: ⏳ TO DO

---

### 2. Add Theme Class to Body

**File to modify**: `app/layout.tsx` or `pages/_app.tsx`

Ensure the body element has the `body-grid` class for grid backgrounds:

```tsx
<body className="body-grid">
  <ThemeProvider defaultTheme="blueprint">
    {children}
  </ThemeProvider>
</body>
```

**Status**: ⏳ TO DO

---

### 3. Update Topbar in Main Layout

**File to check**: Your main dashboard/layout component

Ensure Topbar is included in the layout:

```tsx
import Topbar from '@/components/Topbar'

export default function DashboardLayout() {
  return (
    <div>
      <Topbar toggleSidebar={handleToggle} />
      {/* rest of layout */}
    </div>
  )
}
```

**Status**: ⏳ TO DO

---

### 4. Verify Font Loading

**File to check**: `app/layout.tsx` or `styles/globals.css`

Ensure custom fonts are loaded (EB Garamond for Arcane, Fira Code for Neon):

Option 1: Using Next.js Font Loader:
```tsx
import { EB_Garamond, Fira_Code } from 'next/font/google'

const ebGaramond = EB_Garamond({ subsets: ['latin'] })
const firaCode = Fira_Code({ subsets: ['latin'] })
```

Option 2: Using CDN (in `<head>`):
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=EB+Garamond:wght@400;600&family=Fira+Code:wght@400;500&display=swap" rel="stylesheet">
```

**Status**: ⏳ TO DO

---

### 5. Build & Bundle Verification

Run production build to verify bundle size:

```bash
npm run build
```

Check:
- [ ] Build completes without errors
- [ ] CSS bundle size increase < 50KB
- [ ] JS bundle size increase < 30KB (gzipped)
- [ ] No missing module errors

**Status**: ⏳ TO DO

---

### 6. Environment Variables (if needed)

If you want to set a default theme via environment variable:

```env
# .env.local
NEXT_PUBLIC_DEFAULT_THEME=blueprint
```

Then update ThemeProvider:
```tsx
<ThemeProvider defaultTheme={process.env.NEXT_PUBLIC_DEFAULT_THEME || 'blueprint'}>
```

**Status**: ⏳ OPTIONAL

---

### 7. Enable Shader Features

Ensure WebGL is not blocked:

```tsx
// Add to component that uses shaders
useEffect(() => {
  const canvas = document.createElement('canvas')
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')

  if (!gl) {
    console.warn('WebGL not supported, shaders will be disabled')
  }
}, [])
```

**Status**: ⏳ TO DO (if using NexusViz with shaders)

---

## Post-Integration Checklist

After completing integration steps:

### Visual Verification
- [ ] Open app in browser
- [ ] Click palette icon in topbar
- [ ] Switch to each theme (Blueprint → Arcane → Neon → Cosmic)
- [ ] Verify visual changes for each theme
- [ ] Check browser console for errors

### Functionality Verification
- [ ] Press Ctrl+Shift+T to cycle themes
- [ ] Refresh page, verify theme persists
- [ ] Open DevTools > Application > Local Storage
- [ ] Verify `agi-cad:theme` key exists with correct value
- [ ] Open in new tab, verify theme syncs

### Component Verification
For each component, verify theme styling works:
- [ ] **Topbar**: Theme selector works, buttons styled
- [ ] **LearningPanel**: Stats cards, sparkline colors correct
- [ ] **NexusViz**: 3D orbs colored correctly, shaders active
- [ ] **RenderPanel**: Panel border, FPS HUD, cosmic starfield

### Performance Verification
- [ ] Open DevTools > Performance
- [ ] Switch themes 5 times
- [ ] Check for:
  - No layout thrashing
  - Transition completes in < 500ms
  - No memory leaks
  - Smooth animations (>30 FPS)

---

## Common Issues & Solutions

### Issue: "useTheme must be used within ThemeProvider"
**Solution**: Ensure your root layout wraps children with `<ThemeProvider>`

### Issue: Fonts not loading
**Solution**:
1. Check network tab for font requests
2. Verify CDN links or Next.js font loader
3. Add fallback fonts in CSS

### Issue: Shaders not rendering
**Solution**:
1. Check WebGL support in browser
2. Verify Three.js is installed: `npm install three`
3. Check console for shader compilation errors

### Issue: Theme not persisting
**Solution**:
1. Check localStorage is not disabled
2. Verify no errors in console during setTheme()
3. Check privacy settings (incognito mode may block localStorage)

### Issue: Starfield not visible in Cosmic theme
**Solution**:
1. Check z-index layering (starfield should be z-0, canvas z-10)
2. Verify component imported correctly
3. Check theme === 'cosmic' condition

---

## Deployment Checklist

Before deploying to production:

- [ ] All integration steps completed
- [ ] No console errors or warnings
- [ ] Theme persists across sessions
- [ ] Tested on Chrome, Firefox, Safari
- [ ] Mobile responsiveness verified
- [ ] Accessibility checked (color contrast, keyboard nav)
- [ ] Performance benchmarks met
- [ ] Documentation reviewed
- [ ] Testing guide completed

---

## Quick Start Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run tests (after setting up)
npm test

# Run E2E tests (after setting up)
npx playwright test
```

---

## Need Help?

Refer to these documents:
- **Integration Guide**: `docs/THEME-INTEGRATION-SUMMARY.md`
- **Testing Guide**: `docs/THEME-TESTING-GUIDE.md`
- **Component Specs**: `temp-gemini-docs/Component-Theme-Specs.md`

---

**Document Status**: ✅ Ready for Implementation
**Last Updated**: 2025-11-09
**Version**: 1.0
