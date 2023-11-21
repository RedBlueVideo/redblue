/// <reference types="youtube" />
import RedBlueOmniParser from "./parser-omni.js";
import { MediaQueueObject } from "./redblue-video.js";
declare const _RedBlueLegacyPlayer: (RedBlueVideo: typeof RedBlueOmniParser) => {
    new (): {
        Legacy: {
            init: () => void;
        };
        connectedCallback(): void;
        readonly hasLegacyPlayer: boolean;
        fetchMedia(mediaQueueObject: MediaQueueObject): void;
        MISSING_JSONLD_CONTEXT_ERROR: string;
        readonly hasJSONLDParser: boolean;
        resolveCSSNamespacePrefixFromJSONLD: ((defaultPrefix?: string) => Promise<string>) & ((defaultPrefix?: string | undefined) => Promise<string>);
        getAnnotationsFromJSONLD: (() => any[]) & (() => import("./redblue-video.js").Annotation[]);
        findInJSONLD: ((xpathExpression: string, contextNode?: Record<string, any> | null, namespaceResolver?: Record<string, string> | null, resultType?: number, result?: any) => import("./parser-json-ld.js").JSONXPathResult) & ((xpathExpression: string, contextNode?: Record<string, any> | undefined, namespaceResolver?: Record<string, string> | null | undefined, resultType?: number | undefined, result?: any) => import("./parser-json-ld.js").JSONXPathResult);
        DEBUG_BUFFER_TYPE: string;
        DEBUG_MEDIA: "mp4" | "webm";
        DEBUG_MIME_TYPE: "video/mp4" | "video/webm";
        MISSING_HVML_PARSER_ERROR: string;
        MISSING_JSONLD_PARSER_ERROR: string;
        MISSING_XML_PARSER_ERROR: string;
        POLLING_INTERVAL: number;
        VIMEO_DOMAIN_REGEX: RegExp;
        VIMEO_VIDEO_REGEX: RegExp;
        YOUTUBE_DOMAIN_REGEX: RegExp;
        YOUTUBE_VIDEO_REGEX: RegExp;
        _cssNamespacePrefix: string;
        _hvmlParser: "xml" | "json-ld";
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
        $$: {
            <K extends keyof HTMLElementTagNameMap>(selectors: K): HTMLElementTagNameMap[K] | null;
            <K_1 extends keyof SVGElementTagNameMap>(selectors: K_1): SVGElementTagNameMap[K_1] | null;
            <K_2 extends keyof MathMLElementTagNameMap>(selectors: K_2): MathMLElementTagNameMap[K_2] | null;
            <K_3 extends keyof HTMLElementDeprecatedTagNameMap>(selectors: K_3): HTMLElementDeprecatedTagNameMap[K_3] | null;
            <E extends Element = Element>(selectors: string): E | null;
        };
        $$$: {
            <K_4 extends keyof HTMLElementTagNameMap>(selectors: K_4): NodeListOf<HTMLElementTagNameMap[K_4]>;
            <K_5 extends keyof SVGElementTagNameMap>(selectors: K_5): NodeListOf<SVGElementTagNameMap[K_5]>;
            <K_6 extends keyof MathMLElementTagNameMap>(selectors: K_6): NodeListOf<MathMLElementTagNameMap[K_6]>;
            <K_7 extends keyof HTMLElementDeprecatedTagNameMap>(selectors: K_7): NodeListOf<HTMLElementDeprecatedTagNameMap[K_7]>;
            <E_1 extends Element = Element>(selectors: string): NodeListOf<E_1>;
        };
        $id: <ElementType extends HTMLElement>(elementId: string) => ElementType | null;
        $template: HTMLTemplateElement;
        annotations: import("./redblue-video.js").Annotation[];
        bufferTypes: Record<"mp4" | "webm", string>;
        cachingStrategy: import("./redblue-video.js").CachingStrategies;
        currentChoiceAnnotationIndex: number;
        debug: boolean;
        duration: number;
        embedID: number;
        embedParameters: string;
        Events: {
            presentChoice: (event: any) => void;
            choiceClicked: (event: MouseEvent) => void;
        };
        findInXML: ((xpathExpression: string, $contextNode?: import("./redblue-video.js").$Element | undefined) => XPathResult) & ((xpathExpression: string, $contextNode?: import("./redblue-video.js").$Element | undefined) => XPathResult);
        firstChoiceSelected: boolean;
        firstSegmentAppended: boolean;
        getAnnotationsFromXML: ((xpath?: string | undefined, contextNode?: import("./redblue-video.js").$Element | undefined) => import("./redblue-video.js").Annotation[]) & (<Cast extends import("./redblue-video.js").Annotation[] = import("./redblue-video.js").Annotation[]>(xpath?: string, contextNode?: import("./redblue-video.js").$Element | undefined) => Cast);
        hvml: {
            xml: import("./redblue-video.js").$Element | null;
            jsonLD: Record<string, any> | null;
        };
        lastSegmentAppended: boolean;
        log: (...args: any[]) => void;
        mediaQueue: MediaQueueObject[];
        mimeTypes: Record<"mp4" | "webm", "video/mp4" | "video/webm">;
        MSE?: import("./player-mse.js").MSE | undefined;
        player: YT.Player;
        resolveCSSNamespacePrefixFromXML: ((defaultPrefix?: string | undefined) => Promise<string>) & ((defaultPrefix?: string) => any);
        stylesheetRules: CSSRuleList;
        timelineTriggers: import("./redblue-video.js").TimelineTriggers;
        XHR: {
            GET: (url: string, type: string, callback: (binary: Uint8Array, type: string) => void) => void;
        };
        readonly HVML_SOLO_ELEMENTS: string[];
        readonly hasXMLParser: boolean;
        readonly hasMSEPlayer: boolean;
        readonly hostDocument: {
            isPlainHTML: () => boolean;
            isXHTML: () => boolean;
        };
        getNonlinearPlaylistTargetIDfromChoiceLink($choiceLink: HTMLAnchorElement | {
            href: string;
        }): string;
        getNonlinearPlaylistTargetIDfromGoto($goto: import("./redblue-video.js").$Element): string;
        getNonlinearPlaylistItemFromTargetID(id: string): Element;
        getNonlinearPlaylistItemFromChoiceLink($choiceLink: HTMLAnchorElement): Element;
        queueNonlinearPlaylistItemsFromChoiceLink($choiceLink: HTMLAnchorElement): void;
        handleChoice($clicked: HTMLAnchorElement): void;
        _initChoiceEvents(): void;
        _registerChoiceEvents(): void;
        isNonlinear(): boolean;
        hasAttributeAnyNS($element: import("./redblue-video.js").$Element, attribute: string): boolean;
        getAttributeAnyNS($element: import("./redblue-video.js").$Element, attribute: string): string | null;
        _getXPathFromXPointerURI(uri: string): string;
        getMimeTypeFromFileElement($fileElement: import("./redblue-video.js").$Element): string;
        _handleMediaFromFileElements(xpath: string, callback: (mediaQueueObject: MediaQueueObject) => void): void;
        queueMediaFromFileElements(xpath: string): void;
        fetchMediaFromFileElements(xpath: string): void;
        _handleMediaFromMediaElement($mediaElement: import("./redblue-video.js").$Element, callback: (xpath: string) => void): void;
        queueMediaFromMediaElement($mediaElement: import("./redblue-video.js").$Element): void;
        fetchMediaFromMediaElement($mediaElement: import("./redblue-video.js").$Element): void;
        _handleMediaFromPlaylistItem($playlistItem: import("./redblue-video.js").$Element, mediaCallback: ($mediaElement: import("./redblue-video.js").$Element) => void, choicePromptCallback?: (($mediaElement: import("./redblue-video.js").$Element) => void) | undefined): void;
        queueMediaFromPlaylistItem($playlistItem: import("./redblue-video.js").$Element): void;
        fetchMediaFromPlaylistItem($playlistItem: import("./redblue-video.js").$Element): void;
        populateDescription(): void;
        toggleFullscreen(): void;
        resolveCSSNamespacePrefix(): Promise<string>;
        applyAnnotationStyles(loopObject?: import("./redblue-video.js").Annotation[], parentIndex?: number | undefined): void;
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
        getNonlinearPlaylist(): Element | import("./parser-json-ld.js").JSONElement;
        createHotspots(): boolean;
        createHotspot(annotation: import("./redblue-video.js").Annotation, index: string | number, $target?: HTMLElement): void;
        mapAttributeToKeyValuePair(attribute: Attr): Record<string, string | null>;
        flattenKeyValuePairs(accumulator: Record<string, string | null>, keyValuePair: Record<string, string | null>): Record<string, string | null>;
        nodeAttributesToJSON<Cast_1 extends Record<string, any>>(attributes: NamedNodeMap): Cast_1;
        getAnnotations(): import("./redblue-video.js").Annotation[];
        getTimelineTriggers(): import("./redblue-video.js").TimelineTriggers;
        find(query: string, contextNode?: import("./redblue-video.js").$Element | undefined): import("./redblue-video.js").HTMLXPathResult | import("./parser-json-ld.js").JSONXPathResult;
        accessKey: string;
        readonly accessKeyLabel: string;
        autocapitalize: string;
        dir: string;
        draggable: boolean;
        hidden: boolean;
        inert: boolean;
        innerText: string;
        lang: string;
        readonly offsetHeight: number;
        readonly offsetLeft: number;
        readonly offsetParent: Element | null;
        readonly offsetTop: number;
        readonly offsetWidth: number;
        outerText: string;
        popover: string | null;
        spellcheck: boolean;
        title: string;
        translate: boolean;
        attachInternals(): ElementInternals;
        click(): void;
        hidePopover(): void;
        showPopover(): void;
        togglePopover(force?: boolean | undefined): void;
        addEventListener<K_8 extends keyof HTMLElementEventMap>(type: K_8, listener: (this: HTMLElement, ev: HTMLElementEventMap[K_8]) => any, options?: boolean | AddEventListenerOptions | undefined): void;
        addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions | undefined): void;
        removeEventListener<K_9 extends keyof HTMLElementEventMap>(type: K_9, listener: (this: HTMLElement, ev: HTMLElementEventMap[K_9]) => any, options?: boolean | EventListenerOptions | undefined): void;
        removeEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions | undefined): void;
        mozRequestFullScreen?: (() => void) | undefined;
        webkitRequestFullscreen?: (() => void) | undefined;
        readonly attributes: NamedNodeMap;
        readonly classList: DOMTokenList;
        className: string;
        readonly clientHeight: number;
        readonly clientLeft: number;
        readonly clientTop: number;
        readonly clientWidth: number;
        id: string;
        readonly localName: string;
        readonly namespaceURI: string | null;
        onfullscreenchange: ((this: Element, ev: Event) => any) | null;
        onfullscreenerror: ((this: Element, ev: Event) => any) | null;
        outerHTML: string;
        readonly ownerDocument: Document;
        readonly part: DOMTokenList;
        readonly prefix: string | null;
        readonly scrollHeight: number;
        scrollLeft: number;
        scrollTop: number;
        readonly scrollWidth: number;
        readonly shadowRoot: ShadowRoot | null;
        slot: string;
        readonly tagName: string;
        attachShadow(init: ShadowRootInit): ShadowRoot;
        checkVisibility(options?: CheckVisibilityOptions | undefined): boolean;
        closest<K_10 extends keyof HTMLElementTagNameMap>(selector: K_10): HTMLElementTagNameMap[K_10] | null;
        closest<K_11 extends keyof SVGElementTagNameMap>(selector: K_11): SVGElementTagNameMap[K_11] | null;
        closest<K_12 extends keyof MathMLElementTagNameMap>(selector: K_12): MathMLElementTagNameMap[K_12] | null;
        closest<E_2 extends Element = Element>(selectors: string): E_2 | null;
        computedStyleMap(): StylePropertyMapReadOnly;
        getAttribute(qualifiedName: string): string | null;
        getAttributeNS(namespace: string | null, localName: string): string | null;
        getAttributeNames(): string[];
        getAttributeNode(qualifiedName: string): Attr | null;
        getAttributeNodeNS(namespace: string | null, localName: string): Attr | null;
        getBoundingClientRect(): DOMRect;
        getClientRects(): DOMRectList;
        getElementsByClassName(classNames: string): HTMLCollectionOf<Element>;
        getElementsByTagName<K_13 extends keyof HTMLElementTagNameMap>(qualifiedName: K_13): HTMLCollectionOf<HTMLElementTagNameMap[K_13]>;
        getElementsByTagName<K_14 extends keyof SVGElementTagNameMap>(qualifiedName: K_14): HTMLCollectionOf<SVGElementTagNameMap[K_14]>;
        getElementsByTagName<K_15 extends keyof MathMLElementTagNameMap>(qualifiedName: K_15): HTMLCollectionOf<MathMLElementTagNameMap[K_15]>;
        getElementsByTagName<K_16 extends keyof HTMLElementDeprecatedTagNameMap>(qualifiedName: K_16): HTMLCollectionOf<HTMLElementDeprecatedTagNameMap[K_16]>;
        getElementsByTagName(qualifiedName: string): HTMLCollectionOf<Element>;
        getElementsByTagNameNS(namespaceURI: "http://www.w3.org/1999/xhtml", localName: string): HTMLCollectionOf<HTMLElement>;
        getElementsByTagNameNS(namespaceURI: "http://www.w3.org/2000/svg", localName: string): HTMLCollectionOf<SVGElement>;
        getElementsByTagNameNS(namespaceURI: "http://www.w3.org/1998/Math/MathML", localName: string): HTMLCollectionOf<MathMLElement>;
        getElementsByTagNameNS(namespace: string | null, localName: string): HTMLCollectionOf<Element>;
        hasAttribute(qualifiedName: string): boolean;
        hasAttributeNS(namespace: string | null, localName: string): boolean;
        hasAttributes(): boolean;
        hasPointerCapture(pointerId: number): boolean;
        insertAdjacentElement(where: InsertPosition, element: Element): Element | null;
        insertAdjacentHTML(position: InsertPosition, text: string): void;
        insertAdjacentText(where: InsertPosition, data: string): void;
        matches(selectors: string): boolean;
        releasePointerCapture(pointerId: number): void;
        removeAttribute(qualifiedName: string): void;
        removeAttributeNS(namespace: string | null, localName: string): void;
        removeAttributeNode(attr: Attr): Attr;
        requestFullscreen(options?: FullscreenOptions | undefined): Promise<void>;
        requestPointerLock(): void;
        scroll(options?: ScrollToOptions | undefined): void;
        scroll(x: number, y: number): void;
        scrollBy(options?: ScrollToOptions | undefined): void;
        scrollBy(x: number, y: number): void;
        scrollIntoView(arg?: boolean | ScrollIntoViewOptions | undefined): void;
        scrollTo(options?: ScrollToOptions | undefined): void;
        scrollTo(x: number, y: number): void;
        setAttribute(qualifiedName: string, value: string): void;
        setAttributeNS(namespace: string | null, qualifiedName: string, value: string): void;
        setAttributeNode(attr: Attr): Attr | null;
        setAttributeNodeNS(attr: Attr): Attr | null;
        setPointerCapture(pointerId: number): void;
        toggleAttribute(qualifiedName: string, force?: boolean | undefined): boolean;
        webkitMatchesSelector(selectors: string): boolean;
        readonly baseURI: string;
        readonly childNodes: NodeListOf<ChildNode>;
        readonly firstChild: ChildNode | null;
        readonly isConnected: boolean;
        readonly lastChild: ChildNode | null;
        readonly nextSibling: ChildNode | null;
        readonly nodeName: string;
        readonly nodeType: number;
        nodeValue: string | null;
        readonly parentElement: HTMLElement | null;
        readonly parentNode: ParentNode | null;
        readonly previousSibling: ChildNode | null;
        textContent: string | null;
        appendChild<T extends Node>(node: T): T;
        cloneNode(deep?: boolean | undefined): Node;
        compareDocumentPosition(other: Node): number;
        contains(other: Node | null): boolean;
        getRootNode(options?: GetRootNodeOptions | undefined): Node;
        hasChildNodes(): boolean;
        insertBefore<T_1 extends Node>(node: T_1, child: Node | null): T_1;
        isDefaultNamespace(namespace: string | null): boolean;
        isEqualNode(otherNode: Node | null): boolean;
        isSameNode(otherNode: Node | null): boolean;
        lookupNamespaceURI(prefix: string | null): string | null;
        lookupPrefix(namespace: string | null): string | null;
        normalize(): void;
        removeChild<T_2 extends Node>(child: T_2): T_2;
        replaceChild<T_3 extends Node>(node: Node, child: T_3): T_3;
        readonly ELEMENT_NODE: 1;
        readonly ATTRIBUTE_NODE: 2;
        readonly TEXT_NODE: 3;
        readonly CDATA_SECTION_NODE: 4;
        readonly ENTITY_REFERENCE_NODE: 5;
        readonly ENTITY_NODE: 6;
        readonly PROCESSING_INSTRUCTION_NODE: 7;
        readonly COMMENT_NODE: 8;
        readonly DOCUMENT_NODE: 9;
        readonly DOCUMENT_TYPE_NODE: 10;
        readonly DOCUMENT_FRAGMENT_NODE: 11;
        readonly NOTATION_NODE: 12;
        readonly DOCUMENT_POSITION_DISCONNECTED: 1;
        readonly DOCUMENT_POSITION_PRECEDING: 2;
        readonly DOCUMENT_POSITION_FOLLOWING: 4;
        readonly DOCUMENT_POSITION_CONTAINS: 8;
        readonly DOCUMENT_POSITION_CONTAINED_BY: 16;
        readonly DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC: 32;
        dispatchEvent(event: Event): boolean;
        ariaAtomic: string | null;
        ariaAutoComplete: string | null;
        ariaBusy: string | null;
        ariaChecked: string | null;
        ariaColCount: string | null;
        ariaColIndex: string | null;
        ariaColSpan: string | null;
        ariaCurrent: string | null;
        ariaDisabled: string | null;
        ariaExpanded: string | null;
        ariaHasPopup: string | null;
        ariaHidden: string | null;
        ariaInvalid: string | null;
        ariaKeyShortcuts: string | null;
        ariaLabel: string | null;
        ariaLevel: string | null;
        ariaLive: string | null;
        ariaModal: string | null;
        ariaMultiLine: string | null;
        ariaMultiSelectable: string | null;
        ariaOrientation: string | null;
        ariaPlaceholder: string | null;
        ariaPosInSet: string | null;
        ariaPressed: string | null;
        ariaReadOnly: string | null;
        ariaRequired: string | null;
        ariaRoleDescription: string | null;
        ariaRowCount: string | null;
        ariaRowIndex: string | null;
        ariaRowSpan: string | null;
        ariaSelected: string | null;
        ariaSetSize: string | null;
        ariaSort: string | null;
        ariaValueMax: string | null;
        ariaValueMin: string | null;
        ariaValueNow: string | null;
        ariaValueText: string | null;
        role: string | null;
        animate(keyframes: Keyframe[] | PropertyIndexedKeyframes | null, options?: number | KeyframeAnimationOptions | undefined): Animation;
        getAnimations(options?: GetAnimationsOptions | undefined): Animation[];
        after(...nodes: (string | Node)[]): void;
        before(...nodes: (string | Node)[]): void;
        remove(): void;
        replaceWith(...nodes: (string | Node)[]): void;
        innerHTML: string;
        readonly nextElementSibling: Element | null;
        readonly previousElementSibling: Element | null;
        readonly childElementCount: number;
        readonly children: HTMLCollection;
        readonly firstElementChild: Element | null;
        readonly lastElementChild: Element | null;
        append(...nodes: (string | Node)[]): void;
        prepend(...nodes: (string | Node)[]): void;
        querySelector<K extends keyof HTMLElementTagNameMap>(selectors: K): HTMLElementTagNameMap[K] | null;
        querySelector<K_1 extends keyof SVGElementTagNameMap>(selectors: K_1): SVGElementTagNameMap[K_1] | null;
        querySelector<K_2 extends keyof MathMLElementTagNameMap>(selectors: K_2): MathMLElementTagNameMap[K_2] | null;
        querySelector<K_3 extends keyof HTMLElementDeprecatedTagNameMap>(selectors: K_3): HTMLElementDeprecatedTagNameMap[K_3] | null;
        querySelector<E extends Element = Element>(selectors: string): E | null;
        querySelectorAll<K_4 extends keyof HTMLElementTagNameMap>(selectors: K_4): NodeListOf<HTMLElementTagNameMap[K_4]>;
        querySelectorAll<K_5 extends keyof SVGElementTagNameMap>(selectors: K_5): NodeListOf<SVGElementTagNameMap[K_5]>;
        querySelectorAll<K_6 extends keyof MathMLElementTagNameMap>(selectors: K_6): NodeListOf<MathMLElementTagNameMap[K_6]>;
        querySelectorAll<K_7 extends keyof HTMLElementDeprecatedTagNameMap>(selectors: K_7): NodeListOf<HTMLElementDeprecatedTagNameMap[K_7]>;
        querySelectorAll<E_1 extends Element = Element>(selectors: string): NodeListOf<E_1>;
        replaceChildren(...nodes: (string | Node)[]): void;
        readonly assignedSlot: HTMLSlotElement | null;
        readonly attributeStyleMap: StylePropertyMap;
        readonly style: CSSStyleDeclaration;
        contentEditable: string;
        enterKeyHint: string;
        inputMode: string;
        readonly isContentEditable: boolean;
        onabort: ((this: GlobalEventHandlers, ev: UIEvent) => any) | null;
        onanimationcancel: ((this: GlobalEventHandlers, ev: AnimationEvent) => any) | null;
        onanimationend: ((this: GlobalEventHandlers, ev: AnimationEvent) => any) | null;
        onanimationiteration: ((this: GlobalEventHandlers, ev: AnimationEvent) => any) | null;
        onanimationstart: ((this: GlobalEventHandlers, ev: AnimationEvent) => any) | null;
        onauxclick: ((this: GlobalEventHandlers, ev: MouseEvent) => any) | null;
        onbeforeinput: ((this: GlobalEventHandlers, ev: InputEvent) => any) | null;
        onblur: ((this: GlobalEventHandlers, ev: FocusEvent) => any) | null;
        oncancel: ((this: GlobalEventHandlers, ev: Event) => any) | null;
        oncanplay: ((this: GlobalEventHandlers, ev: Event) => any) | null;
        oncanplaythrough: ((this: GlobalEventHandlers, ev: Event) => any) | null;
        onchange: ((this: GlobalEventHandlers, ev: Event) => any) | null;
        onclick: ((this: GlobalEventHandlers, ev: MouseEvent) => any) | null;
        onclose: ((this: GlobalEventHandlers, ev: Event) => any) | null;
        oncontextmenu: ((this: GlobalEventHandlers, ev: MouseEvent) => any) | null;
        oncopy: ((this: GlobalEventHandlers, ev: ClipboardEvent) => any) | null;
        oncuechange: ((this: GlobalEventHandlers, ev: Event) => any) | null;
        oncut: ((this: GlobalEventHandlers, ev: ClipboardEvent) => any) | null;
        ondblclick: ((this: GlobalEventHandlers, ev: MouseEvent) => any) | null;
        ondrag: ((this: GlobalEventHandlers, ev: DragEvent) => any) | null;
        ondragend: ((this: GlobalEventHandlers, ev: DragEvent) => any) | null;
        ondragenter: ((this: GlobalEventHandlers, ev: DragEvent) => any) | null;
        ondragleave: ((this: GlobalEventHandlers, ev: DragEvent) => any) | null;
        ondragover: ((this: GlobalEventHandlers, ev: DragEvent) => any) | null;
        ondragstart: ((this: GlobalEventHandlers, ev: DragEvent) => any) | null;
        ondrop: ((this: GlobalEventHandlers, ev: DragEvent) => any) | null;
        ondurationchange: ((this: GlobalEventHandlers, ev: Event) => any) | null;
        onemptied: ((this: GlobalEventHandlers, ev: Event) => any) | null;
        onended: ((this: GlobalEventHandlers, ev: Event) => any) | null;
        onerror: OnErrorEventHandler;
        onfocus: ((this: GlobalEventHandlers, ev: FocusEvent) => any) | null;
        onformdata: ((this: GlobalEventHandlers, ev: FormDataEvent) => any) | null;
        ongotpointercapture: ((this: GlobalEventHandlers, ev: PointerEvent) => any) | null;
        oninput: ((this: GlobalEventHandlers, ev: Event) => any) | null;
        oninvalid: ((this: GlobalEventHandlers, ev: Event) => any) | null;
        onkeydown: ((this: GlobalEventHandlers, ev: KeyboardEvent) => any) | null;
        onkeypress: ((this: GlobalEventHandlers, ev: KeyboardEvent) => any) | null;
        onkeyup: ((this: GlobalEventHandlers, ev: KeyboardEvent) => any) | null;
        onload: ((this: GlobalEventHandlers, ev: Event) => any) | null;
        onloadeddata: ((this: GlobalEventHandlers, ev: Event) => any) | null;
        onloadedmetadata: ((this: GlobalEventHandlers, ev: Event) => any) | null;
        onloadstart: ((this: GlobalEventHandlers, ev: Event) => any) | null;
        onlostpointercapture: ((this: GlobalEventHandlers, ev: PointerEvent) => any) | null;
        onmousedown: ((this: GlobalEventHandlers, ev: MouseEvent) => any) | null;
        onmouseenter: ((this: GlobalEventHandlers, ev: MouseEvent) => any) | null;
        onmouseleave: ((this: GlobalEventHandlers, ev: MouseEvent) => any) | null;
        onmousemove: ((this: GlobalEventHandlers, ev: MouseEvent) => any) | null;
        onmouseout: ((this: GlobalEventHandlers, ev: MouseEvent) => any) | null;
        onmouseover: ((this: GlobalEventHandlers, ev: MouseEvent) => any) | null;
        onmouseup: ((this: GlobalEventHandlers, ev: MouseEvent) => any) | null;
        onpaste: ((this: GlobalEventHandlers, ev: ClipboardEvent) => any) | null;
        onpause: ((this: GlobalEventHandlers, ev: Event) => any) | null;
        onplay: ((this: GlobalEventHandlers, ev: Event) => any) | null;
        onplaying: ((this: GlobalEventHandlers, ev: Event) => any) | null;
        onpointercancel: ((this: GlobalEventHandlers, ev: PointerEvent) => any) | null;
        onpointerdown: ((this: GlobalEventHandlers, ev: PointerEvent) => any) | null;
        onpointerenter: ((this: GlobalEventHandlers, ev: PointerEvent) => any) | null;
        onpointerleave: ((this: GlobalEventHandlers, ev: PointerEvent) => any) | null;
        onpointermove: ((this: GlobalEventHandlers, ev: PointerEvent) => any) | null;
        onpointerout: ((this: GlobalEventHandlers, ev: PointerEvent) => any) | null;
        onpointerover: ((this: GlobalEventHandlers, ev: PointerEvent) => any) | null;
        onpointerup: ((this: GlobalEventHandlers, ev: PointerEvent) => any) | null;
        onprogress: ((this: GlobalEventHandlers, ev: ProgressEvent<EventTarget>) => any) | null;
        onratechange: ((this: GlobalEventHandlers, ev: Event) => any) | null;
        onreset: ((this: GlobalEventHandlers, ev: Event) => any) | null;
        onresize: ((this: GlobalEventHandlers, ev: UIEvent) => any) | null;
        onscroll: ((this: GlobalEventHandlers, ev: Event) => any) | null;
        onscrollend: ((this: GlobalEventHandlers, ev: Event) => any) | null;
        onsecuritypolicyviolation: ((this: GlobalEventHandlers, ev: SecurityPolicyViolationEvent) => any) | null;
        onseeked: ((this: GlobalEventHandlers, ev: Event) => any) | null;
        onseeking: ((this: GlobalEventHandlers, ev: Event) => any) | null;
        onselect: ((this: GlobalEventHandlers, ev: Event) => any) | null;
        onselectionchange: ((this: GlobalEventHandlers, ev: Event) => any) | null;
        onselectstart: ((this: GlobalEventHandlers, ev: Event) => any) | null;
        onslotchange: ((this: GlobalEventHandlers, ev: Event) => any) | null;
        onstalled: ((this: GlobalEventHandlers, ev: Event) => any) | null;
        onsubmit: ((this: GlobalEventHandlers, ev: SubmitEvent) => any) | null;
        onsuspend: ((this: GlobalEventHandlers, ev: Event) => any) | null;
        ontimeupdate: ((this: GlobalEventHandlers, ev: Event) => any) | null;
        ontoggle: ((this: GlobalEventHandlers, ev: Event) => any) | null;
        ontouchcancel?: ((this: GlobalEventHandlers, ev: TouchEvent) => any) | null | undefined;
        ontouchend?: ((this: GlobalEventHandlers, ev: TouchEvent) => any) | null | undefined;
        ontouchmove?: ((this: GlobalEventHandlers, ev: TouchEvent) => any) | null | undefined;
        ontouchstart?: ((this: GlobalEventHandlers, ev: TouchEvent) => any) | null | undefined;
        ontransitioncancel: ((this: GlobalEventHandlers, ev: TransitionEvent) => any) | null;
        ontransitionend: ((this: GlobalEventHandlers, ev: TransitionEvent) => any) | null;
        ontransitionrun: ((this: GlobalEventHandlers, ev: TransitionEvent) => any) | null;
        ontransitionstart: ((this: GlobalEventHandlers, ev: TransitionEvent) => any) | null;
        onvolumechange: ((this: GlobalEventHandlers, ev: Event) => any) | null;
        onwaiting: ((this: GlobalEventHandlers, ev: Event) => any) | null;
        onwebkitanimationend: ((this: GlobalEventHandlers, ev: Event) => any) | null;
        onwebkitanimationiteration: ((this: GlobalEventHandlers, ev: Event) => any) | null;
        onwebkitanimationstart: ((this: GlobalEventHandlers, ev: Event) => any) | null;
        onwebkittransitionend: ((this: GlobalEventHandlers, ev: Event) => any) | null;
        onwheel: ((this: GlobalEventHandlers, ev: WheelEvent) => any) | null;
        autofocus: boolean;
        readonly dataset: DOMStringMap;
        nonce?: string | undefined;
        tabIndex: number;
        blur(): void;
        focus(options?: FocusOptions | undefined): void;
        XML: {
            xmlDoc: Document | null;
            xmlLoaded: boolean;
            evaluator: XPathEvaluator;
            nsResolver: null;
            ns: Record<string, string>;
            read: () => unknown;
            import: (xmlFile: string) => void;
        };
        getAnnotationFromChoiceElement($child: import("./redblue-video.js").$Element): import("./redblue-video.js").Choice;
    };
    customJSONSearchUtility?: ((xpathExpression: string, contextNode?: Record<string, any> | null, namespaceResolver?: Record<string, string> | null, resultType?: number, result?: any) => import("./parser-json-ld.js").JSONXPathResult) | undefined;
    readonly is: string;
    readonly template: string;
    readonly NS: Record<string, string>;
    readonly cachingStrategies: {
        LAZY: number;
        PRELOAD: number;
    };
    reCamelCase(nodeName: string): string;
    MSEsupported(): boolean;
};
export default _RedBlueLegacyPlayer;
//# sourceMappingURL=player-legacy.d.ts.map