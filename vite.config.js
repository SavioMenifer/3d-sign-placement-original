import obfuscatorPlugin from "vite-plugin-javascript-obfuscator";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    obfuscatorPlugin({
      include: ["script.js"],
      exclude: [/node_modules/],
      apply: "build",
    }),
  ],
});
