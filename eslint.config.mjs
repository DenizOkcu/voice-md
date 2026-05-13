import tseslint from "typescript-eslint";
import js from "@eslint/js";
import globals from "globals";
import obsidianEslint from "eslint-plugin-obsidianmd";

export default tseslint.config(
  {
    ignores: [
      "node_modules/",
      "main.js",
      "*.mjs",
    ]
  },
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    files: ["**/*.ts"],
    ...obsidianEslint.configs.recommended.reduce((merged, config) => ({
      ...merged,
      plugins: { ...merged.plugins, ...config.plugins },
      rules: { ...merged.rules, ...config.rules },
    }), { plugins: {}, rules: {} }),
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
      ecmaVersion: 2020,
      sourceType: "module",
      globals: {
        ...globals.node,
        ...globals.browser
      }
    },
    rules: {
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          args: "none",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_"
        }
      ],
      "@typescript-eslint/ban-ts-comment": "off",
      "@typescript-eslint/no-empty-function": "off",
      "no-prototype-builtins": "off",
      "obsidianmd/ui/sentence-case": ["error", {
        ignoreRegex: ["OpenAI", "GPT", "Voice MD", "gpt-4o"]
      }]
    }
  }
);
