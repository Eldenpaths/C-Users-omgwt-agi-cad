# AGI-CAD Theme System - Testing Guide

**Version**: 1.0
**Date**: 2025-11-09
**Status**: Ready for Testing

---

## Overview

This guide provides comprehensive testing procedures for the AGI-CAD theme system, covering the Arcane, Neon, and Cosmic themes across all components.

---

## Prerequisites

### Setup Requirements

1. **Development Environment**:
   ```bash
   npm install
   npm run dev
   ```

2. **Test User Account**: Ensure you're logged in with a valid Firebase account

3. **Browser DevTools**: Open browser console for error monitoring

4. **Test Data**: Have some learning sessions in the database for chart visualization

---

## Testing Checklist

### Phase 1: Theme Switching Functionality

#### 1.1 Theme Selector UI
- [ ] **Palette Icon Visibility**: Verify palette icon appears in topbar
- [ ] **Dropdown Menu**: Click palette icon, dropdown should appear
- [ ] **Theme List**: All 4 themes listed (Blueprint, Arcane, Neon, Cosmic)
- [ ] **Current Theme Indicator**: Checkmark appears next to active theme
- [ ] **Theme Descriptions**: Each theme shows description text
- [ ] **Click Outside**: Click outside dropdown, menu should close

**Test Steps**:
```
1. Navigate to dashboard
2. Look for Palette icon in top-right area of topbar
3. Click palette icon
4. Verify dropdown appears with 4 themes
5. Check current theme has checkmark
6. Click outside dropdown area
7. Verify dropdown closes
```

#### 1.2 Keyboard Shortcut
- [ ] **Ctrl+Shift+T**: Press shortcut, theme should cycle
- [ ] **Cycle Order**: Blueprint → Arcane → Neon → Cosmic → Blueprint
- [ ] **Visual Feedback**: Immediate visual change on theme cycle
- [ ] **Persistence**: Refresh page, theme should persist

**Test Steps**:
```
1. Press Ctrl+Shift+T
2. Observe theme change
3. Press again, verify it cycles to next theme
4. Continue pressing until all 4 themes have been tested
5. Refresh page (F5)
6. Verify theme persisted
```

#### 1.3 Theme Persistence
- [ ] **LocalStorage**: Check `localStorage.getItem('agi-cad:theme')`
- [ ] **Page Reload**: Theme survives page refresh
- [ ] **Cross-Tab**: Theme syncs across multiple tabs
- [ ] **Browser Restart**: Theme persists after closing browser

**Test Steps**:
```
1. Set theme to "neon"
2. Open DevTools > Application > Local Storage
3. Find key: agi-cad:theme
4. Verify value: "neon"
5. Refresh page, verify theme is still neon
6. Open new tab to same URL
7. Verify theme matches
8. Close browser, reopen
9. Verify theme persisted
```

---

### Phase 2: Visual Consistency

#### 2.1 Global Styling

##### Arcane Theme
- [ ] **Background**: Warm parchment color (#f9f5ec)
- [ ] **Text**: Dark amber/brown tones
- [ ] **Font**: Serif font (EB Garamond) applied
- [ ] **Grid**: Subtle gold grid lines
- [ ] **Scrollbar**: Golden scrollbar with hover effect

##### Neon Theme
- [ ] **Background**: Dark cyberpunk navy (#0a192f)
- [ ] **Text**: Cyan text (#00ffff)
- [ ] **Font**: Monospace font (Fira Code) applied
- [ ] **Grid**: Bright cyan grid lines
- [ ] **Scrollbar**: Cyan scrollbar with glow on hover
- [ ] **Glow Effects**: Visible neon glow on panels

##### Cosmic Theme
- [ ] **Background**: Deep space black (#0a0a14)
- [ ] **Text**: White text with ethereal glow
- [ ] **Font**: Sans-serif system font
- [ ] **Grid**: White/blue constellation-style grid
- [ ] **Scrollbar**: Blue scrollbar with star glow
- [ ] **Starfield**: Animated starfield visible in background

**Test Steps**:
```
For each theme:
1. Switch to theme
2. Check background color
3. Read some text, verify font and color
4. Scroll page, observe scrollbar
5. Look at grid pattern (zoom out if needed)
6. Check for theme-specific effects (glow, starfield)
```

#### 2.2 Component Styling

##### Topbar
- [ ] **Background**: Adapts to theme
- [ ] **Buttons**: Theme-aware styling
- [ ] **Borders**: Match theme accent colors
- [ ] **Hover Effects**: Theme-appropriate glow/highlight

##### LearningPanel
- [ ] **Panel Container**: Uses theme panel class
- [ ] **Stats Cards**: Border and background match theme
- [ ] **Text Colors**: All text uses theme colors
- [ ] **Sparkline**: Chart line color matches theme
- [ ] **Alerts**: Error/success colors still visible
- [ ] **Badges**: Theme-appropriate badge colors

##### NexusViz (3D Visualization)
- [ ] **Agent Orbs**: Colors match theme palette
- [ ] **Lineage Lines**: Line colors match theme
- [ ] **Lighting**: Scene lighting adapted to theme
- [ ] **Materials**: Correct material types:
  - Arcane: Standard materials with low metalness
  - Neon: Holographic shader materials with glow
  - Cosmic: Cosmic glow shader materials
- [ ] **Status Overlay**: Text and styling match theme

##### RenderPanel
- [ ] **Container**: Theme panel styling applied
- [ ] **Canvas Border**: Matches theme accent
- [ ] **FPS HUD**: Text color and background match theme
- [ ] **Cosmic Background**: Starfield visible only in cosmic theme
- [ ] **Canvas Opacity**: Slightly transparent in cosmic theme

**Test Steps**:
```
For each component and each theme:
1. Navigate to component
2. Switch theme
3. Verify colors match theme palette
4. Check borders, backgrounds, text
5. Hover over interactive elements
6. Check for theme-specific effects
```

---

### Phase 3: Transition Smoothness

#### 3.1 Theme Switching Animation
- [ ] **No Flash**: No white flash when switching
- [ ] **Smooth Fade**: Colors transition smoothly
- [ ] **No Layout Shift**: No content jumping
- [ ] **Font Swap**: Font changes smoothly (no FOUT)
- [ ] **Duration**: Transitions complete in ~0.3-0.5s

**Test Steps**:
```
1. Switch from Blueprint to Neon (dark to dark)
2. Observe transition smoothness
3. Switch from Neon to Arcane (dark to light)
4. Check for flash or harsh transitions
5. Switch from Arcane to Cosmic (light to dark)
6. Verify smooth color fade
```

#### 3.2 Component Re-rendering
- [ ] **No Flicker**: Components don't flicker
- [ ] **Canvas Continuity**: RenderPanel canvas stays running
- [ ] **Chart Continuity**: Charts don't reset/reload
- [ ] **3D Scene**: NexusViz scene doesn't reset
- [ ] **Scroll Position**: Page doesn't jump to top

**Test Steps**:
```
1. Scroll halfway down the page
2. Switch theme
3. Verify scroll position maintained
4. Check RenderPanel FPS counter keeps running
5. Verify NexusViz orbs keep animating
6. Check LearningPanel charts don't reload
```

---

### Phase 4: Responsiveness Testing

#### 4.1 Desktop Breakpoints
- [ ] **1920x1080**: All themes render correctly
- [ ] **1366x768**: Layout adapts, no overflow
- [ ] **1024x768**: Compact layout works

**Test Steps**:
```
For each resolution:
1. Set browser window size
2. Test all 4 themes
3. Check for horizontal scrollbars
4. Verify text is readable
5. Check that panels don't overlap
```

#### 4.2 Tablet Breakpoints
- [ ] **768x1024** (iPad Portrait): Mobile topbar menu works
- [ ] **1024x768** (iPad Landscape): Desktop layout
- [ ] **Theme Selector**: Dropdown works on touch

**Test Steps**:
```
1. Resize to 768px width
2. Verify hamburger menu appears
3. Test theme selector on touch
4. Check that palette icon is tappable
5. Verify dropdown doesn't go off-screen
```

#### 4.3 Mobile Breakpoints
- [ ] **375x667** (iPhone SE): Layout stacks vertically
- [ ] **414x896** (iPhone XR): Elements scale appropriately
- [ ] **360x640** (Android): Minimum working size
- [ ] **Theme Text**: "Blueprint/Arcane/etc" may hide, icon remains

**Test Steps**:
```
1. Resize to 375px width
2. Test theme switching via icon
3. Verify dropdown fits on screen
4. Check all text is readable
5. Verify panels stack properly
```

#### 4.4 Zoom Levels
- [ ] **50% Zoom**: UI scales down correctly
- [ ] **100% Zoom**: Standard view
- [ ] **150% Zoom**: Larger text, no break
- [ ] **200% Zoom**: Accessible view maintained

**Test Steps**:
```
For each zoom level:
1. Press Ctrl+Plus/Minus to zoom
2. Test all themes
3. Verify no layout breaks
4. Check text remains readable
```

---

### Phase 5: Cross-Browser Compatibility

#### 5.1 Chrome/Edge (Chromium)
- [ ] **Theme Switching**: Works flawlessly
- [ ] **CSS Variables**: All variables applied
- [ ] **Shaders**: WebGL shaders render correctly
- [ ] **Starfield**: Cosmic background animates
- [ ] **Fonts**: Custom fonts load

**Test Steps**:
```
1. Open in Chrome/Edge
2. Test all 4 themes
3. Check NexusViz renders (WebGL)
4. Verify cosmic starfield animates
5. Check font rendering
```

#### 5.2 Firefox
- [ ] **Theme Switching**: Works correctly
- [ ] **CSS Variables**: No variable fallback issues
- [ ] **Shaders**: Three.js shaders work
- [ ] **Scrollbar**: Custom scrollbar styling
- [ ] **Performance**: Smooth animations

**Test Steps**:
```
1. Open in Firefox
2. Test all themes
3. Check shader effects (neon glow, cosmic stars)
4. Verify scrollbar styling
5. Check animation performance
```

#### 5.3 Safari (macOS/iOS)
- [ ] **Theme Switching**: Works on Safari
- [ ] **CSS Variables**: Fallbacks if needed
- [ ] **Shaders**: WebGL compatibility
- [ ] **Backdrop Filter**: Blur effects work
- [ ] **Touch Events**: Dropdown works on touch

**Test Steps**:
```
1. Open in Safari (macOS or iOS)
2. Test theme switching
3. Check backdrop-filter blur
4. Verify touch interactions
5. Test WebGL rendering
```

#### 5.4 Mobile Browsers
- [ ] **Chrome Mobile**: Full functionality
- [ ] **Safari iOS**: Touch gestures work
- [ ] **Firefox Mobile**: Rendering correct
- [ ] **Performance**: Acceptable frame rate

**Test Steps**:
```
1. Open on mobile device
2. Test theme switching via touch
3. Check performance (should be >30 FPS)
4. Verify starfield animates smoothly
5. Test gesture navigation
```

---

### Phase 6: Performance Testing

#### 6.1 Theme Switch Performance
- [ ] **Switch Time**: < 500ms to complete
- [ ] **No Lag**: UI remains responsive during switch
- [ ] **Memory**: No memory leaks after multiple switches
- [ ] **CPU**: No CPU spikes

**Test Steps**:
```
1. Open DevTools > Performance
2. Start recording
3. Switch theme 5 times rapidly
4. Stop recording
5. Analyze:
   - Check for layout thrashing
   - Verify no long tasks (>50ms)
   - Check memory usage
```

#### 6.2 Shader Performance
- [ ] **NexusViz FPS**: >30 FPS with shaders
- [ ] **Cosmic Starfield**: >30 FPS background animation
- [ ] **RenderPanel**: Maintains target FPS
- [ ] **Multiple Shaders**: No conflicts

**Test Steps**:
```
1. Switch to Neon theme
2. Navigate to NexusViz
3. Monitor FPS counter
4. Verify >30 FPS maintained
5. Switch to Cosmic theme
6. Check starfield animation smoothness
7. Monitor RenderPanel FPS
```

#### 6.3 Bundle Size Impact
- [ ] **CSS Size**: Check added CSS size
- [ ] **JS Size**: Check ThemeContext bundle size
- [ ] **Shader Size**: Check shader code size
- [ ] **Total Impact**: < 50KB gzipped increase

**Test Steps**:
```
1. Run: npm run build
2. Check .next/static/css/*.css size
3. Check .next/static/chunks/*.js size
4. Compare with pre-theme build
5. Verify total increase < 50KB
```

---

### Phase 7: Accessibility Testing

#### 7.1 Color Contrast
- [ ] **Arcane**: Text readable on parchment background
- [ ] **Neon**: Cyan text meets WCAG AA standard
- [ ] **Cosmic**: White text on dark background compliant
- [ ] **Error Colors**: Red/green still distinguishable

**Test Steps**:
```
1. Use browser extension: Accessibility Insights
2. Run color contrast check for each theme
3. Verify WCAG AA compliance (4.5:1 ratio)
4. Check error states are distinguishable
```

#### 7.2 Keyboard Navigation
- [ ] **Tab Order**: Logical tab order maintained
- [ ] **Focus Indicators**: Visible focus on all themes
- [ ] **Dropdown**: Navigate with arrow keys
- [ ] **Escape Key**: Closes theme dropdown

**Test Steps**:
```
1. Press Tab repeatedly
2. Verify focus indicator visible on all themes
3. Tab to theme selector
4. Press Enter to open
5. Use arrow keys to select theme
6. Press Escape to close
```

#### 7.3 Screen Reader Compatibility
- [ ] **Theme Names**: Screen reader announces theme names
- [ ] **Current Theme**: Announces current selection
- [ ] **Descriptions**: Theme descriptions readable
- [ ] **State Changes**: Announces theme change

**Test Steps**:
```
1. Enable screen reader (NVDA/JAWS/VoiceOver)
2. Navigate to theme selector
3. Listen for theme name announcement
4. Open dropdown
5. Listen for theme descriptions
6. Change theme
7. Verify state change announced
```

---

### Phase 8: Error Handling

#### 8.1 Invalid Theme
- [ ] **Bad LocalStorage**: Falls back to default
- [ ] **Invalid Value**: Doesn't crash, uses default
- [ ] **Corrupted State**: Recovers gracefully

**Test Steps**:
```
1. Open DevTools > Console
2. Run: localStorage.setItem('agi-cad:theme', 'invalid')
3. Refresh page
4. Verify default theme loads
5. Verify no errors in console
```

#### 8.2 Missing Fonts
- [ ] **Font Fallback**: Falls back to system fonts
- [ ] **No FOIT**: No invisible text period
- [ ] **Graceful Degradation**: Still usable

**Test Steps**:
```
1. Block font CDN in DevTools > Network
2. Refresh page
3. Verify text visible immediately
4. Check fallback fonts applied
```

#### 8.3 WebGL Unavailable
- [ ] **Shader Fallback**: Falls back to standard materials
- [ ] **NexusViz**: Still renders without shaders
- [ ] **Starfield**: Hides if WebGL unavailable

**Test Steps**:
```
1. Disable WebGL in browser settings
2. Refresh page
3. Switch to Neon theme
4. Verify NexusViz renders (no shaders)
5. Switch to Cosmic theme
6. Verify starfield doesn't crash
```

---

## Automated Testing

### Unit Tests

Create test files for theme components:

```typescript
// __tests__/ThemeContext.test.tsx
import { renderHook, act } from '@testing-library/react';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';

describe('ThemeContext', () => {
  it('should cycle themes with cycleTheme()', () => {
    const { result } = renderHook(() => useTheme(), {
      wrapper: ThemeProvider,
    });

    expect(result.current.theme).toBe('blueprint');

    act(() => {
      result.current.cycleTheme();
    });

    expect(result.current.theme).toBe('arcane');
  });

  it('should persist theme to localStorage', () => {
    const { result } = renderHook(() => useTheme(), {
      wrapper: ThemeProvider,
    });

    act(() => {
      result.current.setTheme('neon');
    });

    expect(localStorage.getItem('agi-cad:theme')).toBe('neon');
  });
});
```

### Visual Regression Tests

Use Playwright for visual regression:

```typescript
// e2e/theme-visual.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Theme Visual Regression', () => {
  const themes = ['blueprint', 'arcane', 'neon', 'cosmic'];

  for (const theme of themes) {
    test(`${theme} theme renders correctly`, async ({ page }) => {
      await page.goto('/dashboard');

      // Set theme via localStorage
      await page.evaluate((t) => {
        localStorage.setItem('agi-cad:theme', t);
      }, theme);

      await page.reload();

      // Take screenshot
      await expect(page).toHaveScreenshot(`${theme}-dashboard.png`);
    });
  }
});
```

---

## Bug Reporting Template

If you find issues, report with this template:

```markdown
**Theme**: [Blueprint/Arcane/Neon/Cosmic]
**Component**: [Topbar/LearningPanel/NexusViz/RenderPanel/Global]
**Browser**: [Chrome/Firefox/Safari] [Version]
**OS**: [Windows/macOS/Linux/iOS/Android]
**Screen Size**: [Width x Height]

**Issue Description**:
[Clear description of the problem]

**Steps to Reproduce**:
1. [First step]
2. [Second step]
3. [Third step]

**Expected Behavior**:
[What should happen]

**Actual Behavior**:
[What actually happens]

**Screenshots**:
[Attach screenshots if applicable]

**Console Errors**:
```
[Paste any console errors]
```

**Additional Context**:
[Any other relevant information]
```

---

## Success Criteria

The theme system is considered production-ready when:

- ✅ All 4 themes render correctly in all major browsers
- ✅ Theme switching is smooth with no visual glitches
- ✅ All components support theme-aware styling
- ✅ Performance targets met (>30 FPS, <500ms switch time)
- ✅ Accessibility standards met (WCAG AA)
- ✅ Mobile responsiveness verified on multiple devices
- ✅ No console errors or warnings
- ✅ Theme persists correctly across sessions
- ✅ Keyboard shortcuts work reliably

---

## Testing Timeline

**Recommended Testing Schedule**:

1. **Day 1**: Phase 1-2 (Theme switching, visual consistency)
2. **Day 2**: Phase 3-4 (Transitions, responsiveness)
3. **Day 3**: Phase 5-6 (Cross-browser, performance)
4. **Day 4**: Phase 7-8 (Accessibility, error handling)
5. **Day 5**: Automated tests, bug fixes, final validation

---

**Document Version**: 1.0
**Last Updated**: 2025-11-09
**Maintained By**: Claude Code
**Status**: ✅ Ready for Testing
