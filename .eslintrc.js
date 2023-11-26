module.exports = {
  extends: [
    "plugin:react/recommended",
    "hughx-ts/web-components",
  ],
  rules: {
    "import/extensions": ["error", "never"],
    "no-prototype-builtins": "off",
    "no-restricted-syntax": [
      "error",
      // "ForInStatement", // Converting Array-likes to Arrays hurts performance
      "LabeledStatement",
      "WithStatement",
    ],
    "semi-style": "off",
    "arrow-body-style": "off",
    // "one-var": ["error", "consecutive"],
    "strict": "off",
    "lines-around-directive": [
      "error",
      {
        before: "never",
        after: "always",
      },
    ],
    "guard-for-in": "off",
    "no-var": "off",
    "block-scoped-var": "off",
    "quote-props": ["error", "consistent-as-needed"],
  },
  overrides: [
    {
      files: [
        "karma.conf.js",
        "**/*.test.js",
        "**/*.stories.js",
      ],
      env: {
        browser: true,
        node: true,
      },
      rules: {
        "import/no-extraneous-dependencies": "off",
      },
    },
  ],
};
