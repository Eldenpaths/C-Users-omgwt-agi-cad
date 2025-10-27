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
      }
    }
  },
  plugins: []
};