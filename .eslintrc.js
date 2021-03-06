module.exports = {
  "extends": [
    "plugin:react/recommended",
    "eslint-config-hughx"
  ],
  "rules": {
    "import/extensions": ["error", "ignorePackages"]
  },
  "overrides": [
    {
      "files": [
        "karma.conf.js",
        "**/*.test.js",
        "**/*.stories.js"
      ],
      "env": {
        "browser": true,
        "node": true,
      },
      "rules": {
        "import/no-extraneous-dependencies": "off"
      }
    }
  ]
};
