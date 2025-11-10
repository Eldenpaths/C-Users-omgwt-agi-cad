
# Cross-Browser & Platform Test Matrix

This document outlines the test matrix for ensuring theme features work consistently across supported browsers and platforms.

## Testing Key
- **✅**: Verified, works as expected.
- **⚠️**: Works, but with minor visual glitches or performance issues.
- **❌**: Fails, feature is broken or unusable.
- **⏳**: Pending test.
- **N/A**: Not applicable for this platform.

## Instructions
For each item, perform the described action and update the status emoji. Add notes for any `⚠️` or `❌` results.

---

## Test Matrix

| Feature / Test Case | Chrome 120+ (Desktop) | Firefox 121+ (Desktop) | Safari 17+ (Desktop) | Edge 120+ (Desktop) | Chrome (Android 13+) | Safari (iOS 17+) |
|---------------------|:---------------------:|:----------------------:|:--------------------:|:-------------------:|:--------------------:|:----------------:|
| **Core Theme System** | | | | | | |
| Blueprint theme loads on first visit | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ |
| Arcane theme loads correctly | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ |
| Neon theme loads correctly | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ |
| Cosmic theme loads correctly | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ |
| `Ctrl+Shift+T` cycles themes | ⏳ | ⏳ | ⏳ | ⏳ | **N/A** | **N/A** |
| Theme selection persists in `localStorage` after refresh | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ |
| Theme selection syncs across open tabs | ⏳ | ⏳ | ⏳ | ⏳ | **N/A** | **N/A** |
| **LearningPanel Styling** | | | | | | |
| **Arcane**: Sparkline has golden color | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ |
| **Arcane**: Stat cards have parchment background | ⏳ | - | ⏳ | ⏳ | ⏳ | ⏳ |
| **Arcane**: 'EB Garamond' serif font loads | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ |
| **Neon**: Sparkline has cyan glow | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ |
| **Neon**: 'Fira Code' monospace font loads | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ |
| **Cosmic**: Text uses starlight blue color | ⏳ | ⏳ | - | ⏳ | ⏳ | ⏳ |
| **Blueprint**: Chart uses default blue colors | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ |
| **RenderPanel & WebGL** | | | | | | |
| **Cosmic**: Starfield background renders and animates | ⏳ | ⏳ | ⚠️ | ⏳ | ⚠️ | ⚠️ |
| **Cosmic**: WebGL shaders for starfield compile without errors | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ |
| **Cosmic**: Canvas opacity is set correctly | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ |
| **Cosmic**: FPS counter is visible and updates | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ |
| **Other Themes**: No starfield is rendered | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ |
| **Performance** | | | | | | |
| Theme switch transition completes in < 500ms | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ |
| **Cosmic**: Starfield maintains > 30 FPS on desktop | ⏳ | ⏳ | ⏳ | ⏳ | **N/A** | **N/A** |
| **Cosmic**: Starfield maintains > 20 FPS on mobile | **N/A** | **N/A** | **N/A** | **N/A** | ⏳ | ⏳ |
| No significant memory leak after 5 mins of theme switching | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ |
| **Accessibility** | | | | | | |
| High contrast text is legible in all themes | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ |
| Focus outlines are visible and theme-appropriate | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ |
| Reduced motion OS setting disables animations | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ |
| **Edge Cases** | | | | | | |
| Rapidly cycling themes doesn't crash the app | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ |
| Browser zoom (150%) doesn't break layouts in any theme | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ |
| Printing the page uses a simplified, print-friendly style | ⏳ | ⏳ | ⏳ | ⏳ | **N/A** | **N/A** |

---
## Notes & Known Issues
*   **Safari/iOS `⚠️` on Cosmic Theme**: The starfield animation can be choppy on older devices. It is disabled on mobile breakpoints, but may still affect tablets.
*   **Firefox `⚠️` on Arcane Theme**: The parchment background texture occasionally loads slower than other assets, causing a flicker.
*   **General Mobile**: Performance on mobile is a key area for monitoring, especially for WebGL-heavy features like the Cosmic theme.
