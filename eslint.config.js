import js from "@eslint/js";
import eslintPluginPrettier from "eslint-plugin-prettier/recommended";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

// Keep the existing TanStack Start guard available in every scoped rule block,
// because `no-restricted-imports` options are replaced (not merged) per config.
const serverOnlyPath = {
  name: "server-only",
  message:
    "TanStack Start does not use the Next.js `server-only` package. Rename the module to `*.server.ts` or mark it with `@tanstack/react-start/server-only`.",
};

// Feature/subfeature internals. Cross-boundary importers must use the public
// index entry (e.g. "@/features/board") instead of reaching into these.
const featureInternalGroups = [
  "@/features/**/api",
  "@/features/**/api/**",
  "@/features/**/components",
  "@/features/**/components/**",
  "@/features/**/hooks",
  "@/features/**/hooks/**",
  "@/features/**/lib",
  "@/features/**/lib/**",
  "@/features/**/model",
  "@/features/**/model/**",
  "@/features/**/types",
  "@/features/**/types/**",
  "@/features/**/sessions",
  "@/features/**/sessions/**",
];

export default tseslint.config(
  {
    ignores: [
      "dist/**",
      ".output/**",
      ".vinxi/**",
      "node_modules/**",
      ".agents/**",
      ".harness-backup/**",
      ".lovable/**",
      "ai-service/**",
      "backend/**",
      "codex-skills-library/**",
      "docs/**",
      "mobile/**",
      "scripts/**",
      "supabase/**",
    ],
  },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "no-restricted-imports": [
        "error",
        {
          paths: [serverOnlyPath],
        },
      ],
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "@typescript-eslint/no-unused-vars": "off",
    },
  },
  // Boundary: routes are thin. They may import feature/subfeature public entries,
  // entities, shared, and UI primitives only. No feature internals
  // (api/components/hooks/lib/model/types/sessions), no global hooks, and no
  // domain components under @/components/* other than the @/components/ui/* layer.
  {
    files: ["src/components/ui/**/*.{ts,tsx}"],
    rules: {
      // shadcn/Radix primitive files intentionally export variant helpers/hooks
      // as part of their public primitive API. App/feature components still use
      // the stricter default rule above.
      "react-refresh/only-export-components": "off",
    },
  },
  {
    files: ["src/routes/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [serverOnlyPath],
          patterns: [
            {
              group: featureInternalGroups,
              message:
                'Routes must import a feature public entry (e.g. "@/features/board"), not feature internals (api/components/hooks/lib/model/types/sessions).',
            },
            {
              group: ["@/components/!(ui)", "@/components/!(ui)/**"],
              message:
                "Routes must not import domain components directly. Only @/components/ui/* primitives are allowed; domain UI lives behind feature/entity public entries.",
            },
            {
              group: ["@/hooks/*", "@/hooks/**"],
              message:
                "Routes must not import global hooks. Use feature-owned hooks via the feature public entry instead.",
            },
          ],
        },
      ],
    },
  },
  // Boundary: shared is the lowest app layer. It must not depend on entities or features.
  {
    files: ["src/shared/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [serverOnlyPath],
          patterns: [
            {
              group: ["@/entities/*", "@/entities/**", "@/features/*", "@/features/**"],
              message:
                "Shared layer must not import from entities or features. Keep shared code dependency-free of higher layers.",
            },
          ],
        },
      ],
    },
  },
  // Boundary: entities are reusable domain primitives. They must not depend on features.
  {
    files: ["src/entities/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [serverOnlyPath],
          patterns: [
            {
              group: ["@/features/*", "@/features/**"],
              message:
                "Entities must not import from features. Entities may depend on shared only.",
            },
          ],
        },
      ],
    },
  },
  // Boundary: features must not import other feature internals. Use entity
  // layer for shared domain logic, or relative imports for own internals.
  // Warning level initially; tighten to error after migration passes complete.
  {
    files: ["src/features/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "warn",
        {
          paths: [serverOnlyPath],
          patterns: [
            {
              group: featureInternalGroups,
              message:
                "Features must not import other feature internals (api/components/hooks/lib/model/types/sessions). Use entity layer (@/entities/*) for shared domain logic, or relative imports for own internals.",
            },
          ],
        },
      ],
    },
  },
  eslintPluginPrettier,
);
