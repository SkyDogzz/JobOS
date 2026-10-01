import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#17202a",
        paper: "#f7f7f2",
        moss: "#526a4f",
        rust: "#a94f37",
        tide: "#2f6f7e"
      }
    }
  },
  plugins: []
};

export default config;

