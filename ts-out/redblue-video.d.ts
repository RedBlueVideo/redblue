/// <reference types="youtube" />
import { JSONXPathResult, JSONElement } from "./parser-json-ld.js";
import { MSE } from "./player-mse.js";
declare global {
    interface Window {
        WebKitMediaSource: any;
        onYouTubeIframeAPIReady?(): void;
    }
    interface Document {
        mozCancelFullScreen: () => void;
        webkitExitFullscreen: () => void;
        fullscreenElement?: () => void;
        mozFullScreenElement?: () => void;
        webkitFullscreenElement?: () => void;
    }
    interface HTMLElement {
        mozRequestFullScreen?: () => void;
        webkitRequestFullscreen?: () => void;
    }
}
export type MediaQueueObject = {
    mime: string;
    path: string;
};
type MediaElementCallback = ($mediaElement: $Element) => void;
type MediaQueueObjectCallback = (mediaQueueObject: MediaQueueObject) => void;
type $ChoiceLink = HTMLAnchorElement;
export type $HTMLorXMLElement = HTMLElement | Element;
export type $Element = $HTMLorXMLElement | JSONElement;
export interface HTMLXPathResult extends XPathResult {
    readonly singleNodeValue: $HTMLorXMLElement | null;
    iterateNext(): $HTMLorXMLElement | null;
    snapshotItem(index: number): $HTMLorXMLElement | null;
}
type HVMLSerialization = 'xml' | 'json-ld';
export declare enum CachingStrategies {
    LAZY = 0,
    PRELOAD = 1
}
declare enum MediaFileTypes {
    "mp4" = "video/mp4",
    "webm" = "video/webm"
}
type MediaFileExtensions = keyof typeof MediaFileTypes;
type MediaFileMediaTypes = `${MediaFileTypes}`;
export interface Animation {
    startTime: number;
    endTime: number;
    startX: string;
    startY: string;
    endX: string;
    endY: string;
}
export interface Goto extends Record<string, any> {
    on: 'durationStart' | 'duration' | 'durationEnd';
    'xlink:actuate': 'onLoad' | 'onRequest' | 'other' | 'none';
    'xlink:href': string;
    width: string;
    height: string;
    timeline: 'replace' | 'restart';
    animate: Animation[];
}
export interface Media {
    'xlink:href': string;
}
export interface Annotation {
    'xml:id'?: string;
    choices?: Choice[];
    goto?: Goto;
    id?: string;
    media?: Media;
    name: Element['textContent'];
    type?: 'choicePrompt' | 'choice';
}
export interface RenderedAnnotation extends Annotation {
    $ui: HTMLElement;
    animateIndex: number;
    annotationIndex: number;
    endClass: string;
    endTime: number;
    previousEndClass?: string;
    startClass: string;
}
export interface ChoicePrompt extends Annotation {
    type: 'choicePrompt';
}
export interface Choice extends Annotation {
    goto: Goto;
    type: 'choice';
}
interface SpecficDocumentFragment extends DocumentFragment {
    getElementById<ElementType extends HTMLElement = HTMLElement>(elementId: string): ElementType | null;
}
export type TimelineTriggers = Record<number, RenderedAnnotation>;
export default class RedBlueVideo extends HTMLElement {
    DEBUG_BUFFER_TYPE: string;
    DEBUG_MEDIA: MediaFileExtensions;
    DEBUG_MIME_TYPE: MediaFileMediaTypes;
    MISSING_HVML_PARSER_ERROR: string;
    MISSING_JSONLD_PARSER_ERROR: string;
    MISSING_XML_PARSER_ERROR: string;
    POLLING_INTERVAL: number;
    VIMEO_DOMAIN_REGEX: RegExp;
    VIMEO_VIDEO_REGEX: RegExp;
    YOUTUBE_DOMAIN_REGEX: RegExp;
    YOUTUBE_VIDEO_REGEX: RegExp;
    _cssNamespacePrefix?: string;
    _hvmlParser?: HVMLSerialization;
    _isNonlinear: boolean;
    $: {
        annotations: HTMLElement;
        currentChoice: HTMLElement | null;
        description: HTMLElement;
        embeddedMedia: HTMLIFrameElement;
        fullscreenButton: HTMLButtonElement;
        fullscreenContext: HTMLElement;
        localMedia: HTMLVideoElement;
        style: HTMLStyleElement;
    };
    $$: ParentNode['querySelector'];
    $$$: ParentNode['querySelectorAll'];
    $id: SpecficDocumentFragment['getElementById'];
    $template: HTMLTemplateElement;
    annotations: Annotation[];
    bufferTypes: Record<MediaFileExtensions, string>;
    cachingStrategy: CachingStrategies;
    currentChoiceAnnotationIndex: number;
    debug: boolean;
    duration: number;
    embedID: number;
    embedParameters?: string;
    Events: {
        presentChoice: (event: any) => void;
        choiceClicked: (event: MouseEvent) => void;
    };
    findInJSONLD?(xpathExpression: string, contextNode?: Record<string, any>, namespaceResolver?: Record<string, string> | null, resultType?: number, result?: any): JSONXPathResult;
    findInXML?(xpathExpression: string, $contextNode?: $Element): XPathResult;
    firstChoiceSelected: boolean;
    firstSegmentAppended: boolean;
    getAnnotationsFromJSONLD?(): Annotation[];
    getAnnotationsFromXML?(xpath?: string, contextNode?: $Element): Annotation[];
    hvml: {
        xml: $Element | null;
        jsonLD: Record<string, any> | null;
    };
    lastSegmentAppended: boolean;
    log: (...args: any[]) => void;
    mediaQueue: MediaQueueObject[];
    mimeTypes: Record<MediaFileExtensions, MediaFileMediaTypes>;
    MSE?: MSE;
    player: {
        YT?: YT.Player;
    };
    resolveCSSNamespacePrefixFromJSONLD?(defaultPrefix?: string): Promise<string>;
    resolveCSSNamespacePrefixFromXML?(defaultPrefix?: string): Promise<string>;
    stylesheetRules: CSSRuleList;
    timelineTriggers: TimelineTriggers;
    XHR: {
        GET: (url: string, type: string, callback: (binary: Uint8Array, type: string) => void) => void;
    };
    static get is(): string;
    static get template(): string;
    static get NS(): Record<string, string>;
    static get cachingStrategies(): {
        LAZY: number;
        PRELOAD: number;
    };
    static reCamelCase(nodeName: string): string;
    static MSEsupported(): boolean;
    get HVML_SOLO_ELEMENTS(): string[];
    get hasXMLParser(): boolean;
    get hasJSONLDParser(): boolean;
    get hasMSEPlayer(): boolean;
    get hostDocument(): {
        isPlainHTML: () => boolean;
        isXHTML: () => boolean;
    };
    getNonlinearPlaylistTargetIDfromChoiceLink($choiceLink: $ChoiceLink | {
        'href': string;
    }): string;
    getNonlinearPlaylistTargetIDfromGoto($goto: $Element): string;
    getNonlinearPlaylistItemFromTargetID(id: string): Element;
    getNonlinearPlaylistItemFromChoiceLink($choiceLink: $ChoiceLink): Element;
    queueNonlinearPlaylistItemsFromChoiceLink($choiceLink: $ChoiceLink): void;
    handleChoice($clicked: $ChoiceLink): void;
    _registerChoiceEvents(): void;
    constructor();
    isNonlinear(): boolean;
    hasAttributeAnyNS($element: $Element, attribute: string): boolean;
    getAttributeAnyNS($element: $Element, attribute: string): string | null;
    _getXPathFromXPointerURI(uri: string): string;
    getMimeTypeFromFileElement($fileElement: $Element): string;
    fetchMedia(mediaQueueObject: MediaQueueObject): void;
    _handleMediaFromFileElements(xpath: string, callback: MediaQueueObjectCallback): void;
    queueMediaFromFileElements(xpath: string): void;
    fetchMediaFromFileElements(xpath: string): void;
    _handleMediaFromMediaElement($mediaElement: $Element, callback: (xpath: string) => void): void;
    queueMediaFromMediaElement($mediaElement: $Element): void;
    fetchMediaFromMediaElement($mediaElement: $Element): void;
    _handleMediaFromPlaylistItem($playlistItem: $Element, mediaCallback: MediaElementCallback, choicePromptCallback?: MediaElementCallback): void;
    queueMediaFromPlaylistItem($playlistItem: $Element): void;
    fetchMediaFromPlaylistItem($playlistItem: $Element): void;
    populateDescription(): void;
    connectedCallback(): void;
    toggleFullscreen(): void;
    resolveCSSNamespacePrefix(): Promise<string>;
    applyAnnotationStyles(loopObject?: Annotation[], parentIndex?: number): void;
    setupAnimations(): boolean;
    parseHTML(string: string): DocumentFragment;
    initializeYoutubePlayer(): void;
    setUpYouTubeIframeAPI(): void;
    onPlayerReady(): void;
    onStateChange(): void;
    addLeadingZeroes(number: number): string;
    updateUIOnYoutubePlayback(): void;
    loadData(): void;
    getEmbedUri(): string;
    getNonlinearPlaylist(): Element | JSONElement;
    createHotspots(): boolean;
    createHotspot(annotation: Annotation, index: number | string, $target?: HTMLElement): void;
    mapAttributeToKeyValuePair(attribute: Attr): Record<string, string | null>;
    flattenKeyValuePairs(accumulator: Record<string, string | null>, keyValuePair: Record<string, string | null>): Record<string, string | null>;
    nodeAttributesToJSON<Cast extends Record<string, any>>(attributes: NamedNodeMap): Cast;
    getAnnotations(): Annotation[];
    getTimelineTriggers(): TimelineTriggers;
    find(query: string, contextNode?: $Element): HTMLXPathResult | JSONXPathResult;
}
export {};
//# sourceMappingURL=redblue-video.d.ts.map