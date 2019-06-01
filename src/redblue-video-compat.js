import RedBlueOmniParser from '/src/parser-omni.js';

(function () {
  'use strict';

  let RedBlueVideo;

  async function initMSEPlayer() {
    let RedBlueMSEPlayer = ( await import( '/src/player-mse.js' ) ).default;
    RedBlueVideo = RedBlueMSEPlayer( RedBlueOmniParser );
    customElements.define( RedBlueVideo.is, RedBlueVideo );
  }

  async function initLegacyPlayer() {
    let RedBlueLegacyPlayer = ( await import( '/src/player-legacy.js' ) ).default;
    RedBlueVideo = RedBlueLegacyPlayer( RedBlueOmniParser );
    customElements.define( RedBlueVideo.is, RedBlueVideo );
  }

  // Self-upgrades the library depending on if Firefox has fixed the appropriate bug or not
  function initPlayerByBugStatus( bugNumber ) {
    const bugXHR = new XMLHttpRequest();

    if ( !( 'responseType' in bugXHR ) ) {
      console.log( 'Browser does not have XHR `responseType`; using legacy player' );
      initLegacyPlayer();
      return;
    }

    bugXHR.open( 'GET', `https://bugzilla.mozilla.org/rest/bug/${bugNumber}?include_fields=status`, true );
    bugXHR.responseType = 'json';
    bugXHR.onload = function () {
      if ( bugXHR.status === 200 ) {
        if ( bugXHR.response.bugs[0].status === 'FIXED' ) {
          const versionXHR = new XMLHttpRequest();

          versionXHR.open( 'GET', 'https://product-details.mozilla.org/1.0/firefox_versions.json', true );
          versionXHR.responseType = 'json';
          versionXHR.onload = function () {
            if ( versionXHR.status === 200 ) {
              const browserVersion = userAgent.match( /\bfirefox\/([0-9]+\.[0-9]+)((?:a|esr|b)(?:[0-9]*))?$/i );

              if ( browserVersion ) {
                browserVersion = parseFloat( browserVersion[1] );
                const latestVersion = parseFloat( versionXHR.response.LATEST_FIREFOX_VERSION );
                // Browser could be beta and ahead of latest public release
                if ( browserVersion >= latestVersion ) {
                  console.log( 'Bug #' + bugNumber + ' has been fixed; this code can be removed' );
                  initMSEPlayer();
                } else {
                  console.log( 'Bug #' + bugNumber + ' has been fixed, but Firefox version is not latest, and therefore not guaranteed to have the bugfix; using legacy player' );
                  initLegacyPlayer();
                }
              // Unmatched browser version; probably old release
              } else {
                console.log( 'Browser version not in recognizable format; using legacy player' );
                initLegacyPlayer();
              }
            // Non-200
            } else {
              console.log( 'Firefox Version API returned bad status; using legacy player' );
              initLegacyPlayer();
            }
            // initMSEPlayer();
          };
          versionXHR.send();
        // not FIXED
        } else {
          console.log( 'Bug #' + bugNumber + ' not fixed; using legacy player' );
          initLegacyPlayer();
        }
      // Non-200
      } else {
        console.log( 'Bugzilla API returned bad status; using legacy player' );
        initLegacyPlayer();
      }
    };

    bugXHR.send();
  }

  const userAgent = navigator.userAgent.toLowerCase();
  const isFirefox = ( userAgent.indexOf( 'firefox' ) > -1 );
  /*
    Firefox gives a false positive for supporting Media Source Extensions.
    This checks to see if the MSE tracking bug has been fixed.
  */
  if ( isFirefox ) {
    initPlayerByBugStatus( '778617' );
  } else if ( RedBlueOmniParser.MSEsupported() ) {
    initMSEPlayer();
  } else {
    initLegacyPlayer();
  }
})();