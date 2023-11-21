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
            "hvml": "https://hypervideo.tech/hvml#",
            "ovml": "http://vocab.nospoon.tv/ovml#",
            "html": "http://www.w3.org/1999/xhtml",
            "xlink": "http://www.w3.org/1999/xlink",
            "css": "https://www.w3.org/TR/CSS/",
            "xml": "http://www.w3.org/XML/1998/namespace",
        };
    }
    static get cachingStrategies() {
        return {
            "LAZY": 0,
            "PRELOAD": 1,
        };
    }
    static reCamelCase(nodeName) {
        const map = {
            "endtime": "endTime",
            "endx": "endX",
            "endy": "endY",
            "starttime": "startTime",
            "startx": "startX",
            "starty": "startY",
            "choiceprompt": "choicePrompt",
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
            "isPlainHTML": () => body === 'BODY',
            "isXHTML": () => body === 'body',
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
    _initChoiceEvents() {
        this.Events = {
            "presentChoice": (event) => {
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
            "choiceClicked": (event) => {
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
    }
    _registerChoiceEvents() {
        if (this.isNonlinear()) {
            this.$.localMedia?.addEventListener('timeupdate', this.Events.presentChoice, false);
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
            'webm': 'video/webm; codecs="vorbis,vp8"',
            'mp4': 'video/mp4; codecs="avc1.42E01E,mp4a.40.2"',
        };
        this.mimeTypes = {
            'webm': 'video/webm',
            'mp4': 'video/mp4',
        };
        this.DEBUG_MEDIA = 'webm';
        this.DEBUG_BUFFER_TYPE = this.bufferTypes[this.DEBUG_MEDIA];
        this.DEBUG_MIME_TYPE = this.mimeTypes[this.DEBUG_MEDIA];
        this.POLLING_INTERVAL = 16.66666666667;
        this.duration = 0;
        this.$ = {};
        this.firstChoiceSelected = false;
        this.firstSegmentAppended = false;
        this.lastSegmentAppended = false;
        this.XHR = {
            "GET": (url, type, callback) => {
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
            }
        };
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
            "method": "GET",
            "cache": "force-cache",
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
                "mime": mimeType,
                "path": this.getAttributeAnyNS(fileElement, 'xlink:href'),
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
        this.setAttribute('class', 'redblue-video');
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
        this.debug = this.hasAttribute('debug');
        if (this.debug) {
            this.log = console.log.bind(window.console);
        }
        else {
            this.log = function noop() { };
        }
        let shadowRoot;
        if (!this.shadowRoot) {
            shadowRoot = this.attachShadow({
                "mode": (this.debug ? "open" : "closed"),
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
        this.currentChoiceAnnotationIndex = 0;
        this.$.currentChoice = this.$.annotations.children[0];
        try {
            const embedUri = this.getEmbedUri();
            if (this.YOUTUBE_DOMAIN_REGEX.test(embedUri)) {
                this.log('youtube');
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
                this._initChoiceEvents();
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
        this.player = new window.YT.Player(this.$.embeddedMedia, {
            "events": {
                "onReady": this.onPlayerReady.bind(this),
                "onStateChange": this.onStateChange.bind(this),
            },
        });
        document.addEventListener('keydown', (event) => {
            switch (event.key) {
                case 'm':
                    this.log(this.player.getCurrentTime());
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
        this.player.mute();
    }
    onStateChange() {
        this.log('statechange');
        requestAnimationFrame(this.updateUIOnYoutubePlayback.bind(this));
    }
    addLeadingZeroes(number) {
        return number.toString().padStart(2, '0');
    }
    updateUIOnYoutubePlayback() {
        if (this.player && this.player.getCurrentTime) {
            const time = this.player.getCurrentTime();
            const state = this.player.getPlayerState();
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
            }
        }
        this.log('No <hvml> or <script> elements found.');
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
        console.log(annotation);
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
                    throw this.MISSING_XML_PARSER_ERROR;
                }
                return this.getAnnotationsFromXML();
            case 'json-ld':
                if (!this.hasJSONLDParser) {
                    throw this.MISSING_JSONLD_PARSER_ERROR;
                }
                return this.getAnnotationsFromJSONLD();
            default:
                throw new TypeError(`Invalid or uninitialized HVML parser. Expected one of “xml” or “json-ld”; got “${this._hvmlParser}”`);
        }
    }
    getTimelineTriggers() {
        if (!this.annotations) {
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
                        "name": annotation.name,
                        $ui,
                        "startClass": `redblue-annotations__link--${annotationIndex}-start`,
                        "endClass": `redblue-annotations__link--${annotationIndex}-animate-${animateIndex}-end`,
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
;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVkYmx1ZS12aWRlby5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9yZWRibHVlLXZpZGVvLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUNBLFlBQVksQ0FBQztBQXlFYixNQUFNLENBQU4sSUFBWSxpQkFHWDtBQUhELFdBQVksaUJBQWlCO0lBQzNCLHlEQUFRLENBQUE7SUFDUiwrREFBVyxDQUFBO0FBQ2IsQ0FBQyxFQUhXLGlCQUFpQixLQUFqQixpQkFBaUIsUUFHNUI7QUFFRCxJQUFLLGNBR0o7QUFIRCxXQUFLLGNBQWM7SUFDakIsbUNBQW1CLENBQUE7SUFDbkIscUNBQXFCLENBQUE7QUFDdkIsQ0FBQyxFQUhJLGNBQWMsS0FBZCxjQUFjLFFBR2xCO0FBcUhELE1BQU0sQ0FBQyxPQUFPLE9BQU8sWUFBYSxTQUFRLFdBQVc7SUErSG5ELE1BQU0sS0FBSyxFQUFFO1FBQ1gsT0FBTyxlQUFlLENBQUM7SUFDekIsQ0FBQztJQUtELE1BQU0sS0FBSyxRQUFRO1FBQ2pCLE9BQU87c0JBQ1csWUFBWSxDQUFDLEVBQUU7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztLQTBGaEMsQ0FBQztJQUNKLENBQUM7SUFLRCxNQUFNLEtBQUssRUFBRTtRQUNYLE9BQU87WUFDTCxNQUFNLEVBQUUsK0JBQStCO1lBQ3ZDLE1BQU0sRUFBRSwrQkFBK0I7WUFDdkMsTUFBTSxFQUFFLDhCQUE4QjtZQUN0QyxPQUFPLEVBQUUsOEJBQThCO1lBQ3ZDLEtBQUssRUFBRSw0QkFBNEI7WUFDbkMsS0FBSyxFQUFFLHNDQUFzQztTQUM5QyxDQUFDO0lBQ0osQ0FBQztJQUtELE1BQU0sS0FBSyxpQkFBaUI7UUFDMUIsT0FBTztZQUVMLE1BQU0sRUFBRSxDQUFDO1lBRVQsU0FBUyxFQUFFLENBQUM7U0FDYixDQUFDO0lBQ0osQ0FBQztJQVFELE1BQU0s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