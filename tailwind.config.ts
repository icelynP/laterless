import type { Config } from "tailwindcss";
const config: Config = { content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"], theme: { extend: { colors: { cream:"#F7F6F1", ink:"#252A25", sage:"#71866D", "sage-light":"#E8EEE5", clay:"#C77B54" }, boxShadow: { soft:"0 12px 36px rgba(36,42,36,.06)" } } }, plugins: [] };
export default config;