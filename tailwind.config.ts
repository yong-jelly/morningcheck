import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "IBM Plex Sans KR",
          "-apple-system",
          "BlinkMacSystemFont",
          "system-ui",
          "Helvetica Neue",
          "Segoe UI",
          "Apple SD Gothic Neo",
          "Noto Sans KR",
          "Malgun Gothic",
          "sans-serif",
        ],
        mono: ["JetBrains Mono", "monospace"],
      },
      colors: {
        // 더 세련된 블루/그레이 계열 (Slack-ish)
        primary: {
          50: "#f8faff",
          100: "#f1f5ff",
          200: "#e0e7ff",
          300: "#c7d2fe",
          400: "#a5b4fc",
          500: "#818cf8",
          600: "#6366f1", // 메인 포인트
          700: "#4f46e5",
          800: "#4338ca",
          900: "#3730a3",
          950: "#1e1b4b",
        },
        // 피그마/슬랙 스타일의 중립적인 회색 팔레트
        surface: {
          50: "#f9f9f9",
          100: "#f0f0f0",
          200: "#e5e5e5",
          300: "#d1d1d1",
          400: "#999999",
          500: "#717171",
          600: "#515151",
          700: "#333333",
          800: "#1a1a1a",
          900: "#121212",
          950: "#080808",
        },
        // 억양 컬러 (Slack의 상태 아이콘 느낌)
        accent: {
          blue: "#1264a3",
          emerald: "#2bac76",
          amber: "#e8912d",
          rose: "#e01e5a",
        },
      },
      boxShadow: {
        "none": "none",
        "minimal": "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
      },
      borderRadius: {
        "sm": "0.125rem",
        "DEFAULT": "0.25rem",
        "md": "0.375rem",
        "lg": "0.5rem",
        "xl": "0.75rem",
        "2xl": "1rem",
      },
      animation: {
        "fade-in": "fade-in 0.15s ease-out",
        "slide-up": "slide-up 0.2s ease-out",
        "slide-down": "slide-down 0.2s ease-out",
        "scale-in": "scale-in 0.15s ease-out",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "slide-up": {
          from: { transform: "translateY(8px)", opacity: "0" },
          to: { transform: "translateY(0)", opacity: "1" },
        },
        "slide-down": {
          from: { transform: "translateY(-8px)", opacity: "0" },
          to: { transform: "translateY(0)", opacity: "1" },
        },
        "scale-in": {
          from: { transform: "scale(0.97)", opacity: "0" },
          to: { transform: "scale(1)", opacity: "1" },
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;

