import RedBlueOmniParser from './parser-omni.js';
(function init() {
    'use strict';
    let RedBlueVideo;
    const userAgent = navigator.userAgent.toLowerCase();
    const isFirefox = (userAgent.indexOf('firefox') > -1);
    async function initMSEPlayer() {
        const RedBlueMSEPlayer = (await import('./player-mse.js')).default;
        RedBlueVideo = RedBlueMSEPlayer(RedBlueOmniParser);
        customElements.define(RedBlueVideo.is, RedBlueVideo);
    }
    async function initLegacyPlayer() {
        const RedBlueLegacyPlayer = (await import('./player-legacy.js')).default;
        RedBlueVideo = RedBlueLegacyPlayer(RedBlueOmniParser);
        customElements.define(RedBlueVideo.is, RedBlueVideo);
    }
    function initPlayerByBugStatus(bugNumber) {
        const bugXHR = new XMLHttpRequest();
        if (!('responseType' in bugXHR)) {
            console.log('Browser does not have XHR `responseType`; using legacy player');
            initLegacyPlayer();
            return;
        }
        bugXHR.open('GET', `https://bugzilla.mozilla.org/rest/bug/${bugNumber}?include_fields=status`, true);
        bugXHR.responseType = 'json';
        bugXHR.onload = function bugXHROnLoad() {
            if (bugXHR.status === 200) {
                if (bugXHR.response.bugs[0].status === 'FIXED') {
                    const versionXHR = new XMLHttpRequest();
                    versionXHR.open('GET', 'https://product-details.mozilla.org/1.0/firefox_versions.json', true);
                    versionXHR.responseType = 'json';
                    versionXHR.onload = function versionXHROnLoad() {
                        if (versionXHR.status === 200) {
                            let browserVersion = userAgent.match(/\bfirefox\/([0-9]+\.[0-9]+)((?:a|esr|b)(?:[0-9]*))?$/i);
                            if (browserVersion) {
                                browserVersion = parseFloat(browserVersion[1]);
                                const latestVersion = parseFloat(versionXHR.response.LATEST_FIREFOX_VERSION);
                                if (browserVersion >= latestVersion) {
                                    console.log(`Bug #${bugNumber} has been fixed; this code can be removed.`);
                                    initMSEPlayer();
                                }
                                else {
                                    console.log(`Bug #${bugNumber} has been fixed, but Firefox version is not latest, and therefore not guaranteed to have the bugfix; using legacy player.`);
                                    initLegacyPlayer();
                                }
                            }
                            else {
                                console.log('Browser version not in recognizable format; using legacy player');
                                initLegacyPlayer();
                            }
                        }
                        else {
                            console.log('Firefox Version API returned bad status; using legacy player');
                            initLegacyPlayer();
                        }
                    };
                    versionXHR.send();
                }
                else {
                    console.log(`Bug #${bugNumber} not fixed; using legacy player.`);
                    initLegacyPlayer();
                }
            }
            else {
                console.log('Bugzilla API returned bad status; using legacy player');
                initLegacyPlayer();
            }
        };
        bugXHR.send();
    }
    if (isFirefox) {
        initPlayerByBugStatus(778617);
    }
    else if (RedBlueOmniParser.MSEsupported()) {
        initMSEPlayer();
    }
    else {
        initLegacyPlayer();
    }
}());
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVkYmx1ZS12aWRlby1jb21wYXQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvcmVkYmx1ZS12aWRlby1jb21wYXQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxpQkFBaUIsTUFBTSxrQkFBa0IsQ0FBQztBQUVqRCxDQUFFLFNBQVMsSUFBSTtJQUNiLFlBQVksQ0FBQztJQUViLElBQUksWUFBc0MsQ0FBQztJQUUzQyxNQUFNLFNBQVMsR0FBRyxTQUFTLENBQUMsU0FBUyxDQUFDLFdBQVcsRUFBRSxDQUFDO0lBQ3BELE1BQU0sU0FBUyxHQUFHLENBQUUsU0FBUyxDQUFDLE9BQU8sQ0FBRSxTQUFTLENBQUUsR0FBRyxDQUFDLENBQUMsQ0FBRSxDQUFDO0lBRTFELEtBQUssVUFBVSxhQUFhO1FBQzFCLE1BQU0sZ0JBQWdCLEdBQUcsQ0FBRSxNQUFNLE1BQU0sQ0FBRSxpQkFBaUIsQ0FBRSxDQUFFLENBQUMsT0FBTyxDQUFDO1FBQ3ZFLFlBQVksR0FBRyxnQkFBZ0IsQ0FBRSxpQkFBaUIsQ0FBRSxDQUFDO1FBQ3JELGNBQWMsQ0FBQyxNQUFNLENBQUUsWUFBWSxDQUFDLEVBQUUsRUFBRSxZQUFZLENBQUUsQ0FBQztJQUN6RCxDQUFDO0lBRUQsS0FBSyxVQUFVLGdCQUFnQjtRQUM3QixNQUFNLG1CQUFtQixHQUFHLENBQUUsTUFBTSxNQUFNLENBQUUsb0JBQW9CLENBQUUsQ0FBRSxDQUFDLE9BQU8sQ0FBQztRQUM3RSxZQUFZLEdBQUcsbUJBQW1CLENBQUUsaUJBQWlCLENBQUUsQ0FBQztRQUN4RCxjQUFjLENBQUMsTUFBTSxDQUFFLFlBQVksQ0FBQyxFQUFFLEVBQUUsWUFBWSxDQUFFLENBQUM7SUFDekQsQ0FBQztJQUdELFNBQVMscUJBQXFCLENBQUUsU0FBaUI7UUFDL0MsTUFBTSxNQUFNLEdBQUcsSUFBSSxjQUFjLEVBQUUsQ0FBQztRQUVwQyxJQUFLLENBQUMsQ0FBRSxjQUFjLElBQUksTUFBTSxDQUFFLEVBQUcs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