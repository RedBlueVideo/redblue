module.exports = {
  "extends": [
    "plugin:react/recommended",
    "hughx/web-components",
  ],
  "rules": {
    "import/extensions": ["error", "ignorePackages"],
    "no-prototype-builtins": "off",
  },
  "overrides": [
    {
      "files": [
        "karma.conf.js",
        "**/*.test.js",
        "**/*.stories.js",
      ],
      "env": {
        "browser": true,
        "node": true,
      },
      "rules": {
        "import/no-extraneous-dependencies": "off",
      },
    },
  ],
};
