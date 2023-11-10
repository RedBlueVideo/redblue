// TODO: This is very HTML/XML-biased currently; flesh out JSON-LD support.
'use strict';

import { JSONXPathResult, JSONLDParser, JSONElement } from "./parser-json-ld";
import { MSE } from "./player-mse";

declare global {
  interface Window {
    WebKitMediaSource: any;
  }
}

// TODO: Specific HVML element types? Bundle with hvml npm package
// interface HVMLPlaylistXMLElement extends Element {
//   readonly nodeName: 'playlist';
//   readonly localName: 'playlist';
//   readonly namespaceURI: 'https://hypervideo.tech/hvml#';
// }
// interface HVMLPlaylistHTMLElement extends HTMLElement {
//   readonly nodeName: 'playlist';
//   readonly localName: 'playlist';
// }
// type HVMLPlaylistElement = HVMLPlaylistXMLElement | HVMLPlaylistHTMLElement;

export type MediaQueueObject = {
  mime: string;
  path: string;
};

type MediaElementCallback = ( $mediaElement: $Element ) => void;

type MediaQueueObjectCallback = ( mediaQueueObject: MediaQueueObject ) => void;

type $ChoiceLink = HTMLAnchorElement;

type CamelCaseHvmlElements =          'endTime' | 'endX' | 'endY' | 'startTime' | 'startX' | 'startY' | 'choicePrompt';
type CamelCaseHvmlElementsLowerCase = 'endtime' | 'endx' | 'endy' | 'starttime' | 'startx' | 'starty' | 'choiceprompt';
type CamelCaseHvmlElementsCamelOrLowerCase = CamelCaseHvmlElements | CamelCaseHvmlElementsLowerCase;

type $HTMLorXMLElement = HTMLElement | Element;

export type $Element = $HTMLorXMLElement | JSONElement;

export interface HTMLXPathResult extends XPathResult {
  readonly singleNodeValue: $HTMLorXMLElement | null;
  iterateNext(): $HTMLorXMLElement | null;
  snapshotItem(index: number): $HTMLorXMLElement | null;
}

type FindResult = HTMLXPathResult | JSONXPathResult;

/**
 * @deprecated
 */
type ResolvableExpression = FindResult | $Element | Node;

type HVMLSerialization = 'xml' | 'json-ld';

export enum CachingStrategies {
  LAZY = 0,
  PRELOAD = 1,
}

enum MediaFileTypes {
  "mp4" = "video/mp4",
  "webm" = "video/webm",
}
type MediaFileExtensions = keyof typeof MediaFileTypes;
type MediaFileMediaTypes = `${MediaFileTypes}`;

// "animate": [
//   {
//     "startTime": "517.292107",
//     "endTime": "518.872131",
//     "startX": "14.9%",
//     "startY": "-15%",
//     "endX": "15%",
//     "endY": "10%"
//   },

interface Animation {
  startTime: number;
  endTime: number;
  startX: string;
  startY: string;
  endX: string;
  endY: string;
}

/*
TODO: Generate TS definitions from RelaxNG schema
<goto
  on="duration"
  xlink:actuate="onRequest"
  xlink:href="https://www.facebook.com/hugh.guiney/videos/10100195051457860/"
  width="70%"
  height="13%"
  css:font-size="calc(384 / 150 * 1vw)"
  css:font-family="'Noto Sans CJK JP', 'Noto Sans CJK', 'Noto Sans', sans-serif"
  css:white-space="nowrap"
  css:overflow="hidden"
/>
*/
interface Goto {
  on: 'durationStart' | 'duration' | 'durationEnd';
  'xlink:actuate': 'onLoad' | 'onRequest' | 'other' | 'none';
  'xlink:href': string;
  width: string;
  height: string;
  timeline: 'replace' | 'restart';
  animate: Animation[];
  // [key: string]: string;
}

interface Choice {
  name: string;
  goto: Goto;
}

export interface Annotation {
  'xml:id'?: string;
  $ui: HTMLElement;
  animateIndex: number;
  annotationIndex: number;
  choices: Choice[];
  endClass: string;
  goto: Goto;
  id?: string;
  name: string;
  startClass: string;
  type: 'choicePrompt' | 'choice';
}

interface SpecficDocumentFragment extends DocumentFragment {
  getElementById<ElementType extends HTMLElement>( elementId: string ): ElementType | null; 
}

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

  _cssNamespacePrefix: string;
  _hvmlParser: HVMLSerialization;
  _isNonlinear: boolean;

  /**
   * Cached elements
   */
  $: {
    annotations: HTMLElement | null;
    currentChoice: HTMLElement | null;
    description: HTMLElement | null;
    embeddedMedia: HTMLIFrameElement | null;
    fullscreenButton: HTMLButtonElement | null;
    fullscreenContext: HTMLElement | null;
    localMedia: HTMLVideoElement | null;
    style: HTMLStyleElement | null;
  };

  /**
   * `querySelector` shortcut
   */
  $$: ParentNode['querySelector'];

  /**
   * `querySelectorAll` shortcut
   */
  $$$: ParentNode['querySelectorAll'];

  /**
   * `getElementById` shorcut
   */
  $id: SpecficDocumentFragment['getElementById'];
  $template: HTMLTemplateElement;

  annotations: Annotation[];

  bufferTypes: Record<MediaFileExtensions, string>;

  cachingStrategy: CachingStrategies;

  currentChoiceAnnotationIndex: number;

  debug: boolean;

  duration: number;

  embedID: number;
  embedParameters: string;

  Events: {
    presentChoice: ( event: any ) => void;
    choiceClicked: ( event: MouseEvent ) => void;
  };

  findInJSONLD?(
    xpathExpression: string,
    contextNode?: Record<string, any>,
    namespaceResolver?: Record<string, string> | null,
    resultType?: number,
    result?: any,
  ): JSONXPathResult;

  findInXML?( xpathExpression: string, $contextNode: $Element ): XPathResult;

  firstChoiceSelected: boolean;

  firstSegmentAppended: boolean;

  // TODO: Split into HVML and JSON-LD versions? These types have nothing in common
  hvml: {
    xml: $Element | null;
    jsonLD: Record<string, any> | null;
  };

  lastSegmentAppended: boolean;

  log: ( ...args: any[] ) => void;

  mediaQueue: MediaQueueObject[];

  mimeTypes: Record<MediaFileExtensions, MediaFileMediaTypes>;

  MSE?: MSE;

  stylesheetRules?: CSSRuleList;


  /**
   * ```ts
   * {
   *   ...animate,
   *   annotationIndex,
   *   animateIndex,
   *   "name": annotation.name,
   *   "$ui": this.$$( `#annotations [data-index="${annotationIndex}"]` ),
   *   "startClass": `redblue-annotations__link--${annotationIndex}-start`,
   *   "endClass": `redblue-annotations__link--${annotationIndex}-animate-${animateIndex}-end`,
   * }
   * ```
   */
  timelineTriggers: {} | Record<number, Annotation>;

  /**
   * Returns the Custom Element tag name.
   */
  static get is() {
    return 'redblue-video';
  }

  /**
   * Returns a string representation of the player’s Shadow DOM, including the base stylesheet.
   */
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

  /**
   * Returns a lookup table mapping XML namespace prefixes to URIs.
   */
  static get NS(): Record<string, string> {
    return {
      "hvml": "https://hypervideo.tech/hvml#",
      "ovml": "http://vocab.nospoon.tv/ovml#",
      "html": "http://www.w3.org/1999/xhtml",
      "xlink": "http://www.w3.org/1999/xlink",
      "css": "https://www.w3.org/TR/CSS/",
      "xml": "http://www.w3.org/XML/1998/namespace",
    };
  }

  /**
   * Different modes for loading media segments.
   */
  static get cachingStrategies() {
    return {
      /** Load media segments as they are encountered as a result of user input. */
      "LAZY": 0,
      /** Load all media segments in advance to minimize buffering. */
      "PRELOAD": 1,
    };
  }

  /**
   * Map lowercased attribute names (HTML-compat) back to original camel case attributes (XML-compat).
   *
   * @param nodeName - Attribute name in lowercase
   * @returns Attribute name in camel case
   */
  static reCamelCase( nodeName: string ): CamelCaseHvmlElements | undefined {
    const map: Record<string, CamelCaseHvmlElements> = {
      "endtime": "endTime",
      "endx": "endX",
      "endy": "endY",
      "starttime": "startTime",
      "startx": "startX",
      "starty": "startY",
      "choiceprompt": "choicePrompt",
    };

    return map[nodeName];
  }

  static MSEsupported() {
    return !!( window.MediaSource || window.WebKitMediaSource );
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

  getNonlinearPlaylistTargetIDfromChoiceLink( $choiceLink: $ChoiceLink | { 'href': string; } ) {
    let href: string | undefined;

    if ( $choiceLink instanceof HTMLAnchorElement && $choiceLink.hasAttribute( 'href' ) ) {
      href = $choiceLink.getAttribute( 'href' )!;
    } else if ( $choiceLink instanceof Element && this.hasAttributeAnyNS( $choiceLink, 'xlink:href' ) ) {
      // href = this._getXPathFromXPointerURI(
      //   this.getAttributeAnyNS( $clicked, 'xlink:href' )
      // );
      href = this.getAttributeAnyNS( $choiceLink, 'xlink:href' )!;
    } else if ( 'href' in $choiceLink ) {
      ( { href } = $choiceLink );
    } else if ( 'xlink:href' in $choiceLink ) {
      href = $choiceLink['xlink:href'];
    }

    if ( !href ) {
      throw new TypeError( 'Choice link has no `href` or `xlink:href` attribute; no action to perform.' );
    }

    if ( !/^#/i.test( href ) ) {
      throw new TypeError( 'Choice link’s `href` attribute must be a valid CSS or XLink ID selector (i.e. it must start with a hash symbol)' );
    }

    href = href.slice( 1 );

    return href;
  }

  /**
   * @param $goto HVML `<goto>` element
   * @returns HTML or XML `id` URI
   */
  getNonlinearPlaylistTargetIDfromGoto( $goto: $Element ) {
    let href: string | null | undefined;

    if ( this.hasAttributeAnyNS( $goto, 'xlink:href' ) ) {
      href = this.getAttributeAnyNS( $goto, 'xlink:href' );
    }

    if ( !href ) {
      throw new TypeError( 'Goto has no `href` or `xlink:href` attribute; no action to perform.' );
    }

    if ( !/^#/i.test( href ) ) {
      throw new TypeError( 'Goto’s href must be a valid CSS or XLink ID selector (i.e. it must start with a hash symbol)' );
    }

    href = href.slice( 1 );

    return href;
  }

  /**
   * @param id - HTML or XML `id` pointing to an interactive playback instruction.
   */
  getNonlinearPlaylistItemFromTargetID( id: string ): Element {
    let xpath: string;

    if ( this.hostDocument.isXHTML() ) {
      xpath = `//*[@xml:id="${id}"]`;
    } else /*if ( this.hostDocument.isPlainHTML() )*/ {
      xpath = `//*[@id="${id}"]`;
    }

    const nextPlaylistResult = this.find( xpath );
    let $nextPlaylistItem: $Element | null;

    if ( nextPlaylistResult && nextPlaylistResult.snapshotLength ) {
      $nextPlaylistItem = nextPlaylistResult.snapshotItem( 0 )!;
    } else {
      throw new Error( `No HVML elements found after following choice link to \`${xpath}\`` );
    }

    return $nextPlaylistItem as Element;
  }

  getNonlinearPlaylistItemFromChoiceLink( $choiceLink: $ChoiceLink ) {
    const id = this.getNonlinearPlaylistTargetIDfromChoiceLink( $choiceLink );
    return this.getNonlinearPlaylistItemFromTargetID( id );
  }

  queueNonlinearPlaylistItemsFromChoiceLink( $choiceLink: $ChoiceLink ) {
    const $nextPlaylistItem = this.getNonlinearPlaylistItemFromChoiceLink( $choiceLink );

    if ( this.hasAttributeAnyNS( $nextPlaylistItem, 'xlink:href' ) ) {
      const fileXPath = this._getXPathFromXPointerURI(
        this.getAttributeAnyNS( $nextPlaylistItem, 'xlink:href' )!,
      );

      if ( this.cachingStrategy === RedBlueVideo.cachingStrategies.LAZY ) {
        this.fetchMediaFromFileElements( fileXPath );
      }

      this.queueMediaFromFileElements( fileXPath );

      const gotoResult = this.find( './/goto[1]', $nextPlaylistItem );
      let $goto: $Element;

      if ( gotoResult && gotoResult.snapshotLength ) {
        $goto = gotoResult.snapshotItem( 0 )!;

        const targetID = this.getNonlinearPlaylistTargetIDfromGoto( $goto );
        const $playlistItem = this.getNonlinearPlaylistItemFromTargetID( targetID );

        this._handleMediaFromPlaylistItem(
          $playlistItem,
          ( $mediaElement ) => {
            if ( this.cachingStrategy === RedBlueVideo.cachingStrategies.LAZY ) {
              this.fetchMediaFromMediaElement( $mediaElement );
            }

            this.queueMediaFromMediaElement( $mediaElement );
          },
        );
      }
    }
  }

  handleChoice( $clicked: $ChoiceLink ) {
    this.$.localMedia?.addEventListener( 'timeupdate', this.Events.presentChoice, false );

    if ( this.$.currentChoice ) {
      this.$.currentChoice.hidden = true;
    }

    if ( !$clicked.dataset.index ) {
      throw new TypeError( `Choice links must have a \`data-index\` attribute. This attribute should have been set for you via \`this.createHotspot()\` under standard usage.` );
    }

    if ( $clicked.dataset.index.indexOf( '-' ) === -1 ) {

    }

    this.log( 'choice clicked' );

    const currentAnnotation = this.annotations[this.currentChoiceAnnotationIndex];
    const currentChoiceChoiceIndex = Number( $clicked.dataset.index.split( '-' )[1] );
    const timelineProperty = currentAnnotation.choices[currentChoiceChoiceIndex].goto.timeline;

    if ( timelineProperty && ( timelineProperty === 'replace' ) ) {
      this.log( 'replacing timeline' );
      this.currentChoiceAnnotationIndex = 0;
      this.mediaQueue = [];
      // TODO: this.mediaQueueHistory
      if ( this.MSE ) {
        // this.MSE.mediaSource.endOfStream();
        // this.MSE.endOfStream = true;
        this.MSE.init();
      }
    } else {
      this.log( 'appending to timeline' );
      ++this.currentChoiceAnnotationIndex;
    }

    this.$.currentChoice = this.$id( `annotation-${this.currentChoiceAnnotationIndex}` );

    this.queueNonlinearPlaylistItemsFromChoiceLink( $clicked );
  }

  _initChoiceEvents() {
    this.Events = {
      "presentChoice": ( event ) => {
        // toFixed works around a Firefox bug but makes it slightly less accurate
        // TODO: Maybe detect Firefox and implement this conditionally? But then inconsistent playback experience.
        // Imprecision may not matter if it's going to be an overlay onto bg video.
        const $videoPlayer = event.target; // this
        const currentTime = +$videoPlayer.currentTime.toFixed( 0 );
        const currentDuration = +$videoPlayer.duration.toFixed( 0 );

        if ( currentTime === currentDuration ) {
          this.log( 'choice presented' );

          if ( this.$.currentChoice ) {
            this.$.currentChoice.hidden = false;
          }

          // TODO: This could stay here if there were a reliable way to dynamically re-attach (not saying there isn't; just not sure why it's not already happpening)
          $videoPlayer.removeEventListener( 'timeupdate', this.Events.presentChoice, false );
        }
      },

      "choiceClicked": ( event ) => {
        event.preventDefault();

        let $clicked = event.target as HTMLElement | null;
        let nodeName = $clicked!.nodeName.toLowerCase();

        /**
         * Prevent clicks on `a > span`, etc. from following the link,
         * as it’s the anchor element that contains the navigation instructions.
         */
        if ( nodeName !== 'a' ) {
          while (
            $clicked
            && ( $clicked !== event.currentTarget )
            && ( nodeName !== 'a' )
          ) {
            $clicked = $clicked.parentElement;

            if ( $clicked ) {
              nodeName = $clicked.nodeName.toLowerCase();
            } else {
              throw new TypeError( `A choice was clicked, but neither it nor its ancestors were \`a\` elements.` );
            }
          }
        }

        if ( nodeName === 'a' ) {
          this.handleChoice( $clicked as HTMLAnchorElement );
        }
      },
    };
  }

  _registerChoiceEvents() {
    if ( this.isNonlinear() ) {
      this.$.localMedia?.addEventListener(
        'timeupdate',
        this.Events.presentChoice,
        false,
      );
    }

    this.$.annotations?.addEventListener(
      'click',
      this.Events.choiceClicked,
      false,
    );
  }

  constructor() {
    super();

    this.bufferTypes = {
      'webm': 'video/webm; codecs="vorbis,vp8"',
      'mp4': 'video/mp4; codecs="avc1.42E01E,mp4a.40.2"',
    };

    this.mimeTypes = {
      'webm': 'video/webm',
      'mp4': 'video/mp4',
    };

    // this.DEBUG_MODE = true;
    this.DEBUG_MEDIA = 'webm';
    this.DEBUG_BUFFER_TYPE = this.bufferTypes[this.DEBUG_MEDIA];
    this.DEBUG_MIME_TYPE = this.mimeTypes[this.DEBUG_MEDIA];

    // this.POLLING_INTERVAL = 1000, // 1 second
    // this.POLLING_INTERVAL = 41.66666666667, // 1/24 second
    // this.POLLING_INTERVAL = 33.33333333333, // 1/30 second
    // this.POLLING_INTERVAL = 20.83333333333, // 1/48 second
    this.POLLING_INTERVAL = 16.66666666667; // 1/60 second

    // Past this point, errors: second video gets appended twice, third not at all, because shit is not ready
    // this.POLLING_INTERVAL = 8.33333333333; // 1/120 second
    // this.POLLING_INTERVAL = 1; // 1/1000 second

    this.duration = 0;

    // @ts-ignore - Init
    this.$ = {};

    this.firstChoiceSelected = false;

    this.firstSegmentAppended = false;
    this.lastSegmentAppended = false;

    // TODO: make pluggable with custom XHR methods
    // this.XHR = {
    //   "GET": ( url, type, callback ) => {
    //     this.log( '--XHR.GET()--' );

    //     var xhr = new XMLHttpRequest();
    //     xhr.open( 'GET', url, true );
    //     xhr.responseType = 'arraybuffer';
    //     xhr.send();

    //     xhr.onload = ( event ) => {
    //       if ( xhr.status !== 200 ) {
    //         this.log( "Unexpected status code " + xhr.status + " for " + url );
    //         return false;
    //       }
    //       callback( new Uint8Array( xhr.response ), type );
    //     };
    //   }
    // };

    // TODO: Avoid falling out of sync:
    // Option A.) delete RedBlue.cachingStrategy;
    // Option B.) observe property changes

    this.embedID = ( new Date().getTime() );
    this.$template = this.parseHTML(
      RedBlueVideo.template
        .replace( 'id="embedded-media"', `id="embedded-media-${this.embedID}"` )
        .replace( 'id="local-media"', `id="local-media-${this.embedID}"` ),
    ).children.namedItem( RedBlueVideo.is ) as HTMLTemplateElement;
    this.mediaQueue = [];
    // TODO: this.mediaQueueHistory = [];
    this._isNonlinear = false;

    this.MISSING_XML_PARSER_ERROR = 'Can’t process; XML mixin class has not been applied.';
    this.MISSING_JSONLD_PARSER_ERROR = 'Can’t process; JSON-LD mixin class has not been applied.';
    this.MISSING_HVML_PARSER_ERROR = 'Can’t process; neither XML nor JSON-LD mixin classes have been applied';
    this.YOUTUBE_VIDEO_REGEX = /^(?:https?:)?\/\/(?:www\.)?youtube\.com\/watch\?v=([^&?]+)/i;
    this.YOUTUBE_DOMAIN_REGEX = /^(?:(?:https?:)?\/\/)?(?:www\.)?youtube\.com/i;
    this.VIMEO_VIDEO_REGEX = /^(?:https?:)?\/\/(?:www\.)?vimeo\.com\/([^/]+)/i;
    this.VIMEO_DOMAIN_REGEX = /^(?:(?:https?:)?\/\/)?(?:www\.)?vimeo\.com/i;
  } // constructor

  isNonlinear() {
    return this._isNonlinear;
  }

  hasAttributeAnyNS( $element: $Element, attribute: string ): boolean {
    if ( !$element ) {
      return false;
    }

    const attributeParts = attribute.split( ':' );

    if ( attributeParts.length > 1 ) { // Has namespace
      const namespace = attributeParts[0];
      const localName = attributeParts[1];

      if ( this.hostDocument.isXHTML() ) {
        if ( RedBlueVideo.NS.hasOwnProperty( namespace ) ) {
          return ( $element as HTMLElement ).hasAttributeNS( RedBlueVideo.NS[namespace], localName );
        }

        throw new Error(
          `Can’t check if <${$element.nodeName.toLowerCase()}> has attribute “${attribute}”: no namespace URI defined in \`RedBlueVideo.NS\` for “${namespace}”`,
        );
      }
    }

    // Non-namespace-aware
    return $element.hasAttribute( attribute );
  }

  getAttributeAnyNS( $element: $Element, attribute: string ) {
    const attributeParts = attribute.split( ':' );

    if ( attributeParts.length > 1 ) { // Has namespace
      const namespace = attributeParts[0];
      const localName = attributeParts[1];

      if ( this.hostDocument.isXHTML() ) {
        if ( RedBlueVideo.NS.hasOwnProperty( namespace ) ) {
          return $element.getAttributeNS( RedBlueVideo.NS[namespace], localName );
        }

        throw new Error(
          `Can’t get attribute “${attribute}” from <${$element.nodeName.toLowerCase()}>: no namespace URI defined in \`RedBlueVideo.NS\` for “${namespace}”`,
        );
      }
    }

    // Non-namespace-aware
    return $element.getAttribute( attribute );
  }

  _getXPathFromXPointerURI( uri: string ) {
    return uri.replace( /#xpointer\(([^)]+)\)/i, '$1' );
  }

  getMimeTypeFromFileElement( $fileElement: $Element ) {
    const container = this.find( './/container/mime/text()', $fileElement ).snapshotItem( 0 );
    const videoCodec = this.find( './/codec[@type="video"]/mime/text()', $fileElement ).snapshotItem( 0 );
    const audioCodec = this.find( './/codec[@type="audio"]/mime/text()', $fileElement ).snapshotItem( 0 );
    const ambiguousCodec = this.find( './/codec[not(@type)]/mime/text()' ).snapshotItem( 0 );

    let mimeType = '';
    const codecs = [];

    if ( container ) {
      mimeType += container.textContent;

      if ( videoCodec ) {
        codecs.push( videoCodec.textContent );
      }

      if ( audioCodec ) {
        codecs.push( audioCodec.textContent );
      }

      if ( codecs.length ) {
        mimeType += `; codecs=${codecs.join( ',' )}`;
      }
    } else if ( ambiguousCodec ) {
      mimeType += ambiguousCodec.textContent;
    }

    return mimeType;
  }

  fetchMedia( mediaQueueObject: MediaQueueObject ) {
    /* {
      "mime": 'video/webm',
      "path": '/foo/bar',
    }; */

    fetch(
      mediaQueueObject.path,
      {
        "method": "GET",
        // "headers": {
        //   "Content-Type": mediaQueueObject.mime.split( ';' )[0],
        // },
        "cache": "force-cache",
      },
    )
      .then( ( /* response */ ) => {
        // this.log( 'response', response );
      } )
      .catch( ( error ) => {
        console.error( error );
      } );
  }

  _handleMediaFromFileElements( xpath: string, callback:  MediaQueueObjectCallback ) {
    // TODO: Check if xpath is actually searching for a file element

    const fileElements = this.find( xpath );

    for ( let index = 0; index < fileElements.snapshotLength; index++ ) {
      const fileElement = fileElements.snapshotItem( index )!;
      const mimeType = this.getMimeTypeFromFileElement( fileElement );

      if ( fileElement.nodeName.toLowerCase() !== 'file' ) {
        throw new TypeError( `\`_handleMediaFromFileElements#xpath\` must exclusively resolve to HVML \`file\` elements.` );
      }

      if ( !this.hasAttributeAnyNS( fileElement, 'xlink:href' ) ) {
        throw new TypeError( `\`_handleMediaFromFileElements#xpath\` must exclusively resolve to HVML \`file\` elements containing \`xlink:href\` attributes.` );
      }

      const mediaQueueObject: MediaQueueObject = {
        // 'type': 'media',
        "mime": mimeType,
        "path": this.getAttributeAnyNS( fileElement, 'xlink:href' )!,
      };

      if ( /^image\/.*/i.test( mimeType ) ) {
        callback( mediaQueueObject );
      } else if ( this.$.localMedia?.canPlayType( mimeType ) ) {
        callback( mediaQueueObject );
        break;
      } else {
        throw new RangeError( `this._handleMediaFileFromElements` );
      }
    }
  }

  queueMediaFromFileElements( xpath: string ) {
    this._handleMediaFromFileElements(
      xpath,
      // this.mediaQueue.push.bind( this )
      ( mediaQueueObject: MediaQueueObject ) => {
        this.mediaQueue.push( mediaQueueObject );
      },
    );
  }

  fetchMediaFromFileElements( xpath: string ) {
    this._handleMediaFromFileElements(
      xpath,
      this.fetchMedia.bind( this ),
    );
  }

  _handleMediaFromMediaElement( $mediaElement: $Element, callback: ( xpath: string ) => void ) {
    if ( this.hasAttributeAnyNS( $mediaElement, 'xlink:href' ) ) {
      const xpath = this._getXPathFromXPointerURI(
        this.getAttributeAnyNS( $mediaElement, 'xlink:href' )!,
      );

      callback( xpath );
    }
  }

  queueMediaFromMediaElement( $mediaElement: $Element ) {
    this._handleMediaFromMediaElement(
      $mediaElement,
      this.queueMediaFromFileElements.bind( this ),
    );
  }

  fetchMediaFromMediaElement( $mediaElement: $Element ) {
    this._handleMediaFromMediaElement(
      $mediaElement,
      this.fetchMediaFromFileElements.bind( this ),
    );
  }

  _handleMediaFromPlaylistItem(
    $playlistItem: $Element,
    mediaCallback: MediaElementCallback,
    choicePromptCallback?: MediaElementCallback,
  ) {
    const nodeName = $playlistItem.nodeName.toLowerCase();
    let $mediaElementsForChoicePrompt;

    if ( !choicePromptCallback ) {
      choicePromptCallback = mediaCallback;
    }

    switch ( nodeName ) {
      case 'media':
        mediaCallback( $playlistItem );
        break;

      case 'choiceprompt':
        $mediaElementsForChoicePrompt = this.find( './/media', $playlistItem );

        for ( let index = 0; index < $mediaElementsForChoicePrompt.snapshotLength; index++ ) {
          const $mediaElement = $mediaElementsForChoicePrompt.snapshotItem( index )!;

          choicePromptCallback( $mediaElement );
        }
        break;

      default:
    }
  }

  queueMediaFromPlaylistItem( $playlistItem: $Element ) {
    this._handleMediaFromPlaylistItem(
      $playlistItem,
      this.queueMediaFromMediaElement.bind( this ),
    );
  }

  fetchMediaFromPlaylistItem( $playlistItem: $Element ) {
    this._handleMediaFromPlaylistItem(
      $playlistItem,
      this.fetchMediaFromMediaElement.bind( this ),
    );
  }

  populateDescription() {
    // this.$.description
    const descriptionResult = this.find( '//description[1]' );

    if ( descriptionResult && descriptionResult.snapshotLength ) {
      let $description = descriptionResult.snapshotItem( 0 )!;

      if ( !this.$.description ) {
        throw new ReferenceError( `populateDescription(): \`this.$.description\` not cached; make sure element with \`id="description"\` exists in template.` );
      }

      switch ( $description.getAttribute( 'type' ) ) {
        case 'xhtml':
          let divResult = this.find( 'html:div[1]', $description );

          if ( divResult && divResult.snapshotLength ) {
            const $div = divResult.snapshotItem( 0 )!;

            for ( let index = 0; index < $div.children.length; index++ ) {
              const $Element = $div.children[index];
              this.$.description.appendChild( $Element );
            }
          } else {
            console.error( 'Found HVML `description` with `type` attribute set to `xhtml`, but no HTML `div` child found.' );
          }
          break;

        case 'text':
        default:
          this.$.description.textContent = $description.textContent;
      }
    }
  }

  connectedCallback() {
    this.setAttribute( 'class', 'redblue-video' );
    this.setAttribute( 'role', 'application' );

    const cachingStrategy = this.getAttribute( 'caching-strategy' );

    switch ( cachingStrategy ) {
      case 'preload':
        this.cachingStrategy = RedBlueVideo.cachingStrategies.PRELOAD;
        break;

        // case 'predictive':
        // break;

      case 'lazy':
      default:
        this.cachingStrategy = RedBlueVideo.cachingStrategies.LAZY;
    }

    this.debug = this.hasAttribute( 'debug' );

    // https://stackoverflow.com/a/32928812/214325
    if ( this.debug ) {
      this.log = console.log.bind( window.console );
    } else {
      this.log = function noop() {};
    }

    let shadowRoot: ShadowRoot;

    if ( !this.shadowRoot ) {
      shadowRoot = this.attachShadow( {
        "mode": ( this.debug ? "open" : "closed" ),
      } );

      shadowRoot.appendChild(
        document.importNode( this.$template.content, true ),
      );
    } else {
      shadowRoot = this.shadowRoot;
    }

    // this.$   = {};
    this.$$ = shadowRoot.querySelector.bind( shadowRoot );
    this.$$$ = shadowRoot.querySelectorAll.bind( shadowRoot );
    this.$id = shadowRoot.getElementById.bind( shadowRoot );

    if ( this.hostDocument.isPlainHTML() ) {
      /*
        Workaround for namespace-unaware XPath queries.
        -----------------------------------------------
        - In XHTML, we can do `//foo[@xml:id]`.
        - In HTML, we have to do `//foo[@*[local-name() = 'xml:id']]`.

        But for some reason, combinatorial queries work differently.
        In XHTML, we can do `//foo[@xml:id="bar"]`.
        In HTML, we *should* be able to do
          `//foo[@*[local-name() = 'xml:id' and text() = 'bar']]`
        …but this do not work with `document.evaluate` in either Chrome or Firefox.

        With the following we can just query light DOM children
        using `getElementById` and `querySelectorAll`.
      */
      this.querySelectorAll( '[xml\\:id]' ).forEach( ( $lightDomChild ) => {
        if ( !$lightDomChild.id && $lightDomChild.hasAttribute( 'xml:id' ) ) {
          $lightDomChild.id = $lightDomChild.getAttribute( 'xml:id' )!;
        }

        // qsa += ', [xlink\\:href]'
        // if ( $lightDomChild.hasAttribute( 'xlink:href' ) ) {
        //   $lightDomChild.dataset.xlinkHref = $lightDomChild.getAttribute( 'xlink:href' );
        // }
      } );
    }

    // Cached elements
    this.$.fullscreenButton = this.$id<HTMLButtonElement>( 'fullscreen-button' );

    if ( this.$.fullscreenButton ) {
      this.$.fullscreenButton.addEventListener( 'click', this.toggleFullscreen.bind( this ) );
    }

    this.$.fullscreenContext = this.$id<HTMLDivElement>( 'fullscreen-context' );
    this.$.annotations = this.$id( 'annotations' );
    this.$.style = this.$$<HTMLStyleElement>( 'style' );
    this.stylesheetRules = this.$.style?.sheet?.cssRules || this.$.style?.sheet?.rules;

    // The order here is important
    this.loadData();
    this.annotations = this.getAnnotations();
    this.log( `annotations - ${this._hvmlParser}`, this.annotations );
    this.resolveCSSNamespacePrefix().then( ( prefix ) => {
      this._cssNamespacePrefix = prefix;
      this.log( 'this._cssNamespacePrefix', this._cssNamespacePrefix );
      this.setupAnimations();
    } );
    this.createHotspots();
    this.timelineTriggers = this.getTimelineTriggers();
    this.$.embeddedMedia = this.$id<HTMLIFrameElement>( `embedded-media-${this.embedID}` );
    this.$.localMedia = this.$id<HTMLVideoElement>( `local-media-${this.embedID}` );
    this.$.description = this.$id<HTMLDivElement>( 'description' );
    this.populateDescription();
    this.currentChoiceAnnotationIndex = 0;
    this.$.currentChoice = ( this.$.annotations?.children[0] as HTMLElement | undefined ) || null;

    try {
      const embedUri = this.getEmbedUri();

      if ( this.YOUTUBE_DOMAIN_REGEX.test( embedUri ) ) {
        this.log( 'youtube' );
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
          `origin=${encodeURIComponent( window.location.origin )}`,
        ].join( '&amp;' )}`;

        if ( this.$.embeddedMedia ) {
          this.$.embeddedMedia.hidden = false;
          this.$.embeddedMedia.src = embedUri + this.embedParameters;
        }

        this.setUpYouTubeIframeAPI();
      } else if ( this.VIMEO_DOMAIN_REGEX.test( this.$.embeddedMedia?.src || '' ) ) {
        this.log( 'vimeo' );
        // @todo: Handle Vimeo videos
      }
    } catch ( error ) {
      console.warn( error );

      try {
        const nonlinearPlaylist = this.getNonlinearPlaylist();
        const nonlinearPlaylistChildren = (
          Array.from( nonlinearPlaylist.childNodes )
            .filter( ( childNode ) => childNode.nodeType === Node.ELEMENT_NODE )
        );

        if ( this.$.localMedia ) {
          this.$.localMedia.hidden = false;
        }

        this._isNonlinear = !!nonlinearPlaylist;

        // No need to if-guard with isNonlinear() since the
        // try block will fail if getNonlinearPlaylist() throws
        this._initChoiceEvents(); // FIXME: potentially applies to linear video with annotations
        this._registerChoiceEvents();

        // Cache playlist media
        switch ( this.cachingStrategy ) {
          case RedBlueVideo.cachingStrategies.PRELOAD:
            nonlinearPlaylistChildren.forEach( ( $playlistItem ) => this.fetchMediaFromPlaylistItem( $playlistItem ) );
            break;

          default:
        }

        // Queue playlist media
        for ( let index = 0; index < nonlinearPlaylistChildren.length; index++ ) {
          const $playlistItem = nonlinearPlaylistChildren[index];

          this._handleMediaFromPlaylistItem(
            $playlistItem,

            /*
              mediaCallback:
              If we have media tha
            */
            ( $mediaElement ) => {
              if ( this.cachingStrategy === RedBlueVideo.cachingStrategies.LAZY ) {
                this.fetchMediaFromMediaElement( $mediaElement );
              }

              this.queueMediaFromMediaElement( $mediaElement );
            },

            /*
              choicePromptCallback:
              If we have a choice prompt (<choicePrompt>),
              get its background image/video (direct <media> child),
              then break the loop so we aren’t queuing up the media for
              every possible story branch.
            */
            ( $mediaElement ) => {
              if ( this.cachingStrategy === RedBlueVideo.cachingStrategies.LAZY ) {
                this.fetchMediaFromMediaElement( $mediaElement );
              }

              this.queueMediaFromMediaElement( $mediaElement );
              index = nonlinearPlaylistChildren.length;
            },
          );
        }

        this.log( 'this.mediaQueue', this.mediaQueue );
      } catch ( playlistError ) {
        console.warn( playlistError );

        // const playlist = this.getPlaylist();
      }
    }
  } // connectedCallback

  // https://developer.mozilla.org/en-US/docs/Web/API/Fullscreen_API
  toggleFullscreen() {
    if ( document.fullscreenElement ) {
      document.exitFullscreen();
    } else if ( document.webkitFullscreenElement ) {
      document.webkitExitFullscreen();
    } else if ( document.mozFullScreenElement ) {
      document.mozCancelFullScreen();
    // -------------------------------------------------------------------------
    } else if ( 'requestFullscreen' in this.$.fullscreenContext ) {
      this.$.fullscreenContext.requestFullscreen();
    } else if ( 'webkitRequestFullscreen' in this.$.fullscreenContext ) {
      this.$.fullscreenContext.webkitRequestFullscreen();
    } else if ( 'mozRequestFullScreen' in this.$.fullscreenContext ) {
      this.$.fullscreenContext.mozRequestFullScreen();
    }
  }

  async resolveCSSNamespacePrefix() {
    if ( !this.hvml ) {
      return null;
    }

    switch ( this._hvmlParser ) {
      case 'xml':
        if ( !this.hasXMLParser ) {
          throw new ReferenceError( this.MISSING_XML_PARSER_ERROR );
        }
        return this.resolveCSSNamespacePrefixFromXML();

      case 'json-ld':
        if ( !this.hasJSONLDParser ) {
          throw new ReferenceError( this.MISSING_JSONLD_PARSER_ERROR );
        }
        return this.resolveCSSNamespacePrefixFromJSONLD();

      default:
        throw new ReferenceError( this.MISSING_HVML_PARSER_ERROR );
    }
  }

  // eslint-disable-next-line default-param-last
  applyAnnotationStyles( loopObject: Annotation[] = this.annotations, parentIndex?: number ) {
    const stylesheet = this.$.style.sheet;

    for ( let annotationIndex = 0; annotationIndex < loopObject.length; annotationIndex++ ) {
      const annotation = loopObject[annotationIndex];

      if ( annotation.type === 'choicePrompt' ) {
        this.applyAnnotationStyles( annotation.choices, annotationIndex );
      } else {
        const animation = loopObject[annotationIndex].goto.animate;
        const animationLength = ( animation.length || 1 );

        for ( let animateIndex = 0; animateIndex < animationLength; animateIndex++ ) {
          const animate = animation[animateIndex];

          if ( animateIndex === 0 ) {
            let styleProperties = '';
            let compoundIndex = annotationIndex;

            for ( const attribute in annotation.goto ) {
              switch ( attribute ) {
                case 'height':
                case 'width':
                case 'top':
                case 'right':
                case 'bottom':
                case 'left':
                  styleProperties += `${attribute}: ${annotation.goto[attribute]};\n`;
                  break;

                default: {
                  const cssAttributeRegex = new RegExp( `^${this._cssNamespacePrefix}:([^=]+)`, 'i' );
                  const cssAttribute = attribute.match( cssAttributeRegex );

                  if ( cssAttribute ) {
                    styleProperties += `${cssAttribute[1]}: ${annotation.goto[attribute]};`;
                  }
                }
              }
            }

            if ( typeof parentIndex !== 'undefined' ) {
              compoundIndex = `${parentIndex}-${annotationIndex}`;
            }

            const rule = `
            .redblue-annotations__link.redblue-annotations__link--${compoundIndex} {
              ${styleProperties}
              ${animate ? `transition: ${animate.endTime - animate.startTime}s bottom linear;` : ''}
            }`;

            stylesheet.insertRule( rule, ( this.stylesheetRules.length ) );

            if ( animate ) {
              stylesheet.insertRule( `
                .redblue-annotations__link.redblue-annotations__link--${compoundIndex}-start {
                  left: ${animate.startX};
                  bottom: ${animate.startY};
                }`, ( this.stylesheetRules.length ) );

              stylesheet.insertRule( `
                .redblue-annotations__link.redblue-annotations__link--${compoundIndex}-animate-${animateIndex}-end {
                  left: ${animate.startX};
                  bottom: ${animate.endY};
                }`, ( this.stylesheetRules.length ) );
            }
          } // if animateIndex === 0
        }
      } // for
    }
  }

  setupAnimations() {
    if ( !this.annotations || !this.annotations.length ) {
      return false;
    }

    this.applyAnnotationStyles();

    return true;
  }

  parseHTML( string: string ) {
    return document.createRange().createContextualFragment( string );
  }

  initializeYoutubePlayer() {
    this.player = new window.YT.Player( this.$.embeddedMedia, {
      "events": {
        "onReady": this.onPlayerReady.bind( this ),
        "onStateChange": this.onStateChange.bind( this ),
      },
    } );

    document.addEventListener( 'keydown', ( event ) => {
      switch ( event.key ) {
        case 'm':
          this.log( this.player.getCurrentTime() );
          break;

        default:
      }
    } );
  }

  setUpYouTubeIframeAPI() {
    /*
      YouTube Player API:
      • Embedded players must have a viewport that is at least 200px by 200px.
      • If the player displays controls, it must be large enough to fully
        display the controls without shrinking the viewport below the minimum size.
      • We recommend 16:9 players be at least 480 pixels wide and 270 pixels tall.
    */
    if ( !( 'onYouTubeIframeAPIReady' in window ) ) {
      const tag = document.createElement( 'script' );
      tag.id = 'youtube-iframe-api';
      tag.src = '//www.youtube.com/iframe_api';
      tag.async = true;
      const firstScriptTag = document.getElementsByTagName( 'script' )[0];
      firstScriptTag.parentNode.insertBefore( tag, firstScriptTag );

      window.onYouTubeIframeAPIReady = () => {
        this.initializeYoutubePlayer();
      };
    } else {
      /* eslint-disable vars-on-top */
      if ( this.debug ) {
        var time = ( new Date() ).getTime();
        var counter = 0;
      }
      /* eslint-enable vars-on-top */
      const interval = setInterval( () => {
        if ( ( 'YT' in window ) && window.YT.Player ) {
          clearInterval( interval );
          this.initializeYoutubePlayer();
          this.log( `YouTube Iframe API found after ${counter} tries in ${( new Date() ).getTime() - time} seconds` );
        }
        if ( this.debug ) {
          counter++;
        }
      }, 0 );
      // Kill the check for YT after n minutes
      setTimeout( () => {
        clearInterval( interval );
        if ( this.debug ) {
          console.error( `Couldn’t find YouTube Iframe API after ${counter} tries in ${( new Date() ).getTime() - time} seconds'` );
        } else {
          console.error( `Couldn’t find YouTube Iframe API` );
        }
      }, ( 1000 * 60 * 2.5 ) ); // 2 minutes 30 seconds
    }
  }

  onPlayerReady( /* event */ ) {
    this.log( 'ready' );
    this.$.embeddedMedia.style.borderColor = '#FF6D00';
    this.player.mute();
  }

  onStateChange() {
    this.log( 'statechange' );
    requestAnimationFrame( this.updateUIOnYoutubePlayback.bind( this ) );
  }

  addLeadingZeroes( number ) {
    return number.toString().padStart( 2, '0' );
  }

  // http://aphall.com/2014/03/animate-video-sync/
  // the youtube API sends no events at all on seek,
  // so unfortunately we have to poll the video if
  // we want to react to when the user seeks manually. :(
  updateUIOnYoutubePlayback() {
    if ( this.player && this.player.getCurrentTime ) {
      // Returns the elapsed time in seconds since the video started playing
      const time = this.player.getCurrentTime(); /* * 1000 */
      const state = this.player.getPlayerState();

      // https://stackoverflow.com/a/9882349/214325
      switch ( state ) {
        case window.YT.PlayerState.PLAYING:
          for ( let startTime in this.timelineTriggers ) {
            startTime = parseFloat( startTime );
            const trigger = this.timelineTriggers[startTime];
            const { endTime } = trigger;
            let totalAnimations = this.annotations[trigger.annotationIndex].goto.animate.length;

            if ( ( time >= startTime ) && ( time <= endTime ) && !trigger.$ui.classList.contains( trigger.endClass ) ) {
              this.log( '---------' );
              const drift = Math.abs( time - trigger.startTime );

              if ( trigger.animateIndex == 0 ) {
                trigger.$ui.classList.remove( trigger.startClass );
              } else {
                trigger.$ui.classList.remove( trigger.previousEndClass );
              }

              trigger.$ui.classList.add( trigger.endClass );

              this.log( `Starting annotation #${trigger.annotationIndex}, transition #${trigger.animateIndex} at: `, time );
              this.log( 'Should be: ', trigger.startTime );
              this.log( 'Drift: ', drift );

              if ( trigger.animateIndex == ( totalAnimations - 1 ) ) {
                const transitionDuration = parseFloat( getComputedStyle( trigger.$ui ).getPropertyValue( 'transition-duration' ).slice( 0, -1 ) );

                this.log( '---------' );
                this.log( 'No more animations' );
                this.log( 'this.annotations', this.annotations );

                setTimeout( () => {
                  this.log( 'timeout' );

                  // Remove all previous animate classes
                  while ( totalAnimations-- ) {
                    trigger.$ui.classList.remove(
                      trigger.endClass.replace( /animate-[0-9]+-/, `animate-${totalAnimations}-` ),
                    );
                  }

                  trigger.$ui.classList.add( trigger.startClass );
                }, transitionDuration * 1000 );
              }
            }
          }
          break;

        case window.YT.PlayerState.PAUSED:
          // this.log( 'not playing' );

          break;

        default:
      }
    }

    requestAnimationFrame( this.updateUIOnYoutubePlayback.bind( this ) );
  }

  /**
   * Load HVML annotations from the player’s Light DOM children.
   */
  loadData() {
    for ( let i = 0; i < this.children.length; i++ ) {
      const child = this.children[i];

      switch ( child.nodeName.toLowerCase() ) {
        case 'hvml':
          this.hvml.xml = child;
          this._hvmlParser = 'xml';
          return;

        case 'script':
          if ( child.hasAttribute( 'type' ) && ( child.type === 'application/ld+json' ) ) {
            this.hvml.jsonLD = JSON.parse( child.textContent );
            this._hvmlParser = 'json-ld';
            return;
          }
          throw new TypeError( '<script> elements must contain JSON-LD data. If this is what you have, please set the `type` attribute to "application/ld+json"` to make this explicit.' );

        default:
      } // switch
    } // for

    this.log( 'No <hvml> or <script> elements found.' );
  }

  getEmbedUri() {
    let youtubeUrl = this.find( `.//showing[@scope="release"]/venue[@type="site"]/uri[contains(., '//www.youtube.com/watch?v=')]/text()` );

    if ( youtubeUrl && youtubeUrl.snapshotLength ) {
      youtubeUrl = youtubeUrl.snapshotItem( 0 );
      return youtubeUrl.textContent.replace( this.YOUTUBE_VIDEO_REGEX, `//www.youtube.com/embed/$1${this.embedParameters || ''}` );
    }

    throw new Error( 'No Embed URL found' );
  }

  getNonlinearPlaylist() {
    const nonlinearPlaylistResult = this.find( `.//presentation/playlist[@type="nonlinear"]` );

    if ( nonlinearPlaylistResult && nonlinearPlaylistResult.snapshotLength ) {
      const nonlinearPlaylist = nonlinearPlaylistResult.snapshotItem( 0 )!;
      return nonlinearPlaylist;
    }

    throw new Error( 'No nonlinear playlists found' );
  }

  createHotspots() {
    if ( !this.annotations || !this.annotations.length ) {
      return false;
    }

    for ( let i = 0; i < this.annotations.length; i++ ) {
      const annotation = this.annotations[i];

      this.createHotspot( annotation, i );
    }

    return true;
  }

  createHotspot( annotation: Annotation, index: number | string, $target = this.$.annotations ) {
    let $annotation;
    let backgroundMedia;
    const stylesheet = this.$.style.sheet;
    let id;

    console.log( annotation );

    if ( annotation['xml:id'] ) {
      id = annotation['xml:id'];
    } else if ( annotation.id ) {
      id = annotation.id;
    } else {
      id = `annotation-${index}`;
    }

    switch ( annotation.type ) {
      case 'choicePrompt':
        backgroundMedia = this.find(
          this._getXPathFromXPointerURI(
            annotation.media['xlink:href'],
          ),
        );

        stylesheet.insertRule( `
          .redblue-annotations__choices {
            color: white;
            background-color: black;
            background-size: contain;
            z-index: 1;
            position: absolute;
            width: 100%;
            height: 100%;
          }
        `, this.stylesheetRules.length );

        for ( let i = 0; i < backgroundMedia.snapshotLength; i++ ) {
          const $fileElement = backgroundMedia.snapshotItem( i );

          // TODO: if ( supportsImageFormat() ) {
          stylesheet.insertRule( `
            .redblue-annotations__choices.redblue-annotations__choices--${index} {
              background-image: url( '${this.getAttributeAnyNS( $fileElement, 'xlink:href' )}' );
            }
          `, this.stylesheetRules.length );
          // }
          // break;
        }

        $annotation = this.parseHTML(
          `<div
            id="annotation-${index}"
            class="redblue-annotations__choices redblue-annotations__choices--${index} redblue-annotations__choices--${index}-start"
            hidden="hidden"
            >
            <h2 class="redblue-prompt">${annotation.name}</h2>
          </div>`,
        );
        $target.appendChild( $annotation );

        for ( let i = 0; i < annotation.choices.length; i++ ) {
          const choice = annotation.choices[i];
          this.createHotspot( choice, `${index}-${i}`, this.$id( `annotation-${index}` ) );
        }
        break;

      case 'choice':
        $annotation = this.parseHTML(
          `<a
            id="${id}"
            data-index="${index}"
            class="redblue-annotations__link redblue-annotations__link--${index} redblue-annotations__link--${index}-start"
            href="${annotation.goto['xlink:href']}"
            target="_blank"
            >
              <span>${annotation.name}</span>
          </a>`,
        );
        $target.appendChild( $annotation );
        break;

      default:
        throw new TypeError( `Cannot create hotspot. Invalid annotation type \`${annotation.type}\`.` );
    }
  }

  mapAttributeToKeyValuePair( attribute ) {
    const object: Partial<Record<CamelCaseHvmlElements, string>> = {};
    object[RedBlueVideo.reCamelCase( attribute.nodeName ) ] = attribute.nodeValue;
    return object;
  }

  flattenKeyValuePairs( accumulator, keyValuePair ) {
    const key = Object.keys( keyValuePair )[0];
    const value = keyValuePair[key];

    accumulator[key] = value;

    return accumulator;
  }

  nodeAttributesToJSON( attributes ) {
    return Array.from( attributes ).map( this.mapAttributeToKeyValuePair ).reduce( this.flattenKeyValuePairs, {} );
  }

  getAnnotations() {
    if ( !this.hvml ) {
      return null;
    }

    switch ( this._hvmlParser ) {
      case 'xml':
        if ( !this.hasXMLParser ) {
          throw this.MISSING_XML_PARSER_ERROR;
        }
        return this.getAnnotationsFromXML();

      case 'json-ld':
        if ( !this.hasJSONLDParser ) {
          throw this.MISSING_JSONLD_PARSER_ERROR;
        }
        return this.getAnnotationsFromJSONLD();

      default:
        throw new TypeError( `Invalid or uninitialized HVML parser. Expected one of “xml” or “json-ld”; got “${this._hvmlParser}”` );
    } // switch
  } // getAnnotations

  getTimelineTriggers(): {} | Record<number, Annotation> {
    if ( !this.annotations ) {
      return null;
    }

    const triggers = {};

    for ( let annotationIndex = 0; annotationIndex < this.annotations.length; annotationIndex++ ) {
      const annotation = this.annotations[annotationIndex];

      if ( annotation.goto && annotation.goto.animate ) {
        for ( let animateIndex = 0, totalAnimations = annotation.goto.animate.length; animateIndex < totalAnimations; animateIndex++ ) {
          const animate = annotation.goto.animate[animateIndex];

          triggers[animate.startTime] = {
            ...animate,
            annotationIndex,
            animateIndex,
            "name": annotation.name,
            "$ui": this.$$( `#annotations [data-index="${annotationIndex}"]` ),
            "startClass": `redblue-annotations__link--${annotationIndex}-start`,
            "endClass": `redblue-annotations__link--${annotationIndex}-animate-${animateIndex}-end`,
          };

          if ( animateIndex > 0 ) {
            triggers[animate.startTime].previousEndClass = `redblue-annotations__link--animate-${animateIndex - 1}-end`;
          }
        }
      }
    }

    return triggers;
  }

  find( query: string, contextNode?: $Element ) {
    switch ( this._hvmlParser ) {
      case 'xml':
        if ( !this.hasXMLParser ) {
          throw new ReferenceError( this.MISSING_XML_PARSER_ERROR );
        }
        return this.findInXML!( query, contextNode ) as HTMLXPathResult;

      case 'json-ld':
        if ( !this.hasJSONLDParser ) {
          throw new ReferenceError( this.MISSING_JSONLD_PARSER_ERROR );
        }
        return this.findInJSONLD!( query/* , contextNode */ );

      default:
        throw new ReferenceError( this.MISSING_HVML_PARSER_ERROR );
    }
  }
};
