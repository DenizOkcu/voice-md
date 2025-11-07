import typescriptEslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import js from "@eslint/js";
import globals from "globals";
import obsidianEslint from "eslint-plugin-obsidianmd";

export default [
  {
    ignores: [
      "node_modules/",
      "main.js",
      "*.mjs", // Build scripts
      "esbuild.config.mjs",
      "version-bump.mjs",
      "update-version.mjs"
    ]
  },
  js.configs.recommended,
  {
    files: ["**/*.ts"],
    plugins: {
      "@typescript-eslint": typescriptEslint,
      obsidianmd: obsidianEslint
    },
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: "./tsconfig.json"
      },
      ecmaVersion: 2020,
      sourceType: "module",
      globals: {
        ...globals.node,
        ...globals.browser
      }
    },
    rules: {
      // Disable base rule as it can report incorrect errors
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          args: "none",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_"
        }
      ],
      // TypeScript overrides
      "@typescript-eslint/ban-ts-comment": "off",
      "@typescript-eslint/no-empty-function": "off",
      // JavaScript overrides
      "no-prototype-builtins": "off",
      // The recommended configuration
      ...obsidianEslint.configs.recommended,
      // Add OpenAI, GPT, and Voice MD as recognized terms
      "obsidianmd/ui/sentence-case": ["error", {
        ignoreRegex: ["OpenAI", "GPT", "Voice MD"]
      }]
    }
  }
];