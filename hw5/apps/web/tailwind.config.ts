import type { Config } from "tailwindcss";
import preset from "@config/shared/tailwind-preset";

export default {
  presets: [preset as unknown as Config],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "../../packages/ui/**/*.{ts,tsx}"
  ],
} satisfies Config;


