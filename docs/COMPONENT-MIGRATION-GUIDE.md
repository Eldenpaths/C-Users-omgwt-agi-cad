# Component Migration Guide: Making Components Theme-Aware

This guide provides developers with instructions and examples on how to migrate existing AGI-CAD components to be theme-aware. By integrating the theme system, your components can dynamically adapt their appearance based on the user's selected theme, providing a consistent and personalized user experience.

---

## Why Make Components Theme-Aware?

*   **Consistency:** Ensures your component's styling aligns with the overall application theme.
*   **User Experience:** Allows users to personalize their workspace, reducing eye strain and improving aesthetics.
*   **Maintainability:** Centralizes theme definitions, making it easier to update styles across the application.

---

## How to Use the `useTheme()` Hook

The `useTheme()` hook provides access to the current theme's state and configuration.

```typescript
import { useTheme, useThemeStyles } from '@/contexts/ThemeContext';

function MyThemeAwareComponent() {
  const { theme, themeConfig, setTheme, cycleTheme } = useTheme();
  const { panelClass, glowClass, textClass } = useThemeStyles();

  // 'theme' will be 'blueprint', 'arcane', 'neon', or 'cosmic'
  // 'themeConfig' contains detailed metadata for the current theme
  // 'setTheme' allows programmatic theme changes
  // 'cycleTheme' cycles to the next theme

  return (
    <div className={panelClass}>
      <p className={textClass}>Current Theme: {theme}</p>
      <button onClick={() => cycleTheme()}>Cycle Theme</button>
    </div>
  );
}
```

---

## How to Apply Theme Classes

The `useThemeStyles()` hook provides utility classes that dynamically resolve to the correct Tailwind CSS classes based on the active theme.

### Common Patterns

#### Buttons

**Before:**
```html
<button class="bg-blue-500 text-white px-4 py-2 rounded">Click Me</button>
```

**After (using `useThemeStyles()`):**
```typescript
import { useThemeStyles } from '@/contexts/ThemeContext';

function ThemeAwareButton() {
  const { buttonClass } = useThemeStyles(); // Assuming 'buttonClass' is provided by useThemeStyles

  return (
    <button className={buttonClass}>Click Me</button>
  );
}
```
*Note: `buttonClass` is an example. You might construct classes using `theme` directly or use specific utility classes provided by `useThemeStyles()`.*

#### Panels/Containers

**Before:**
```html
<div class="bg-gray-800 border border-gray-700 p-4 rounded-lg">
  Content
</div>
```

**After (using `panelClass`):**
```typescript
import { useThemeStyles } from '@/contexts/ThemeContext';

function ThemeAwarePanel() {
  const { panelClass } = useThemeStyles();

  return (
    <div className={panelClass}>
      Content
    </div>
  );
}
```

#### Text

**Before:**
```html
<p class="text-gray-200 text-lg">Hello World</p>
```

**After (using `textClass`):**
```typescript
import { useThemeStyles } from '@/contexts/ThemeContext';

function ThemeAwareText() {
  const { textClass } = useThemeStyles();

  return (
    <p className={textClass}>Hello World</p>
  );
}
```

---

## Real-World Examples from Different Component Types

Here are 5-6 examples demonstrating how various components were made theme-aware.

### Example 1: NexusViz Orb Colors

**Goal:** Change the color and material of 3D orbs based on the theme.

```typescript
// src/components/nexus/NexusViz.tsx (simplified)
import * as THREE from 'three';
import { useTheme } from '@/contexts/ThemeContext';
import {
  createNeonHolographicMaterial,
  createCosmicGlowMaterial,
  createArcaneInkMaterial // Example, might not be directly used for orbs
} from '@/shaders/ThemeShaders';

function NexusOrb({ orbData }) {
  const { theme } = useTheme();
  let material;

  switch (theme) {
    case 'neon':
      material = createNeonHolographicMaterial(new THREE.Color(0x00ffff));
      break;
    case 'cosmic':
      material = createCosmicGlowMaterial(new THREE.Color(0xb8c5ff));
      break;
    case 'arcane':
      material = new THREE.MeshStandardMaterial({ color: 0xbfa76f, metalness: 0.8, roughness: 0.3 });
      break;
    default: // Blueprint
      material = new THREE.MeshStandardMaterial({ color: 0x00ffff, metalness: 0.5, roughness: 0.5 });
      break;
  }

  return (
    <mesh material={material}>
      {/* Orb geometry */}
    </mesh>
  );
}
```

### Example 2: Topbar Theme Selector Button

**Goal:** Ensure the Topbar button styling adapts to the current theme.

```typescript
// src/components/Topbar.tsx (simplified)
import { useTheme, useThemeStyles } from '@/contexts/ThemeContext';
import { PaletteIcon } from '@heroicons/react/24/outline'; // Example icon

function Topbar() {
  const { theme } = useTheme();
  const { accentTextColorClass, primaryBgClass, primaryHoverBgClass } = useThemeStyles(); // Example utility classes

  return (
    <div className={`flex justify-between items-center p-4 ${primaryBgClass}`}>
      {/* ... other topbar elements */}
      <button
        className={`flex items-center space-x-2 px-3 py-2 rounded-md transition-colors duration-300
                    ${accentTextColorClass} ${primaryHoverBgClass}`}
        onClick={() => {/* open theme selector */}}
      >
        <PaletteIcon className="h-5 w-5" />
        <span>{theme.charAt(0).toUpperCase() + theme.slice(1)}</span>
      </button>
    </div>
  );
}
```

### Example 3: LearningPanel Stat Component

**Goal:** Apply theme-specific backgrounds and borders to statistical display components.

```typescript
// src/components/LearningPanel.tsx (simplified Stat component)
import { useThemeStyles } from '@/contexts/ThemeContext';

function Stat({ label, value }) {
  const { statBgClass, statBorderClass, textClass } = useThemeStyles(); // Example utility classes

  return (
    <div className={`p-3 rounded-lg ${statBgClass} ${statBorderClass}`}>
      <p className={`text-sm font-medium ${textClass}`}>{label}</p>
      <p className={`text-xl font-bold ${textClass}`}>{value}</p>
    </div>
  );
}
```

### Example 4: RenderPanel Background Integration

**Goal:** Dynamically render a theme-specific background component (e.g., Cosmic Starfield).

```typescript
// frontend/src/components/RenderPanel.tsx (simplified)
import { useTheme } from '@/contexts/ThemeContext';
import CosmicStarfield from '@/components/backgrounds/CosmicStarfield';

function RenderPanel() {
  const { theme } = useTheme();

  return (
    <div className="relative w-full h-full overflow-hidden">
      {theme === 'cosmic' && <CosmicStarfield />}
      <canvas className="absolute inset-0 z-10" style={{ opacity: theme === 'cosmic' ? 0.8 : 1 }}>
        {/* Main rendering canvas */}
      </canvas>
      {/* ... other UI elements */}
    </div>
  );
}
```

### Example 5: Theme-Aware Text Styling

**Goal:** Ensure all text elements respect the current theme's font and color palette.

```typescript
// Any component (e.g., a generic TextBlock)
import { useThemeStyles } from '@/contexts/ThemeContext';

function TextBlock({ title, content }) {
  const { headingClass, textClass } = useThemeStyles(); // Example utility classes

  return (
    <div>
      <h2 className={headingClass}>{title}</h2>
      <p className={textClass}>{content}</p>
    </div>
  );
}
```

---

## Troubleshooting Common Migration Issues

*   **"Theme not applying"**:
    *   **Check `ThemeProvider`:** Ensure your application is wrapped within the `ThemeProvider` at a high level (e.g., `_app.tsx` or `layout.tsx`).
    *   **Hook Usage:** Verify that `useTheme()` and `useThemeStyles()` are called within a component that is a descendant of `ThemeProvider`.
    *   **CSS Variable Scope:** Confirm that your global CSS variables in `styles/globals.css` are correctly defined and applied to the `:root` or `[data-theme]` selectors.
    *   **Tailwind Purge:** If using Tailwind JIT/Purge, ensure your theme-specific classes are not being purged. Add them to `tailwind.config.js` `content` array if necessary.

*   **"Flickering on theme change"**:
    *   This can happen if theme classes are applied too late in the render cycle or if CSS transitions are not properly configured. Ensure transitions are defined in `globals.css` or `tailwind.config.js`.
    *   Verify `data-theme` attribute is correctly set on the `<html>` tag by `ThemeProvider`.

*   **"Colors/Fonts look wrong"**:
    *   **Hex Codes:** Double-check the hex codes in `styles/globals.css` and `tailwind.config.js` against the theme specifications.
    *   **Font Loading:** Ensure custom fonts (e.g., 'EB Garamond', 'Fira Code') are correctly loaded and available.
    *   **Specificity:** Be aware of CSS specificity. Inline styles or more specific selectors might override theme classes.

*   **"Shader effects not working"**:
    *   **Dependencies:** Ensure Three.js and related libraries are correctly installed and imported.
    *   **Shader Compilation:** Check the browser console for any WebGL shader compilation errors.
    *   **Material Assignment:** Verify that the correct theme-specific material is being assigned to your 3D objects.
    *   **Animation Loop:** Confirm that `updateShaderTime()` or similar animation logic is being called in your Three.js render loop.

*   **"Performance issues after migration"**:
    *   **Over-rendering:** Avoid unnecessary re-renders. Use `React.memo` or `useCallback`/`useMemo` where appropriate.
    *   **Shader Complexity:** If custom shaders are too complex, optimize them.
    *   **CSS Transitions:** Ensure transitions are using `transform` and `opacity` for GPU acceleration, not properties like `width` or `height`.

By following these guidelines and examples, you can effectively migrate your components to be fully theme-aware, contributing to a more dynamic and user-friendly AGI-CAD experience.
