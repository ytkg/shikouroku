import js from "@eslint/js";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import importPlugin from "eslint-plugin-import";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import unicorn from "eslint-plugin-unicorn";

const tsFiles = ["src/**/*.{ts,tsx}"];

export default [
  {
    ignores: ["dist/**", "node_modules/**"]
  },
  js.configs.recommended,
  {
    files: tsFiles,
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: {
          jsx: true
        }
      }
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
      import: importPlugin,
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
      unicorn
    },
    rules: {
      "no-undef": "off",
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_"
        }
      ],
      "@typescript-eslint/consistent-type-imports": [
        "error",
        {
          prefer: "type-imports"
        }
      ],
      "@typescript-eslint/naming-convention": [
        "error",
        {
          selector: "variable",
          format: ["camelCase", "PascalCase", "UPPER_CASE"],
          leadingUnderscore: "allow"
        },
        {
          selector: "function",
          format: ["camelCase", "PascalCase"]
        },
        {
          selector: "parameter",
          format: ["camelCase"],
          leadingUnderscore: "allow"
        },
        {
          selector: "import",
          format: ["camelCase", "PascalCase"]
        },
        {
          selector: "typeLike",
          format: ["PascalCase"]
        },
        {
          selector: "property",
          format: null
        },
        {
          selector: "typeProperty",
          format: null
        },
        {
          selector: "objectLiteralProperty",
          format: null
        }
      ],
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      "import/no-default-export": "error",
      "no-restricted-syntax": [
        "error",
        {
          selector: "Literal[value=/^\\/api\\//]",
          message: "APIパスは `@/shared/config/api-paths` の定数/関数を利用してください。"
        },
        {
          selector: "Literal[value='/login']",
          message: "ルートパスは `@/shared/config/route-paths` を利用してください。"
        },
        {
          selector: "Literal[value='/entities/new']",
          message: "ルートパスは `@/shared/config/route-paths` を利用してください。"
        }
      ],
      "unicorn/filename-case": [
        "error",
        {
          case: "kebabCase"
        }
      ]
    }
  },
  {
    files: ["src/shared/config/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-syntax": "off"
    }
  },
  {
    files: ["src/app/**/*.{ts,tsx}", "src/pages/**/*.{ts,tsx}", "src/widgets/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/features/auth/*"],
              message: "features/auth は公開API `@/features/auth` 経由で参照してください。"
            },
            {
              group: ["@/features/entities/*"],
              message: "features/entities は公開API `@/features/entities` 経由で参照してください。"
            },
            {
              group: ["@/pages/*"],
              message: "app 層から pages の内部実装へ直接依存せず、`@/pages` を利用してください。"
            },
            {
              group: ["@/widgets/*"],
              message: "app 層から widgets の内部実装へ直接依存せず、`@/widgets` を利用してください。"
            }
          ]
        }
      ]
    }
  },
  {
    files: ["src/features/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/features/*/*"],
              message:
                "features層内での deep import は禁止です。同一featureは相対import、他featureは `@/features/<slice>` を利用してください。"
            },
            {
              group: ["@/app", "@/app/*", "@/pages", "@/pages/*", "@/widgets", "@/widgets/*"],
              message: "features 層から app/pages/widgets への依存は禁止です。"
            }
          ]
        }
      ]
    }
  },
  {
    files: ["src/shared/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "@/app",
                "@/app/*",
                "@/pages",
                "@/pages/*",
                "@/widgets",
                "@/widgets/*",
                "@/features",
                "@/features/*"
              ],
              message: "shared 層から上位層への依存は禁止です。"
            }
          ]
        }
      ]
    }
  }
];
