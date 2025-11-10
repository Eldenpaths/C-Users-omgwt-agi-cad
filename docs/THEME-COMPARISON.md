# Theme Comparison Table

This document provides a detailed comparison of the AGI-CAD themes, outlining their visual characteristics, technical specifications, and ideal use cases.

---

| Feature                 | Blueprint (Default)                               | Arcane (Parchment)                                | Neon (Blade Runner)                               | Cosmic (Grimoire)                                 |
| :---------------------- | :------------------------------------------------ | :------------------------------------------------ | :------------------------------------------------ | :------------------------------------------------ |
| **Visual Aesthetic**    | Clean, modern, professional, technical            | Scholarly, vintage, mystical, warm                | Cyberpunk, futuristic, high-contrast, energetic   | Ethereal, expansive, deep space, serene           |
| **Background Color**    | `#0b0f17`                                         | `#f9f5ec`                                         | `#0a192f`                                         | `#0a0a14`                                         |
| **Foreground Color**    | `#c7e4ff`                                         | `#2a2a2a`                                         | `#00ffff`                                         | `#ffffff`                                         |
| **Accent Color 1**      | `#00ffff`                                         | `#bfa76f`                                         | `#00ffff`                                         | `#b8c5ff`                                         |
| **Accent Color 2**      | `#ff00ff`                                         | `#8b7355`                                         | `#ff00ff`                                         | `#ffd4ff`                                         |
| **Font Family**         | `system-ui, sans-serif`                           | `'EB Garamond', Georgia, serif`                   | `'Fira Code', 'Courier New', monospace`           | `system-ui, sans-serif`                           |
| **Animation Styles**    | Subtle fades, standard transitions                | Ink bleed, subtle paper texture, golden glow      | Holographic scanlines, intense pulsing glows, glitch, shimmer | Starfield, nebula, ethereal pulsing, slow fades   |
| **Grid Pattern**        | Cyan lines, 32x32px                               | Golden lines, 24x24px, subtle                     | Bright cyan lines, 40x40px, intense               | White lines, 48x48px, constellation-like          |
| **Scrollbar Style**     | Light blue thumb, subtle hover glow               | Golden thumb, subtle hover glow                   | Cyan thumb, strong glow on hover                  | Ethereal blue thumb, strong glow on hover         |
| **Best Use Cases**      | General development, professional work, default   | Creative writing, deep research, philosophical    | Coding, debugging, late-night sessions, high-focus | Data exploration, scientific research, immersive  |
| **Performance**         | Excellent (minimal animations)                    | Very Good (subtle animations)                     | Good (more dynamic shaders, optimized)            | Good (dynamic starfield, optimized shaders)       |
| **Accessibility**       | High contrast, clear readability                  | Good contrast, classic readability                | High contrast, vibrant, can be intense for some   | Good contrast, clear readability                  |
| **Mobile Compatibility**| Fully responsive, optimized                       | Fully responsive, optimized                       | Fully responsive, optimized                       | Fully responsive, optimized                       |
| **Unique Features**     | Default, balanced                                 | Parchment background, serif typography            | Cyberpunk aesthetic, monospace, holographic shaders | Starfield background, ethereal shaders            |

---

## Color Palettes (from `styles/globals.css`)

### Blueprint
*   `--bg`: `#0b0f17`
*   `--fg`: `#c7e4ff`
*   `--accent`: `#00ffff`
*   `--accent-secondary`: `#ff00ff`

### Arcane
*   `--bg`: `#f9f5ec`
*   `--bg-component`: `#f0e6d8`
*   `--fg`: `#2a2a2a`
*   `--accent`: `#bfa76f`
*   `--accent-secondary`: `#8b7355`

### Neon
*   `--bg`: `#0a192f`
*   `--bg-component`: `rgba(10,25,47,0.9)`
*   `--bg-component-translucent`: `rgba(10,25,47,0.7)`
*   `--fg`: `#00ffff`
*   `--accent`: `#00ffff`
*   `--accent-secondary`: `#ff00ff`
*   `--accent-tertiary`: `#ffff00`

### Cosmic
*   `--bg`: `#0a0a14`
*   `--bg-component`: `rgba(10,10,20,0.6)`
*   `--bg-component-translucent`: `rgba(10,10,20,0.4)`
*   `--fg`: `#ffffff`
*   `--accent`: `#b8c5ff`
*   `--accent-secondary`: `#ffd4ff`
*   `--accent-tertiary`: `#ffe5b4`

---

## Performance Considerations

All themes are designed with performance in mind. While themes like Neon and Cosmic incorporate more dynamic visual effects (shaders, animations), these have been optimized to run efficiently on modern hardware. CSS transitions utilize GPU-accelerated properties (`transform`, `opacity`) to ensure smooth changes without significant performance overhead. Memory management for Three.js shaders is also handled to prevent leaks on theme changes.

## Accessibility Ratings

*   **Blueprint:** High contrast and clear typography ensure excellent readability for most users.
*   **Arcane:** Good contrast with a classic, readable serif font.
*   **Neon:** High contrast with vibrant colors. While visually striking, the intensity might be overwhelming for some users. Text shadows enhance readability.
*   **Cosmic:** Good contrast with clear, modern sans-serif typography. The subtle background animations are designed not to interfere with content readability.

## Mobile Compatibility

All themes are built to be fully responsive and are optimized for display across various devices, including desktop, tablet, and mobile. The visual elements and interactive components adapt gracefully to smaller screen sizes, ensuring a consistent user experience regardless of the device.
