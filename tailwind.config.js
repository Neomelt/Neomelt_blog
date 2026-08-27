/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  darkMode: "class", // 启用类名-based 暗模式
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: "1rem",
        sm: "1.5rem",
        lg: "2rem",
        xl: "3rem",
        "2xl": "4rem",
      },
      screens: {
        sm: "640px",
        md: "768px",
        lg: "1024px",
        xl: "1280px",
        "2xl": "1536px",
      },
    },
    extend: {
      maxWidth: {
        content: "65ch", // 最佳阅读宽度
        "content-wide": "75ch",
        "content-full": "85ch",
        dynamic: "min(90vw, 1400px)", // 动态最大宽度
        "dynamic-content": "min(85vw, 1200px)",
        "dynamic-narrow": "min(80vw, 800px)",
      },
      width: {
        dynamic: "min(90vw, 1400px)",
        "dynamic-content": "min(85vw, 1200px)",
        "dynamic-narrow": "min(80vw, 800px)",
      },
      // No colour scale here on purpose. Tailwind's theme is resolved at build
      // time, so a colour defined here could never follow a skin change at
      // runtime. All colour lives in src/skins/<skin>/tokens.css and reaches
      // components through var(--x).
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          '"Noto Sans"',
          "Helvetica",
          "Arial",
          "sans-serif",
        ],
      },
      lineHeight: {
        relaxed: "1.8",
        loose: "2",
      },
    },
  },
  plugins: [],
};
