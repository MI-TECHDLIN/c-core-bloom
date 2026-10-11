import type { Config } from "tailwindcss";
import baseConfig from "../tailwind.config.ts";

const config: Config = {
  ...baseConfig,
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx}",
    "../src/**/*.{ts,tsx}",
  ],
};

export default config;
