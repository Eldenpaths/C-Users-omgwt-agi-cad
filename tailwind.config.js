// CLAUDE-EDIT: Updated content paths to include src/ directory
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./hooks/**/*.{js,ts,jsx,tsx}",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        parchment: "#f9f5ec",
        blueprint: "#0b0f17",
        cyan: "#00ffff",
        gold: "#bfa76f"
      },
      animation: {
        'glow': 'glow 2s ease-in-out infinite alternate',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        glow: {
          '0%': {
            filter: 'brightness(1) drop-shadow(0 0 10px rgba(251, 191, 36, 0.5))',
          },
          '100%': {
            filter: 'brightness(1.2) drop-shadow(0 0 20px rgba(251, 191, 36, 0.8))',
          },
        },
        float: {
          '0%, 100%': {
            transform: 'translateY(0px)',
          },
          '50%': {
            transform: 'translateY(-20px)',
          },
        },
        shimmer: {
          '0%': {
            backgroundPosition: '-200% 0',
          },
          '100%': {
            backgroundPosition: '200% 0',
          },
        },
      },
    }
  },
  plugins: []
};