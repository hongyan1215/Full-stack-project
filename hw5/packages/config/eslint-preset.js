/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: false,
  extends: [
    "next/core-web-vitals",
    "plugin:@typescript-eslint/recommended",
    "plugin:react-hooks/recommended",
    "prettier"
  ],
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint"],
  rules: {
    "@typescript-eslint/explicit-module-boundary-types": "off",
    "@typescript-eslint/no-explicit-any": "error"
  },
  ignorePatterns: ["dist", ".next", "build", "coverage"],
};


