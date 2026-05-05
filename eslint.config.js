const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  ...expoConfig,
  {
    settings: {
      react: { version: "19" },
    },
    rules: {
      "no-console": "warn",
    },
  },
  {
    ignores: ["node_modules/", ".expo/", "dist/"],
  },
]);
