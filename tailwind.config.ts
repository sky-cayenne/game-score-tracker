import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#17201c",
        mist: "#eef4f1",
        felt: "#1f7a5a",
        gold: "#d69e2e",
        berry: "#b4235f"
      },
      boxShadow: {
        soft: "0 10px 30px rgba(23, 32, 28, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
