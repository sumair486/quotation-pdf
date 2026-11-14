/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx}", "./components/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#1c2b3a",
        accent: "#1f4e79",
        paper: "#f6f7f9",
        line: "#d9dee5",
      },
    },
  },
  plugins: [],
};
