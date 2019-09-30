process.env.CHROME_BIN = require( 'puppeteer' ).executablePath();

module.exports = ( config ) => {
  config.set( {
    "browsers": ["Chrome"],

    // "customLaunchers": {
    //   "FirefoxHeadless": {
    //     "base": "Firefox",
    //     "flags": ["-headless"],
    //   },
    // },

    "files": [
      // {
      //   "pattern": "src/**/*.js",
      //   "type": "module",
      // },
      {
        "pattern": "src/**/!(*.stories).js",
        "type": "module",
      },
    ],

    "proxies": {
      "/src/": "/base/src/",
      // "/node_modules/": "/base/node_modules/",
    },

    "reporters": [
      "spec",
    ],
    // "reporters": ['progress'],

    "plugins": [
      // load plugin
      require.resolve( '@open-wc/karma-esm' ),

      // fallback: resolve any karma- plugins
      // 'karma-*',
      "karma-mocha",
      "karma-chai",
      "karma-chrome-launcher",
      // "karma-firefox-launcher",
      "karma-spec-reporter",
    ],

    "frameworks": [
      "esm",
      "mocha",
      "chai",
    ],

    "esm": {
      // if you are using 'bare module imports' you will need this option
      "nodeResolve": true,
      // set compatibility mode to all
      // "compatibility": 'all',
      "compatibility": 'none',
      // "babelConfig": ".babelrc",
      // "babel": false,
      // "coverage": true
    },
  } );
};
