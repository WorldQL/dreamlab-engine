/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,js,tsx,ts}"],
  darkMode: "class",
  plugins: [],
  theme: {
    extend: {
      colors: {
        primary: "rgb(var(--primary))",
        primaryDark: "rgb(var(--primaryDark))",
        primaryLight: "rgb(var(--primaryLight))",
        secondary: "rgb(var(--secondary))",
        secondaryDark: "rgb(var(--secondaryDark))",
        secondaryLight: "rgb(var(--secondaryLight))",
        green: "rgb(var(--green))",
        greenDark: "rgb(var(--greenDark))",
        greenLight: "rgb(var(--greenLight))",
        yellow: "rgb(var(--yellow))",
        yellowDark: "rgb(var(--yellowDark))",
        yellowLight: "rgb(var(--yellowLight))",
        red: "rgb(var(--red))",
        redDark: "rgb(var(--redDark))",
        redLight: "rgb(var(--redLight))",
        background: "rgb(var(--background))",
        card: "rgb(var(--card))",
        textPrimary: "rgb(var(--textPrimary))",
        textSecondary: "rgb(var(--textSecondary))",
        gray: "rgb(var(--gray))",
        icon: "rgb(var(--icon))",
      },
    },
  },
};
