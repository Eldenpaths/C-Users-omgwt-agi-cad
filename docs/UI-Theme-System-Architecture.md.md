AGI-CAD: UI Theme System ArchitectureStatus: ⏳ In ProgressOwner: Gemini (UI/IX Architect)1. OverviewThis document defines the core data structures and CSS variable strategy for AGI-CAD's multi-theme system. This architecture ensures that themes are swappable, extensible, and type-safe.The system works by defining a Theme object in TypeScript. A provider will apply the selected theme's cssVariables to the :root element, allowing all components (styled with Tailwind and custom CSS) to react instantly.2. Core Theme Interfaces (TypeScript)// src/core/theme/types.ts

/**
 * The root interface for a theme.
 * Defines all properties required to render a complete theme.
 */
export interface AgiTheme {
  id: 'arcane' | 'neon' | 'cosmic';
  name: string;
  colors: ThemeColors;
  effects: ThemeEffects;
  fonts: ThemeFonts;
  animations: ThemeAnimations;
  cssVariables: Record<string, string>; // The generated CSS variable map
}

/**
 * Defines the semantic color palette.
 * These keys are used to generate CSS variables.
 * e.g., 'bg-page' -> var(--color-bg-page)
 */
export interface ThemeColors {
  // --- Backgrounds
  'bg-page': string; // Main page background
  'bg-component': string; // Card, modal, panel backgrounds
  'bg-component-translucent': string; // Translucent panel (e.g., for Neon)
  'bg-hover': string; // Hover state for lists, buttons
  'bg-active': string; // Active/selected state

  // --- Text
  'text-header': string;
  'text-body': string;
  'text-muted': string;
  'text-accent': string; // For highlights, links
  'text-on-accent': string; // Text on a primary button

  // --- Borders
  'border-primary': string; // Standard borders
  'border-divider': string; // Dividers, separators
  'border-active': string; // Focus rings, active borders

  // --- Accents (Thematic)
  'accent-primary': string; // Buttons, icons
  'accent-secondary': string; // Secondary actions
  'accent-danger': string; // Delete, warning
  
  // --- System-Specific (Glyphs, Graphs)
  'glyph-glow-primary': string;
  'glyph-glow-secondary': string;
  'glyph-line': string; // Nexus graph edge lines
}

/**
 * Defines fonts and their CSS import URLs.
 */
export interface ThemeFonts {
  body: {
    name: string; // e.g., 'Inter'
    import: string; // e.g., '@import url(...);'
  };
  header: {
    name: string; // e.g., 'Orbitron'
    import: string;
  };
  monospace: {
    name: string; // e.g., 'Fira Code'
    import: string;
  };
}

/**
 * Defines shadows, glows, and filters.
 */
export interface ThemeEffects {
  'shadow-card': string; // e.g., '0 4px 12px var(--color-shadow-primary)'
  'shadow-modal': string;
  'glow-text-header': string; // e.g., '0 0 8px var(--color-accent-primary)'
  'glow-component-active': string;
  'backdrop-filter': string; // e.g., 'blur(10px) saturate(120%)'
}

/**
 * Defines reusable keyframe animations.
 */
export interface ThemeAnimations {
  // Keyframe definitions
  keyframes: {
    'pulse-subtle': string;
    'flicker-neon': string;
    'float-cosmic': string;
  };
  // Timing functions
  timing: {
    'ease-in-out-quad': string; // 'cubic-bezier(0.455, 0.03, 0.515, 0.955)'
    'ease-out-back': string; // 'cubic-bezier(0.175, 0.885, 0.32, 1.275)'
  };
}
3. CSS Variable Generation StrategyA utility function will convert a ThemeColors object into a cssVariables map.// src/core/theme/utils.ts (Example)

function generateCssVariables(colors: ThemeColors): Record<string, string> {
  const variables: Record<string, string> = {};
  for (const [key, value] of Object.entries(colors)) {
    variables[`--color-${key}`] = value;
  }
  return variables;
  /*
   * Output: {
   * '--color-bg-page': '#030712',
   * '--color-text-header': '#F59E0B',
   * ...
   * }
   */
}
4. Tailwind IntegrationThe generated CSS variables will be injected into tailwind.config.js to make them available as Tailwind utilities.// tailwind.config.js

// 1. Define semantic colors that map to our CSS variables
const semanticColors = {
  'bg-page': 'var(--color-bg-page)',
  'bg-component': 'var(--color-bg-component)',
  'text-header': 'var(--color-text-header)',
  'text-body': 'var(--color-text-body)',
  'accent-primary': 'var(--color-accent-primary)',
  'glyph-glow': 'var(--color-glyph-glow-primary)',
  // ... all other colors
};

module.exports = {
  theme: {
    extend: {
      colors: semanticColors,
      backgroundColor: theme => ({
        ...theme('colors'),
      }),
      textColor: theme => ({
        ...theme('colors'),
      }),
      borderColor: theme => ({
        ...theme('colors'),
      }),
      // ...
    },
  },
  // ...
};
This architecture allows a component to be styled semantically, like:<div class="bg-bg-component text-text-body border border-border-primary">...</div>When the theme changes, the CSS variables at the :root are swapped, and all components update instantly.