/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        cream: {
          50: '#fdfaf6',
          100: '#faf4e9',
          200: '#f0e5d2',
          300: '#e4d1ae',
        },
        primary: {
          50: '#f2fbf7',
          100: '#e0f5ea',
          200: '#c2ead5',
          300: '#94d8b7',
          400: '#5abf96',
          500: '#36a379',
          600: '#288562',
          700: '#236a51',
          800: '#205643',
          900: '#1c4838',
        },
        accent: {
          50: '#fef7ee',
          100: '#fdedd8',
          200: '#f5d7b0',
          300: '#f2bb7d',
          400: '#eb9646',
          500: '#e67b2a',
          600: '#d6621e',
          700: '#b14b1c',
          800: '#8e3f1c',
          900: '#74361c',
        },
      },
    }
  },
  plugins: []
};
