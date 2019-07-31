const { createDefaultConfig } = require( '@open-wc/testing-karma' );
const merge = require( 'deepmerge' );

module.exports = ( config ) => {
  config.set(
    merge( createDefaultConfig( config ), {
      "browsers": ["ChromeHeadlessNoSandbox"],

      "files": [
        // runs all files ending with .test in the test folder,
        // can be overwritten by passing a --grep flag. examples:
        //
        // npm run test -- --grep test/foo/bar.test.js
        // npm run test -- --grep test/bar/*
        { "pattern": config.grep ? config.grep : 'src/**/*.test.js', "type": 'module' },
      ],

      // see the karma-esm docs for all options
      "esm": {
        // if you are using 'bare module imports' you will need this option
        "nodeResolve": true,
      },

      // https://github.com/karma-runner/karma/issues/2652#issuecomment-431843769
      "captureTimeout": 210000,
      "browserDisconnectTolerance": 3,
      "browserDisconnectTimeout": 210000,
      "browserNoActivityTimeout": 210000,

      "customLaunchers": {
        "ChromeHeadlessNoSandbox": {
          "base": "ChromeHeadless",
          "flags": [
            "--disable-background-timer-throttling",
            "--disable-default-apps",
            "--disable-dev-shm-usage",
            "--disable-device-discovery-notifications",
            "--disable-gpu",
            "--disable-popup-blocking",
            "--disable-renderer-backgrounding",
            "--disable-setuid-sandbox",
            "--disable-translate",
            "--disable-web-security",
            "--enable-logging",
            "--no-first-run",
            "--no-sandbox",
            "--no-default-browser-check",
            "--remote-debugging-port=9222",
          ],
        },
      },
    } ),
  );
  return config;
};
