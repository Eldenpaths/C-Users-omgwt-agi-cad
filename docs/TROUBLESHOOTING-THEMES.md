# Troubleshooting Guide: AGI-CAD Themes

This guide provides solutions to common issues you might encounter with the AGI-CAD theming system. Whether you're a user experiencing visual glitches or a developer facing integration challenges, this document will help you diagnose and resolve problems.

---

## ❓ Common Issues and Solutions

### 1. Theme Not Applying / Not Changing

*   **Symptom:** The application remains in the default theme (Blueprint) or doesn't change when a new theme is selected.
*   **Possible Causes:**
    *   `ThemeProvider` is not correctly implemented or is missing.
    *   `useTheme()` or `useThemeStyles()` hooks are used outside the `ThemeProvider`'s scope.
    *   Browser `localStorage` issues preventing theme persistence.
    *   CSS specificity issues overriding theme styles.
*   **Solutions:**
    1.  **Verify `ThemeProvider`:** Ensure your main application component (e.g., `_app.tsx` or `layout.tsx`) is wrapped with `<ThemeProvider>`.
    2.  **Check Hook Usage:** Confirm that any component using `useTheme()` or `useThemeStyles()` is a child of the `ThemeProvider`.
    3.  **Clear Browser Storage:** Go to your browser's developer tools (F12), navigate to "Application" -> "Local Storage", and clear the `agi-cad:theme` entry. Then try switching themes again.
    4.  **Inspect Element:** Use browser developer tools to inspect elements. Check the `<html>` tag for the `data-theme` attribute (e.g., `data-theme="neon"`). If it's not changing, the `ThemeProvider` isn't updating correctly.
    5.  **Review CSS:** Ensure your custom CSS or component-specific styles aren't accidentally overriding the theme-defined variables or classes.

### 2. Visual Glitches / Incorrect Styling

*   **Symptom:** Elements appear with wrong colors, fonts, or unexpected visual artifacts after a theme change.
*   **Possible Causes:**
    *   Incorrect hex codes or variable names in `styles/globals.css` or `tailwind.config.js`.
    *   Missing or improperly loaded custom fonts.
    *   CSS conflicts or incorrect class application.
    *   Shader compilation errors for themes like Neon or Cosmic.
*   **Solutions:**
    1.  **Cross-Reference Theme Specs:** Double-check the color hex codes and font names in `styles/globals.css` and `tailwind.config.js` against the Theme Comparison Table.
    2.  **Font Loading:** Verify that custom fonts (e.g., 'EB Garamond', 'Fira Code') are correctly imported and loaded. Check the browser console for font loading errors.
    3.  **Tailwind JIT/Purge:** If using Tailwind JIT or PurgeCSS, ensure that theme-specific classes (e.g., `arcane-panel`, `neon-glow`) are included in your `tailwind.config.js` `content` array to prevent them from being removed.
    4.  **Shader Errors (Developer):** For Neon and Cosmic themes, check the browser console for WebGL or Three.js shader compilation errors. If errors occur, the component might fall back to a default material.

### 3. Performance Problems / Lagging UI

*   **Symptom:** The application becomes slow, unresponsive, or experiences frame drops after switching to certain themes (especially Neon or Cosmic).
*   **Possible Causes:**
    *   Overly complex or unoptimized Three.js shaders.
    *   Excessive DOM manipulation or re-renders during theme transitions.
    *   Inefficient CSS animations or transitions.
*   **Solutions:**
    1.  **Check GPU Usage:** Open your browser's task manager or developer tools (Performance tab) to monitor GPU usage. High GPU usage might indicate unoptimized shaders.
    2.  **Optimize Shaders (Developer):** If you've modified the `ThemeShaders.tsx`, ensure they are as efficient as possible. Reduce texture sizes, simplify calculations, or use lower precision where appropriate.
    3.  **CSS Transition Optimization:** Ensure CSS transitions primarily use `transform` and `opacity` properties, which are GPU-accelerated. Avoid animating properties like `width`, `height`, or `margin` on large elements.
    4.  **React Performance (Developer):** Use React DevTools to identify unnecessary re-renders. Implement `React.memo`, `useCallback`, or `useMemo` for components that don't need to update on every theme change.

### 4. Browser Compatibility Issues

*   **Symptom:** Themes look different or broken in certain browsers (e.g., Firefox vs. Chrome).
*   **Possible Causes:**
    *   Browser-specific CSS prefixes are missing.
    *   Differences in WebGL/Three.js implementation across browsers.
    *   `backdrop-filter` property not supported or behaving differently.
*   **Solutions:**
    1.  **Autoprefixer:** Ensure your PostCSS configuration includes `autoprefixer` to add necessary vendor prefixes for CSS properties.
    2.  **`backdrop-filter` Fallback:** For browsers that don't fully support `backdrop-filter`, consider providing a solid color fallback or a less intense blur.
    3.  **Test Across Browsers:** Regularly test all themes on major browsers (Chrome, Firefox, Edge, Safari) to catch inconsistencies early.

### 5. "Theme Not Persisting" Scenarios

*   **Symptom:** The theme reverts to Blueprint or a previous selection after closing and reopening the application, despite having selected a different one.
*   **Possible Causes:**
    *   `localStorage` is full, disabled, or has permission issues.
    *   Errors in the `ThemeProvider`'s logic for saving/loading from `localStorage`.
*   **Solutions:**
    1.  **Check `localStorage`:** As mentioned in "Theme Not Applying," verify the `agi-cad:theme` entry in your browser's local storage.
    2.  **Browser Settings:** Ensure your browser settings allow websites to store data locally.
    3.  **Incognito/Private Mode:** Test in a regular browser window, as incognito/private modes often clear `localStorage` on session end.

---

## 🐛 Error Messages and What They Mean

*   **`WebGL: INVALID_OPERATION: attachShader: object not from this context`**:
    *   **Meaning:** This usually indicates an issue with Three.js shaders, where a shader object is being used with a WebGL context it wasn't created for.
    *   **Solution:** Ensure that your Three.js renderer and materials are correctly initialized and disposed of when the theme changes, especially if shaders are being dynamically created.

*   **`Failed to load resource: the server responded with a status of 404 (Not Found)` (for fonts)**:
    *   **Meaning:** The browser couldn't find the font file specified in your CSS.
    *   **Solution:** Verify the font file paths in your `globals.css` or font loading configuration. Ensure the font files are correctly placed in your `public/` directory or served from a CDN.

*   **`TypeError: Cannot read properties of undefined (reading 'theme')`**:
    *   **Meaning:** A component is trying to access `theme` from `useTheme()` but is not a child of `ThemeProvider`, or `ThemeProvider` itself is not correctly initialized.
    *   **Solution:** Ensure the component is within the `ThemeProvider`'s scope.

---

## 🛠️ Step-by-Step Debugging Process

1.  **Isolate the Issue:** Try to narrow down where the problem occurs. Is it a specific component, a particular theme, or across the entire application?
2.  **Check Console & Network:** Open browser developer tools (F12). Look for errors in the "Console" tab and failed requests in the "Network" tab (e.g., for fonts or assets).
3.  **Inspect Elements:** Use the "Elements" tab to examine the HTML and CSS of the affected components. Verify that the correct `data-theme` attribute is on the `<html>` tag and that the expected CSS variables and classes are applied.
4.  **Review Code Changes:** If you recently made changes, revert them one by one to identify the breaking change.
5.  **Consult Documentation:** Refer to this guide, the Component Migration Guide, and the Theme Integration Summary for relevant information.
6.  **Ask for Help:** If you're still stuck, provide detailed information (browser, theme, steps to reproduce, console errors) when seeking assistance.

By systematically following these troubleshooting steps, you can effectively resolve most theme- related issues in AGI-CAD.
