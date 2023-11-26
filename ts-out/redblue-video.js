'use strict';
export var CachingStrategies;
(function (CachingStrategies) {
    CachingStrategies[CachingStrategies["LAZY"] = 0] = "LAZY";
    CachingStrategies[CachingStrategies["PRELOAD"] = 1] = "PRELOAD";
})(CachingStrategies || (CachingStrategies = {}));
var MediaFileTypes;
(function (MediaFileTypes) {
    MediaFileTypes["mp4"] = "video/mp4";
    MediaFileTypes["webm"] = "video/webm";
})(MediaFileTypes || (MediaFileTypes = {}));
export default class RedBlueVideo extends HTMLElement {
    static get is() {
        return 'redblue-video';
    }
    static get template() {
        return `
      <template id="${RedBlueVideo.is}">
        <style>
          :host {
            position: relative;
            display: block;
            border: 1px solid black;
          }

          .redblue-player-wrapper {
            position: relative;
            overflow: hidden;
          }

          :host([aspect-ratio="16:9"]) .redblue-player-wrapper {
            padding-bottom: 56.25%; /* 16:9 */
            height: 0;
          }

          .redblue-player {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
          }

          .redblue-content {}

          .redblue-description {
            overflow: auto;
          }

          .redblue-player {}

          .redblue-fullscreen-context {
            width: 100%;
          }

          .redblue-prompt {
            text-align: center;
            margin: 0 auto;
            width: 100%;
            position: absolute;
          }

          .redblue-annotations {
            width: 0;
            height: 0;
          }

          .redblue-annotations__link {
            position: absolute;
            border: 1px solid transparent;
            border-radius: 3px;
            display: inline-flex;
            text-align: center;
            align-items: center;
            justify-content: center;
            color: transparent;
            border: 3px solid rgba(139,157,195,1);
          }

          .redblue-fullscreen-button {
            position: absolute;
          }
        </style>
        <div class="redblue-content">
          <div id="fullscreen-context" class="redblue-player-wrapper redblue-fullscreen-context">
            <slot name="player">
              <iframe id="embedded-media" class="redblue-player"
                src=""
                frameborder="0"
                allow="autoplay; encrypted-media"
                allowfullscreen="allowfullscreen"
                hidden="hidden"
              >
              </iframe>
              <video id="local-media" class="redblue-player"
                src=""
                controls="controls"
                hidden="hidden"
              >
              </video>
            </slot>
            <button id="fullscreen-button" class="redblue-fullscreen-button">Toggle Fullscreen</button>
            <nav id="annotations" class="redblue-annotations"></nav>
          </div>
          <div id="description" class="redblue-description"></div>
        </div>
      </template>
    `;
    }
    static get NS() {
        return {
            hvml: "https://hypervideo.tech/hvml#",
            ovml: "http://vocab.nospoon.tv/ovml#",
            html: "http://www.w3.org/1999/xhtml",
            xlink: "http://www.w3.org/1999/xlink",
            css: "https://www.w3.org/TR/CSS/",
            xml: "http://www.w3.org/XML/1998/namespace",
        };
    }
    static get cachingStrategies() {
        return {
            LAZY: 0,
            PRELOAD: 1,
        };
    }
    static reCamelCase(nodeName) {
        const map = {
            endtime: "endTime",
            endx: "endX",
            endy: "endY",
            starttime: "startTime",
            startx: "startX",
            starty: "startY",
            choiceprompt: "choicePrompt",
        };
        if (nodeName in map) {
            return map[nodeName];
        }
        return nodeName;
    }
    static MSEsupported() {
        return !!(window.MediaSource || window.WebKitMediaSource);
    }
    get HVML_SOLO_ELEMENTS() {
        return [
            "presentation",
        ];
    }
    get hasXMLParser() {
        return false;
    }
    get hasJSONLDParser() {
        return false;
    }
    get hasMSEPlayer() {
        return false;
    }
    get hostDocument() {
        const body = this.ownerDocument.body.nodeName;
        return {
            isPlainHTML: () => body === 'BODY',
            isXHTML: () => body === 'body',
        };
    }
    getNonlinearPlaylistTargetIDfromChoiceLink($choiceLink) {
        let href;
        if ($choiceLink instanceof HTMLAnchorElement && $choiceLink.hasAttribute('href')) {
            href = $choiceLink.getAttribute('href');
        }
        else if ($choiceLink instanceof Element && this.hasAttributeAnyNS($choiceLink, 'xlink:href')) {
            href = this.getAttributeAnyNS($choiceLink, 'xlink:href');
        }
        else if ('href' in $choiceLink) {
            ({ href } = $choiceLink);
        }
        else if ('xlink:href' in $choiceLink) {
            href = $choiceLink['xlink:href'];
        }
        if (!href) {
            throw new TypeError('Choice link has no `href` or `xlink:href` attribute; no action to perform.');
        }
        if (!/^#/i.test(href)) {
            throw new TypeError('Choice link’s `href` attribute must be a valid CSS or XLink ID selector (i.e. it must start with a hash symbol)');
        }
        href = href.slice(1);
        return href;
    }
    getNonlinearPlaylistTargetIDfromGoto($goto) {
        let href;
        if (this.hasAttributeAnyNS($goto, 'xlink:href')) {
            href = this.getAttributeAnyNS($goto, 'xlink:href');
        }
        if (!href) {
            throw new TypeError('Goto has no `href` or `xlink:href` attribute; no action to perform.');
        }
        if (!/^#/i.test(href)) {
            throw new TypeError('Goto’s href must be a valid CSS or XLink ID selector (i.e. it must start with a hash symbol)');
        }
        href = href.slice(1);
        return href;
    }
    getNonlinearPlaylistItemFromTargetID(id) {
        let xpath;
        if (this.hostDocument.isXHTML()) {
            xpath = `//*[@xml:id="${id}"]`;
        }
        else {
            xpath = `//*[@id="${id}"]`;
        }
        const nextPlaylistResult = this.find(xpath);
        let $nextPlaylistItem;
        if (nextPlaylistResult && nextPlaylistResult.snapshotLength) {
            $nextPlaylistItem = nextPlaylistResult.snapshotItem(0);
        }
        else {
            throw new Error(`No HVML elements found after following choice link to \`${xpath}\``);
        }
        return $nextPlaylistItem;
    }
    getNonlinearPlaylistItemFromChoiceLink($choiceLink) {
        const id = this.getNonlinearPlaylistTargetIDfromChoiceLink($choiceLink);
        return this.getNonlinearPlaylistItemFromTargetID(id);
    }
    queueNonlinearPlaylistItemsFromChoiceLink($choiceLink) {
        const $nextPlaylistItem = this.getNonlinearPlaylistItemFromChoiceLink($choiceLink);
        if (this.hasAttributeAnyNS($nextPlaylistItem, 'xlink:href')) {
            const fileXPath = this._getXPathFromXPointerURI(this.getAttributeAnyNS($nextPlaylistItem, 'xlink:href'));
            if (this.cachingStrategy === RedBlueVideo.cachingStrategies.LAZY) {
                this.fetchMediaFromFileElements(fileXPath);
            }
            this.queueMediaFromFileElements(fileXPath);
            const gotoResult = this.find('.//goto[1]', $nextPlaylistItem);
            let $goto;
            if (gotoResult && gotoResult.snapshotLength) {
                $goto = gotoResult.snapshotItem(0);
                const targetID = this.getNonlinearPlaylistTargetIDfromGoto($goto);
                const $playlistItem = this.getNonlinearPlaylistItemFromTargetID(targetID);
                this._handleMediaFromPlaylistItem($playlistItem, ($mediaElement) => {
                    if (this.cachingStrategy === RedBlueVideo.cachingStrategies.LAZY) {
                        this.fetchMediaFromMediaElement($mediaElement);
                    }
                    this.queueMediaFromMediaElement($mediaElement);
                });
            }
        }
    }
    handleChoice($clicked) {
        this.$.localMedia?.addEventListener('timeupdate', this.Events.presentChoice, false);
        if (this.$.currentChoice) {
            this.$.currentChoice.hidden = true;
        }
        if (!$clicked.dataset.index) {
            throw new TypeError(`Choice links must have a \`data-index\` attribute. This attribute should have been set for you via \`this.createHotspot()\` under standard usage.`);
        }
        this.log('choice clicked');
        const currentAnnotation = this.annotations[this.currentChoiceAnnotationIndex];
        const currentChoiceChoiceIndex = Number($clicked.dataset.index.split('-')[1]);
        const timelineProperty = currentAnnotation.choices?.[currentChoiceChoiceIndex].goto.timeline;
        if (timelineProperty && (timelineProperty === 'replace')) {
            this.log('replacing timeline');
            this.currentChoiceAnnotationIndex = 0;
            this.mediaQueue = [];
            if (this.MSE) {
                this.MSE.init();
            }
        }
        else {
            this.log('appending to timeline');
            ++this.currentChoiceAnnotationIndex;
        }
        this.$.currentChoice = this.$id(`annotation-${this.currentChoiceAnnotationIndex}`);
        this.queueNonlinearPlaylistItemsFromChoiceLink($clicked);
    }
    _registerChoiceEvents() {
        if (this.isNonlinear()) {
            if (!this.$.localMedia) {
                console.warn('No local media element on which to add event listener');
            }
            this.$.localMedia?.addEventListener('timeupdate', this.Events.presentChoice, false);
        }
        if (!this.$.annotations) {
            console.warn('No annotations container on which to add event listener');
        }
        this.$.annotations?.addEventListener('click', this.Events.choiceClicked, false);
    }
    constructor() {
        super();
        this.hvml = {
            jsonLD: null,
            xml: null,
        };
        this.bufferTypes = {
            webm: 'video/webm; codecs="vorbis,vp8"',
            mp4: 'video/mp4; codecs="avc1.42E01E,mp4a.40.2"',
        };
        this.mimeTypes = {
            webm: 'video/webm',
            mp4: 'video/mp4',
        };
        this.DEBUG_MEDIA = 'webm';
        this.DEBUG_BUFFER_TYPE = this.bufferTypes[this.DEBUG_MEDIA];
        this.DEBUG_MIME_TYPE = this.mimeTypes[this.DEBUG_MEDIA];
        this.POLLING_INTERVAL = 16.66666666667;
        this.duration = 0;
        this.embedID = (new Date().getTime());
        this.$template = this.parseHTML(RedBlueVideo.template
            .replace('id="embedded-media"', `id="embedded-media-${this.embedID}"`)
            .replace('id="local-media"', `id="local-media-${this.embedID}"`)).children.namedItem(RedBlueVideo.is);
        this.$ = {};
        this.currentChoiceAnnotationIndex = 0;
        this.firstChoiceSelected = false;
        this.firstSegmentAppended = false;
        this.lastSegmentAppended = false;
        this.Events = {
            presentChoice: (event) => {
                const $videoPlayer = event.target;
                const currentTime = +$videoPlayer.currentTime.toFixed(0);
                const currentDuration = +$videoPlayer.duration.toFixed(0);
                if (currentTime === currentDuration) {
                    this.log('choice presented');
                    if (this.$.currentChoice) {
                        this.$.currentChoice.hidden = false;
                    }
                    $videoPlayer.removeEventListener('timeupdate', this.Events.presentChoice, false);
                }
            },
            choiceClicked: (event) => {
                event.preventDefault();
                let $clicked = event.target;
                let nodeName = $clicked.nodeName.toLowerCase();
                if (nodeName !== 'a') {
                    while ($clicked
                        && ($clicked !== event.currentTarget)
                        && (nodeName !== 'a')) {
                        $clicked = $clicked.parentElement;
                        if ($clicked) {
                            nodeName = $clicked.nodeName.toLowerCase();
                        }
                        else {
                            throw new TypeError(`A choice was clicked, but neither it nor its ancestors were \`a\` elements.`);
                        }
                    }
                }
                if (nodeName === 'a') {
                    this.handleChoice($clicked);
                }
            },
        };
        this.player = {};
        this.XHR = {
            GET: (url, type, callback) => {
                this.log('--XHR.GET()--');
                var xhr = new XMLHttpRequest();
                xhr.open('GET', url, true);
                xhr.responseType = 'arraybuffer';
                xhr.send();
                xhr.onload = () => {
                    if (xhr.status !== 200) {
                        this.log(`Unexpected HTTP status code ${xhr.status} for ${url}.`);
                        return false;
                    }
                    callback(new Uint8Array(xhr.response), type);
                };
            },
        };
        this.embedID = (new Date().getTime());
        this.$template = this.parseHTML(RedBlueVideo.template
            .replace('id="embedded-media"', `id="embedded-media-${this.embedID}"`)
            .replace('id="local-media"', `id="local-media-${this.embedID}"`)).children.namedItem(RedBlueVideo.is);
        this.embedID = (new Date().getTime());
        this.$template = this.parseHTML(RedBlueVideo.template
            .replace('id="embedded-media"', `id="embedded-media-${this.embedID}"`)
            .replace('id="local-media"', `id="local-media-${this.embedID}"`)).children.namedItem(RedBlueVideo.is);
        this.mediaQueue = [];
        this._isNonlinear = false;
        this.MISSING_XML_PARSER_ERROR = 'Can’t process; XML mixin class has not been applied.';
        this.MISSING_JSONLD_PARSER_ERROR = 'Can’t process; JSON-LD mixin class has not been applied.';
        this.MISSING_HVML_PARSER_ERROR = 'Can’t process; neither XML nor JSON-LD mixin classes have been applied';
        this.YOUTUBE_VIDEO_REGEX = /^(?:https?:)?\/\/(?:www\.)?youtube\.com\/watch\?v=([^&?]+)/i;
        this.YOUTUBE_DOMAIN_REGEX = /^(?:(?:https?:)?\/\/)?(?:www\.)?youtube\.com/i;
        this.VIMEO_VIDEO_REGEX = /^(?:https?:)?\/\/(?:www\.)?vimeo\.com\/([^/]+)/i;
        this.VIMEO_DOMAIN_REGEX = /^(?:(?:https?:)?\/\/)?(?:www\.)?vimeo\.com/i;
    }
    isNonlinear() {
        return this._isNonlinear;
    }
    hasAttributeAnyNS($element, attribute) {
        if (!$element) {
            return false;
        }
        const attributeParts = attribute.split(':');
        if (attributeParts.length > 1) {
            const namespace = attributeParts[0];
            const localName = attributeParts[1];
            if (this.hostDocument.isXHTML()) {
                if (RedBlueVideo.NS.hasOwnProperty(namespace)) {
                    return $element.hasAttributeNS(RedBlueVideo.NS[namespace], localName);
                }
                throw new Error(`Can’t check if <${$element.nodeName.toLowerCase()}> has attribute “${attribute}”: no namespace URI defined in \`RedBlueVideo.NS\` for “${namespace}”`);
            }
        }
        return $element.hasAttribute(attribute);
    }
    getAttributeAnyNS($element, attribute) {
        const attributeParts = attribute.split(':');
        if (attributeParts.length > 1) {
            const namespace = attributeParts[0];
            const localName = attributeParts[1];
            if (this.hostDocument.isXHTML()) {
                if (RedBlueVideo.NS.hasOwnProperty(namespace)) {
                    return $element.getAttributeNS(RedBlueVideo.NS[namespace], localName);
                }
                throw new Error(`Can’t get attribute “${attribute}” from <${$element.nodeName.toLowerCase()}>: no namespace URI defined in \`RedBlueVideo.NS\` for “${namespace}”`);
            }
        }
        return $element.getAttribute(attribute);
    }
    _getXPathFromXPointerURI(uri) {
        return uri.replace(/#xpointer\(([^)]+)\)/i, '$1');
    }
    getMimeTypeFromFileElement($fileElement) {
        const container = this.find('.//container/mime/text()', $fileElement).snapshotItem(0);
        const videoCodec = this.find('.//codec[@type="video"]/mime/text()', $fileElement).snapshotItem(0);
        const audioCodec = this.find('.//codec[@type="audio"]/mime/text()', $fileElement).snapshotItem(0);
        const ambiguousCodec = this.find('.//codec[not(@type)]/mime/text()').snapshotItem(0);
        let mimeType = '';
        const codecs = [];
        if (container) {
            mimeType += container.textContent;
            if (videoCodec) {
                codecs.push(videoCodec.textContent);
            }
            if (audioCodec) {
                codecs.push(audioCodec.textContent);
            }
            if (codecs.length) {
                mimeType += `; codecs=${codecs.join(',')}`;
            }
        }
        else if (ambiguousCodec) {
            mimeType += ambiguousCodec.textContent;
        }
        return mimeType;
    }
    fetchMedia(mediaQueueObject) {
        fetch(mediaQueueObject.path, {
            method: "GET",
            cache: "force-cache",
        })
            .then(() => {
        })
            .catch((error) => {
            console.error(error);
        });
    }
    _handleMediaFromFileElements(xpath, callback) {
        const fileElements = this.find(xpath);
        for (let index = 0; index < fileElements.snapshotLength; index++) {
            const fileElement = fileElements.snapshotItem(index);
            const mimeType = this.getMimeTypeFromFileElement(fileElement);
            if (fileElement.nodeName.toLowerCase() !== 'file') {
                throw new TypeError(`\`_handleMediaFromFileElements#xpath\` must exclusively resolve to HVML \`file\` elements.`);
            }
            if (!this.hasAttributeAnyNS(fileElement, 'xlink:href')) {
                throw new TypeError(`\`_handleMediaFromFileElements#xpath\` must exclusively resolve to HVML \`file\` elements containing \`xlink:href\` attributes.`);
            }
            const mediaQueueObject = {
                mime: mimeType,
                path: this.getAttributeAnyNS(fileElement, 'xlink:href'),
            };
            if (/^image\/.*/i.test(mimeType)) {
                callback(mediaQueueObject);
            }
            else if (this.$.localMedia?.canPlayType(mimeType)) {
                callback(mediaQueueObject);
                break;
            }
            else {
                throw new RangeError(`this._handleMediaFileFromElements`);
            }
        }
    }
    queueMediaFromFileElements(xpath) {
        this._handleMediaFromFileElements(xpath, (mediaQueueObject) => {
            this.mediaQueue.push(mediaQueueObject);
        });
    }
    fetchMediaFromFileElements(xpath) {
        this._handleMediaFromFileElements(xpath, this.fetchMedia.bind(this));
    }
    _handleMediaFromMediaElement($mediaElement, callback) {
        if (this.hasAttributeAnyNS($mediaElement, 'xlink:href')) {
            const xpath = this._getXPathFromXPointerURI(this.getAttributeAnyNS($mediaElement, 'xlink:href'));
            callback(xpath);
        }
    }
    queueMediaFromMediaElement($mediaElement) {
        this._handleMediaFromMediaElement($mediaElement, this.queueMediaFromFileElements.bind(this));
    }
    fetchMediaFromMediaElement($mediaElement) {
        this._handleMediaFromMediaElement($mediaElement, this.fetchMediaFromFileElements.bind(this));
    }
    _handleMediaFromPlaylistItem($playlistItem, mediaCallback, choicePromptCallback) {
        const nodeName = $playlistItem.nodeName.toLowerCase();
        let $mediaElementsForChoicePrompt;
        if (!choicePromptCallback) {
            choicePromptCallback = mediaCallback;
        }
        switch (nodeName) {
            case 'media':
                mediaCallback($playlistItem);
                break;
            case 'choiceprompt':
                $mediaElementsForChoicePrompt = this.find('.//media', $playlistItem);
                for (let index = 0; index < $mediaElementsForChoicePrompt.snapshotLength; index++) {
                    const $mediaElement = $mediaElementsForChoicePrompt.snapshotItem(index);
                    choicePromptCallback($mediaElement);
                }
                break;
            default:
        }
    }
    queueMediaFromPlaylistItem($playlistItem) {
        this._handleMediaFromPlaylistItem($playlistItem, this.queueMediaFromMediaElement.bind(this));
    }
    fetchMediaFromPlaylistItem($playlistItem) {
        this._handleMediaFromPlaylistItem($playlistItem, this.fetchMediaFromMediaElement.bind(this));
    }
    populateDescription() {
        const descriptionResult = this.find('//description[1]');
        if (descriptionResult && descriptionResult.snapshotLength) {
            let $description = descriptionResult.snapshotItem(0);
            if (!this.$.description) {
                throw new ReferenceError(`populateDescription(): \`this.$.description\` not cached; make sure element with \`id="description"\` exists in template.`);
            }
            switch ($description.getAttribute('type')) {
                case 'xhtml':
                    let divResult = this.find('html:div[1]', $description);
                    if (divResult && divResult.snapshotLength) {
                        const $div = divResult.snapshotItem(0);
                        for (let index = 0; index < $div.children.length; index++) {
                            const $element = $div.children[index];
                            if ('_isJSONElement' in $element) {
                                const $p = document.createElement('p');
                                $p.textContent = $element.textContent;
                                this.$.description.appendChild($p);
                            }
                            else {
                                this.$.description.appendChild($element);
                            }
                        }
                    }
                    else {
                        console.error('Found HVML `description` with `type` attribute set to `xhtml`, but no HTML `div` child found.');
                    }
                    break;
                case 'text':
                default:
                    this.$.description.textContent = $description.textContent;
            }
        }
    }
    connectedCallback() {
        this.debug = this.hasAttribute('debug');
        if (this.debug) {
            this.log = console.log.bind(window.console);
        }
        else {
            this.log = function noop() { };
        }
        if (!this.classList.contains('redblue-video')) {
            this.classList.add('redblue-video');
        }
        this.setAttribute('role', 'application');
        const cachingStrategy = this.getAttribute('caching-strategy');
        switch (cachingStrategy) {
            case 'preload':
                this.cachingStrategy = RedBlueVideo.cachingStrategies.PRELOAD;
                break;
            case 'lazy':
            default:
                this.cachingStrategy = RedBlueVideo.cachingStrategies.LAZY;
        }
        let shadowRoot;
        if (!this.shadowRoot) {
            shadowRoot = this.attachShadow({
                mode: (this.debug ? "open" : "closed"),
            });
            shadowRoot.appendChild(document.importNode(this.$template.content, true));
        }
        else {
            shadowRoot = this.shadowRoot;
        }
        this.$$ = shadowRoot.querySelector.bind(shadowRoot);
        this.$$$ = shadowRoot.querySelectorAll.bind(shadowRoot);
        this.$id = shadowRoot.getElementById.bind(shadowRoot);
        if (this.hostDocument.isPlainHTML()) {
            this.querySelectorAll('[xml\\:id]').forEach(($lightDomChild) => {
                if (!$lightDomChild.id && $lightDomChild.hasAttribute('xml:id')) {
                    $lightDomChild.id = $lightDomChild.getAttribute('xml:id');
                }
            });
        }
        this.$.fullscreenButton = this.$id('fullscreen-button');
        if (this.$.fullscreenButton) {
            this.$.fullscreenButton.addEventListener('click', this.toggleFullscreen.bind(this));
        }
        this.$.fullscreenContext = this.$id('fullscreen-context');
        this.$.annotations = this.$id('annotations');
        this.$.style = this.$$('style');
        this.stylesheetRules = this.$.style.sheet.cssRules || this.$.style.sheet.rules;
        this.loadData();
        this.annotations = this.getAnnotations();
        this.log(`annotations - ${this._hvmlParser}`, this.annotations);
        this.resolveCSSNamespacePrefix().then((prefix) => {
            this._cssNamespacePrefix = prefix;
            this.log('this._cssNamespacePrefix', this._cssNamespacePrefix);
            this.setupAnimations();
        });
        this.createHotspots();
        this.timelineTriggers = this.getTimelineTriggers();
        this.$.embeddedMedia = this.$id(`embedded-media-${this.embedID}`);
        this.$.localMedia = this.$id(`local-media-${this.embedID}`);
        this.$.description = this.$id('description');
        this.populateDescription();
        this.$.currentChoice = this.$.annotations.children[0];
        try {
            const embedUri = this.getEmbedUri();
            if (this.YOUTUBE_DOMAIN_REGEX.test(embedUri)) {
                this.log('YouTube embed');
                this.embedParameters = `?${[
                    'rel=0',
                    'showinfo=0',
                    'start=517',
                    'end=527',
                    'enablejsapi=1',
                    'controls=1',
                    'modestbranding=1',
                    'playsinline=1',
                    'fs=0',
                    `origin=${encodeURIComponent(window.location.origin)}`,
                ].join('&amp;')}`;
                if (this.$.embeddedMedia) {
                    this.$.embeddedMedia.hidden = false;
                    this.$.embeddedMedia.src = embedUri + this.embedParameters;
                }
                this.setUpYouTubeIframeAPI();
            }
            else if (this.VIMEO_DOMAIN_REGEX.test(this.$.embeddedMedia?.src || '')) {
                this.log('vimeo');
            }
        }
        catch (error) {
            console.warn(error);
            try {
                const nonlinearPlaylist = this.getNonlinearPlaylist();
                let nonlinearPlaylistChildren = ((Array.isArray(nonlinearPlaylist.childNodes) ? nonlinearPlaylist.childNodes : Array.from(nonlinearPlaylist.childNodes))
                    .filter((childNode) => childNode.nodeType === Node.ELEMENT_NODE));
                if (this.$.localMedia) {
                    this.$.localMedia.hidden = false;
                }
                this._isNonlinear = !!nonlinearPlaylist;
                this._registerChoiceEvents();
                switch (this.cachingStrategy) {
                    case RedBlueVideo.cachingStrategies.PRELOAD:
                        nonlinearPlaylistChildren.forEach(($playlistItem) => this.fetchMediaFromPlaylistItem($playlistItem));
                        break;
                    default:
                }
                for (let index = 0; index < nonlinearPlaylistChildren.length; index++) {
                    const $playlistItem = nonlinearPlaylistChildren[index];
                    this._handleMediaFromPlaylistItem($playlistItem, ($mediaElement) => {
                        if (this.cachingStrategy === RedBlueVideo.cachingStrategies.LAZY) {
                            this.fetchMediaFromMediaElement($mediaElement);
                        }
                        this.queueMediaFromMediaElement($mediaElement);
                    }, ($mediaElement) => {
                        if (this.cachingStrategy === RedBlueVideo.cachingStrategies.LAZY) {
                            this.fetchMediaFromMediaElement($mediaElement);
                        }
                        this.queueMediaFromMediaElement($mediaElement);
                        index = nonlinearPlaylistChildren.length;
                    });
                }
                this.log('this.mediaQueue', this.mediaQueue);
            }
            catch (playlistError) {
                console.warn(playlistError);
            }
        }
    }
    toggleFullscreen() {
        if (document.fullscreenElement) {
            document.exitFullscreen();
        }
        else if (document.webkitFullscreenElement) {
            document.webkitExitFullscreen();
        }
        else if (document.mozFullScreenElement) {
            document.mozCancelFullScreen();
        }
        else if ('requestFullscreen' in this.$.fullscreenContext) {
            this.$.fullscreenContext.requestFullscreen();
        }
        else if ('webkitRequestFullscreen' in this.$.fullscreenContext) {
            this.$.fullscreenContext.webkitRequestFullscreen();
        }
        else if ('mozRequestFullScreen' in this.$.fullscreenContext) {
            this.$.fullscreenContext.mozRequestFullScreen();
        }
    }
    async resolveCSSNamespacePrefix() {
        switch (this._hvmlParser) {
            case 'xml':
                if (!this.hasXMLParser) {
                    throw new ReferenceError(this.MISSING_XML_PARSER_ERROR);
                }
                return this.resolveCSSNamespacePrefixFromXML();
            case 'json-ld':
                if (!this.hasJSONLDParser) {
                    throw new ReferenceError(this.MISSING_JSONLD_PARSER_ERROR);
                }
                return this.resolveCSSNamespacePrefixFromJSONLD();
            default:
                throw new ReferenceError(this.MISSING_HVML_PARSER_ERROR);
        }
    }
    applyAnnotationStyles(loopObject = this.annotations, parentIndex) {
        const stylesheet = this.$.style.sheet;
        for (let annotationIndex = 0; annotationIndex < loopObject.length; annotationIndex++) {
            const annotation = loopObject[annotationIndex];
            if ('type' in annotation && annotation.type === 'choicePrompt') {
                this.applyAnnotationStyles(annotation.choices, annotationIndex);
            }
            else {
                const animation = loopObject[annotationIndex].goto?.animate;
                if (animation) {
                    const animationLength = (animation.length || 1);
                    for (let animateIndex = 0; animateIndex < animationLength; animateIndex++) {
                        const animate = animation[animateIndex];
                        if (animateIndex === 0) {
                            let styleProperties = '';
                            let compoundIndex = String(annotationIndex);
                            let attribute;
                            for (attribute in annotation.goto) {
                                switch (attribute) {
                                    case 'height':
                                    case 'width':
                                    case 'top':
                                    case 'right':
                                    case 'bottom':
                                    case 'left':
                                        styleProperties += `${attribute}: ${annotation.goto[attribute]};\n`;
                                        break;
                                    default: {
                                        const cssAttributeRegex = new RegExp(`^${this._cssNamespacePrefix}:([^=]+)`, 'i');
                                        const cssAttribute = attribute.match(cssAttributeRegex);
                                        if (cssAttribute) {
                                            styleProperties += `${cssAttribute[1]}: ${annotation.goto[attribute]};`;
                                        }
                                    }
                                }
                            }
                            if (typeof parentIndex !== 'undefined') {
                                compoundIndex = `${parentIndex}-${annotationIndex}`;
                            }
                            const rule = `
              .redblue-annotations__link.redblue-annotations__link--${compoundIndex} {
                ${styleProperties}
                ${animate ? `transition: ${animate.endTime - animate.startTime}s bottom linear;` : ''}
              }`;
                            stylesheet.insertRule(rule, (this.stylesheetRules.length));
                            if (animate) {
                                stylesheet.insertRule(`
                  .redblue-annotations__link.redblue-annotations__link--${compoundIndex}-start {
                    left: ${animate.startX};
                    bottom: ${animate.startY};
                  }`, (this.stylesheetRules.length));
                                stylesheet.insertRule(`
                  .redblue-annotations__link.redblue-annotations__link--${compoundIndex}-animate-${animateIndex}-end {
                    left: ${animate.startX};
                    bottom: ${animate.endY};
                  }`, (this.stylesheetRules.length));
                            }
                        }
                    }
                }
            }
        }
    }
    setupAnimations() {
        if (!this.annotations || !this.annotations.length) {
            return false;
        }
        this.applyAnnotationStyles();
        return true;
    }
    parseHTML(string) {
        return document.createRange().createContextualFragment(string);
    }
    initializeYoutubePlayer() {
        this.player.YT = new window.YT.Player(this.$.embeddedMedia, {
            events: {
                onReady: this.onPlayerReady.bind(this),
                onStateChange: this.onStateChange.bind(this),
            },
        });
        document.addEventListener('keydown', (event) => {
            switch (event.key) {
                case 'm':
                    this.log(this.player.YT.getCurrentTime());
                    break;
                default:
            }
        });
    }
    setUpYouTubeIframeAPI() {
        if (!('onYouTubeIframeAPIReady' in window)) {
            const $youtubeAPIScript = document.createElement('script');
            $youtubeAPIScript.id = 'youtube-iframe-api';
            $youtubeAPIScript.src = '//www.youtube.com/iframe_api';
            $youtubeAPIScript.async = true;
            let $referenceNode;
            const $firstScriptTag = document.getElementsByTagName('script')[0];
            if ($firstScriptTag) {
                $referenceNode = $firstScriptTag;
            }
            else {
                $referenceNode = document.getElementsByTagName('head')[0];
            }
            $referenceNode.parentNode.insertBefore($youtubeAPIScript, $referenceNode);
            window.onYouTubeIframeAPIReady = () => {
                this.initializeYoutubePlayer();
            };
        }
        else {
            if (this.debug) {
                var time = (new Date()).getTime();
                var counter = 0;
            }
            const interval = setInterval(() => {
                if (('YT' in window) && window.YT.Player) {
                    clearInterval(interval);
                    this.initializeYoutubePlayer();
                    this.log(`YouTube Iframe API found after ${counter} tries in ${(new Date()).getTime() - time} seconds`);
                }
                if (this.debug) {
                    counter++;
                }
            }, 0);
            setTimeout(() => {
                clearInterval(interval);
                if (this.debug) {
                    console.error(`Couldn’t find YouTube Iframe API after ${counter} tries in ${(new Date()).getTime() - time} seconds'`);
                }
                else {
                    console.error(`Couldn’t find YouTube Iframe API`);
                }
            }, (1000 * 60 * 2.5));
        }
    }
    onPlayerReady() {
        this.log('ready');
        this.$.embeddedMedia.style.borderColor = '#FF6D00';
        this.player.YT?.mute();
    }
    onStateChange() {
        this.log('statechange');
        requestAnimationFrame(this.updateUIOnYoutubePlayback.bind(this));
    }
    addLeadingZeroes(number) {
        return number.toString().padStart(2, '0');
    }
    updateUIOnYoutubePlayback() {
        if (this.player.YT) {
            const time = this.player.YT.getCurrentTime();
            const state = this.player.YT.getPlayerState();
            switch (state) {
                case window.YT.PlayerState.PLAYING:
                    for (let key in this.timelineTriggers) {
                        const startTime = parseFloat(key);
                        const trigger = this.timelineTriggers[startTime];
                        const { endTime } = trigger;
                        let totalAnimations = this.annotations[trigger.annotationIndex].goto?.animate.length || 0;
                        if ((time >= startTime) && (time <= endTime) && !trigger.$ui.classList.contains(trigger.endClass)) {
                            this.log('---------');
                            const drift = Math.abs(time - startTime);
                            if (trigger.animateIndex == 0) {
                                trigger.$ui.classList.remove(trigger.startClass);
                            }
                            else if (trigger.previousEndClass) {
                                trigger.$ui.classList.remove(trigger.previousEndClass);
                            }
                            trigger.$ui.classList.add(trigger.endClass);
                            this.log(`Starting annotation #${trigger.annotationIndex}, transition #${trigger.animateIndex} at: `, time);
                            this.log('Should be: ', startTime);
                            this.log('Drift: ', drift);
                            if (trigger.animateIndex == (totalAnimations - 1)) {
                                const transitionDuration = parseFloat(getComputedStyle(trigger.$ui).getPropertyValue('transition-duration').slice(0, -1));
                                this.log('---------');
                                this.log('No more animations');
                                this.log('this.annotations', this.annotations);
                                setTimeout(() => {
                                    this.log('timeout');
                                    while (totalAnimations--) {
                                        trigger.$ui.classList.remove(trigger.endClass.replace(/animate-[0-9]+-/, `animate-${totalAnimations}-`));
                                    }
                                    trigger.$ui.classList.add(trigger.startClass);
                                }, transitionDuration * 1000);
                            }
                        }
                    }
                    break;
                case window.YT.PlayerState.PAUSED:
                    break;
                default:
            }
        }
        requestAnimationFrame(this.updateUIOnYoutubePlayback.bind(this));
    }
    loadData() {
        for (let i = 0; i < this.children.length; i++) {
            const child = this.children[i];
            switch (child.nodeName.toLowerCase()) {
                case 'hvml':
                    this.hvml.xml = child;
                    this._hvmlParser = 'xml';
                    return;
                case 'script':
                    if (child.hasAttribute('type') && (child.type === 'application/ld+json')) {
                        this.hvml.jsonLD = JSON.parse(child.textContent || '{}');
                        this._hvmlParser = 'json-ld';
                        return;
                    }
                    throw new TypeError('<script> elements must contain JSON-LD data. If this is what you have, please set the `type` attribute to "application/ld+json"` to make this explicit.');
                default:
                    throw new TypeError(`HVML annotations must be provided as either \`<hvml>\` or \`<script>\` tags.`);
            }
        }
        throw new ReferenceError(`HVML annotations must be provided as as immediate children of the \`<${RedBlueVideo.is}>\` tag.`);
    }
    getEmbedUri() {
        const youtubeUrlFindResult = this.find(`.//showing[@scope="release"]/venue[@type="site"]/uri[contains(., '//www.youtube.com/watch?v=')]/text()`);
        if (youtubeUrlFindResult && youtubeUrlFindResult.snapshotLength) {
            const youtubeUrl = youtubeUrlFindResult.snapshotItem(0);
            return youtubeUrl.textContent.replace(this.YOUTUBE_VIDEO_REGEX, `//www.youtube.com/embed/$1${this.embedParameters || ''}`);
        }
        throw new Error('No Embed URL found');
    }
    getNonlinearPlaylist() {
        const nonlinearPlaylistResult = this.find(`.//presentation/playlist[@type="nonlinear"]`);
        if (nonlinearPlaylistResult && nonlinearPlaylistResult.snapshotLength) {
            const nonlinearPlaylist = nonlinearPlaylistResult.snapshotItem(0);
            return nonlinearPlaylist;
        }
        throw new Error('No nonlinear playlists found');
    }
    createHotspots() {
        if (!this.annotations || !this.annotations.length) {
            return false;
        }
        for (let i = 0; i < this.annotations.length; i++) {
            const annotation = this.annotations[i];
            this.createHotspot(annotation, i);
        }
        return true;
    }
    createHotspot(annotation, index, $target = this.$.annotations) {
        let $annotation;
        let backgroundMedia = null;
        const stylesheet = this.$.style.sheet;
        let id;
        this.log(annotation);
        if (annotation['xml:id']) {
            id = annotation['xml:id'];
        }
        else if (annotation.id) {
            id = annotation.id;
        }
        else {
            id = `annotation-${index}`;
        }
        switch (annotation.type) {
            case 'choicePrompt':
                if (annotation.media) {
                    backgroundMedia = this.find(this._getXPathFromXPointerURI(annotation.media['xlink:href']));
                }
                stylesheet.insertRule(`
          .redblue-annotations__choices {
            color: white;
            background-color: black;
            background-size: contain;
            z-index: 1;
            position: absolute;
            width: 100%;
            height: 100%;
          }
        `, this.stylesheetRules.length);
                if (backgroundMedia) {
                    for (let i = 0; i < backgroundMedia.snapshotLength; i++) {
                        const $fileElement = backgroundMedia.snapshotItem(i);
                        if ($fileElement) {
                            stylesheet.insertRule(`
                .redblue-annotations__choices.redblue-annotations__choices--${index} {
                  background-image: url( '${this.getAttributeAnyNS($fileElement, 'xlink:href')}' );
                }
              `, this.stylesheetRules.length);
                        }
                    }
                }
                $annotation = this.parseHTML(`<div
            id="annotation-${index}"
            class="redblue-annotations__choices redblue-annotations__choices--${index} redblue-annotations__choices--${index}-start"
            hidden="hidden"
            >
            <h2 class="redblue-prompt">${annotation.name}</h2>
          </div>`);
                $target.appendChild($annotation);
                if (annotation.choices) {
                    for (let i = 0; i < annotation.choices.length; i++) {
                        const choice = annotation.choices[i];
                        const $choiceTarget = this.$id(`annotation-${index}`);
                        if (!$choiceTarget) {
                            throw new ReferenceError(`Could not create hotspot for Annotation #${index}, Choice #${i}. Unable to find DOM element with ID \`annotation-${index}\``);
                        }
                        this.createHotspot(choice, `${index}-${i}`, $choiceTarget);
                    }
                }
                break;
            case 'choice':
                $annotation = this.parseHTML(`<a
            id="${id}"
            data-index="${index}"
            class="redblue-annotations__link redblue-annotations__link--${index} redblue-annotations__link--${index}-start"
            href="${annotation.goto['xlink:href']}"
            target="_blank"
            >
              <span>${annotation.name}</span>
          </a>`);
                $target.appendChild($annotation);
                break;
            default:
                throw new TypeError(`Cannot create hotspot. Invalid annotation type \`${annotation.type}\`.`);
        }
    }
    mapAttributeToKeyValuePair(attribute) {
        const object = {};
        const camelCaseAttribute = RedBlueVideo.reCamelCase(attribute.nodeName);
        object[camelCaseAttribute] = attribute.nodeValue;
        return object;
    }
    flattenKeyValuePairs(accumulator, keyValuePair) {
        const key = Object.keys(keyValuePair)[0];
        const value = keyValuePair[key];
        accumulator[key] = value;
        return accumulator;
    }
    nodeAttributesToJSON(attributes) {
        return (Array.from(attributes)
            .map(this.mapAttributeToKeyValuePair)
            .reduce(this.flattenKeyValuePairs, {}));
    }
    getAnnotations() {
        switch (this._hvmlParser) {
            case 'xml':
                if (!this.hasXMLParser) {
                    throw new ReferenceError(this.MISSING_XML_PARSER_ERROR);
                }
                return this.getAnnotationsFromXML();
            case 'json-ld':
                if (!this.hasJSONLDParser) {
                    throw new ReferenceError(this.MISSING_JSONLD_PARSER_ERROR);
                }
                return this.getAnnotationsFromJSONLD();
            default:
                throw new TypeError(`Invalid or uninitialized HVML parser. Expected one of “xml” or “json-ld”; got “${this._hvmlParser}”`);
        }
    }
    getTimelineTriggers() {
        if (!this.annotations || !this.annotations.length) {
            return {};
        }
        const triggers = {};
        for (let annotationIndex = 0; annotationIndex < this.annotations.length; annotationIndex++) {
            const annotation = this.annotations[annotationIndex];
            if (annotation.goto && annotation.goto.animate) {
                for (let animateIndex = 0, totalAnimations = annotation.goto.animate.length; animateIndex < totalAnimations; animateIndex++) {
                    const animate = annotation.goto.animate[animateIndex];
                    const uiQuery = `#annotations [data-index="${annotationIndex}"]`;
                    const $ui = this.$$(uiQuery);
                    if (!$ui) {
                        throw new ReferenceError(`Could not process Annotation #${annotationIndex}, Animation #${animateIndex}. Unable to find DOM element with query \`${uiQuery}\`.`);
                    }
                    triggers[animate.startTime] = {
                        ...animate,
                        annotationIndex,
                        animateIndex,
                        name: annotation.name,
                        $ui,
                        startClass: `redblue-annotations__link--${annotationIndex}-start`,
                        endClass: `redblue-annotations__link--${annotationIndex}-animate-${animateIndex}-end`,
                    };
                    if (animateIndex > 0) {
                        triggers[animate.startTime].previousEndClass = `redblue-annotations__link--animate-${animateIndex - 1}-end`;
                    }
                }
            }
        }
        return triggers;
    }
    find(query, contextNode) {
        switch (this._hvmlParser) {
            case 'xml':
                if (!this.hasXMLParser) {
                    throw new ReferenceError(this.MISSING_XML_PARSER_ERROR);
                }
                return this.findInXML(query, contextNode);
            case 'json-ld':
                if (!this.hasJSONLDParser) {
                    throw new ReferenceError(this.MISSING_JSONLD_PARSER_ERROR);
                }
                return this.findInJSONLD(query);
            default:
                throw new ReferenceError(this.MISSING_HVML_PARSER_ERROR);
        }
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVkYmx1ZS12aWRlby5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9yZWRibHVlLXZpZGVvLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUNBLFlBQVksQ0FBQztBQWtFYixNQUFNLENBQU4sSUFBWSxpQkFHWDtBQUhELFdBQVksaUJBQWlCO0lBQzNCLHlEQUFRLENBQUE7SUFDUiwrREFBVyxDQUFBO0FBQ2IsQ0FBQyxFQUhXLGlCQUFpQixLQUFqQixpQkFBaUIsUUFHNUI7QUFFRCxJQUFLLGNBR0o7QUFIRCxXQUFLLGNBQWM7SUFDakIsbUNBQW1CLENBQUE7SUFDbkIscUNBQXFCLENBQUE7QUFDdkIsQ0FBQyxFQUhJLGNBQWMsS0FBZCxjQUFjLFFBR2xCO0FBcUhELE1BQU0sQ0FBQyxPQUFPLE9BQU8sWUFBYSxTQUFRLFdBQVc7SUF3Sm5ELE1BQU0sS0FBSyxFQUFFO1FBQ1gsT0FBTyxlQUFlLENBQUM7SUFDekIsQ0FBQztJQUtELE1BQU0sS0FBSyxRQUFRO1FBQ2pCLE9BQU87c0JBQ1csWUFBWSxDQUFDLEVBQUU7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztLQTBGaEMsQ0FBQztJQUNKLENBQUM7SUFLRCxNQUFNLEtBQUssRUFBRTtRQUNYLE9BQU87WUFDTCxJQUFJLEVBQUUsK0JBQStCO1lBQ3JDLElBQUksRUFBRSwrQkFBK0I7WUFDckMsSUFBSSxFQUFFLDhCQUE4QjtZQUNwQyxLQUFLLEVBQUUsOEJBQThCO1lBQ3JDLEdBQUcsRUFBRSw0QkFBNEI7WUFDakMsR0FBRyxFQUFFLHNDQUFzQztTQUM1QyxDQUFDO0lBQ0osQ0FBQztJQUtELE1BQU0sS0FBSyxpQkFBaUI7UUFDMUIsT0FBTztZQUVMLElBQUksRUFBRSxDQUFDO1lBRVAsT0FBTyxFQUFFLENBQUM7U0FDWCxDQUFDO0lBQ0osQ0FBQztJQVFELE1BQU0s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