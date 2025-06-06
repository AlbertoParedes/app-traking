// tailwind.config.js
const { heroui } = require('@heroui/react');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{html,js,jsx}',
    // ...
    // make sure it's pointing to the ROOT node_module
    './node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {}
  },
  darkMode: 'class',
  plugins: [heroui()]
};
