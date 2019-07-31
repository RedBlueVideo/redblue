module.exports = {
  "extends": [
    "eslint-config-hughx"
  ],
  "rules": {
    "import/extensions": ["error", "ignorePackages"]
  },
  "overrides": [
    {
      "files": [
        "karma.conf.js",
        "**/*.test.js"
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
