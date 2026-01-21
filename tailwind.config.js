/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  darkMode: 'class', // 启用类名-based 暗模式
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: '1rem',
        sm: '1.5rem',
        lg: '2rem',
        xl: '3rem',
        '2xl': '4rem',
      },
      screens: {
        sm: '640px',
        md: '768px', 
        lg: '1024px',
        xl: '1280px',
        '2xl': '1536px',
      },
    },
    extend: {
      maxWidth: {
        'content': '65ch', // 最佳阅读宽度
        'content-wide': '75ch',
        'content-full': '85ch',
        'dynamic': 'min(90vw, 1400px)', // 动态最大宽度
        'dynamic-content': 'min(85vw, 1200px)',
        'dynamic-narrow': 'min(80vw, 800px)',
      },
      width: {
        'dynamic': 'min(90vw, 1400px)',
        'dynamic-content': 'min(85vw, 1200px)', 
        'dynamic-narrow': 'min(80vw, 800px)',
      },
      colors: {
        primary: '#3b82f6',
        secondary: '#6b7280',
        accent: '#2337ff',
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', '"Noto Sans"', 'Helvetica', 'Arial', 'sans-serif'],
      },
      lineHeight: {
        'relaxed': '1.8',
        'loose': '2',
      },
      backgroundColor: {
        'dark-primary': '#1a1f35',
        'dark-secondary': '#111827',
      },
      textColor: {
        'dark-primary': '#F9FAFB',
        'dark-secondary': '#D1D5DB',
      }
    },
  },
  plugins: [],
}
