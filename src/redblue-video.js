'use strict';

const RedBlueVideo = class RedBlueVideo extends HTMLElement {
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
          <div class="redblue-description">
            <p>Full Facebook Live stream: http://hugh.today/2016-09-17/live</p>
            <p>#mfaNOW #mfaLateNites</p>
          </div>
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

  static reCamelCase( nodeName ) {
    const map = {
      "endtime": "endTime",
      "endx": "endX",
      "endy": "endY",
      "starttime": "startTime",
      "startx": "startX",
      "starty": "startY"
    };

    return ( map[nodeName] || nodeName );
  }

  get HVML_SOLO_ELEMENTS() {
    return [
      "presentation"
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
    }
  }

  getNonlinearPlaylistTargetIDfromChoiceLink( $choiceLink ) {
    let href;

    if ( $choiceLink.hasAttribute( 'href' ) ) {
      href = $choiceLink.getAttribute( 'href' );
      this.log( 'hasAttribute(href)', href );
    } else if ( this.hasAttributeAnyNS( $choiceLink, 'xlink:href' ) ) {
      // href = this._getXPathFromXPointerURI(
      //   this.getAttributeAnyNS( $clicked, 'xlink:href' )
      // );
      href = this.getAttributeAnyNS( $choiceLink, 'xlink:href' );
      this.log( 'hasAttributeAnyNS(href)', href );
    } else {
      throw new Error( 'Choice link has no `href` or `xlink:href` attribute; no action to perform.' );
    }

    if ( !/^#/i.test( href ) ) {
      throw new Error( 'Choice link’s href must be a valid CSS or XLink ID selector (i.e. it must start with a hash symbol)' );
    }

    href = href.slice( 1 );
    this.log( 'href', href );

    return href;
  }

  getNonlinearPlaylistTargetIDfromGoto( $goto ) {
    let href;

    if ( this.hasAttributeAnyNS( $goto, 'xlink:href' ) ) {
      href = this.getAttributeAnyNS( $goto, 'xlink:href' );
    } else {
      throw new Error( 'Goto has no `href` or `xlink:href` attribute; no action to perform.' );
    }

    if ( !/^#/i.test( href ) ) {
      throw new Error( 'Goto’s href must be a valid CSS or XLink ID selector (i.e. it must start with a hash symbol)' );
    }

    href = href.slice( 1 );

    return href;
  }

  getNonlinearPlaylistItemFromTargetID( id ) {
    let xpath;
    let $nextPlaylistItem;

    if ( this.hostDocument.isPlainHTML() ) {
      xpath = `//*[@id="${id}"]`;
    } else if ( this.hostDocument.isXHTML() ) {
      xpath = `//*[@xml:id="${id}"]`;
    }

    $nextPlaylistItem = this.find( xpath );

    if ( $nextPlaylistItem.snapshotLength ) {
      $nextPlaylistItem = $nextPlaylistItem.snapshotItem(0);
    } else {
      throw new Error( `No HVML elements found after following choice link to \`${xpath}\`` );
    }

    return $nextPlaylistItem;
  }

  getNonlinearPlaylistItemFromChoiceLink( $choiceLink ) {
    let id = this.getNonlinearPlaylistTargetIDfromChoiceLink( $choiceLink );
    return this.getNonlinearPlaylistItemFromTargetID( id );
  }

  queueNonlinearPlaylistItemsFromChoiceLink( $choiceLink ) {
    let $nextPlaylistItem = this.getNonlinearPlaylistItemFromChoiceLink( $choiceLink );

    if ( this.hasAttributeAnyNS( $nextPlaylistItem, 'xlink:href' ) ) {
      let fileXPath = this._getXPathFromXPointerURI(
        this.getAttributeAnyNS( $nextPlaylistItem, 'xlink:href' )
      );

      if ( this.cachingStrategy === RedBlueVideo.cachingStrategies.LAZY ) {
        this.fetchMediaFromFileElements( fileXPath );
      }

      this.queueMediaFromFileElements( fileXPath );

      let $goto = this.find( './/goto[1]', $nextPlaylistItem );

      if ( $goto.snapshotLength ) {
        $goto = $goto.snapshotItem(0);

        let targetID = this.getNonlinearPlaylistTargetIDfromGoto( $goto );
        let $playlistItem = this.getNonlinearPlaylistItemFromTargetID( targetID );

        this._handleMediaFromPlaylistItem(
          $playlistItem,
          ( $mediaElement ) => {
            if ( this.cachingStrategy === RedBlueVideo.cachingStrategies.LAZY ) {
              this.fetchMediaFromMediaElement( $mediaElement );
            }
  
            this.queueMediaFromMediaElement( $mediaElement );
          }
        );
      }
    }
  }

  handleChoice( $clicked ) {
    this.$.localMedia.addEventListener( 'timeupdate', this.Events.presentChoice, false );
    this.$.currentChoice.hidden = true;

    this.log( 'choice clicked' );

    let currentAnnotation = this.annotations[this.currentChoiceAnnotationIndex];
    let currentChoiceChoiceIndex = $clicked.dataset.index.split( '-' )[1];
    let timelineProperty = currentAnnotation.choices[currentChoiceChoiceIndex].goto.timeline;

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
        // @todo: Maybe detect Firefox and implement this conditionally? But then inconsistent playback experience.
        // Imprecision may not matter if it's going to be an overlay onto bg video.
        const $videoPlayer = event.target; // this
        const currentTime = +$videoPlayer.currentTime.toFixed(0);
        const currentDuration = +$videoPlayer.duration.toFixed(0);

        if ( currentTime === currentDuration ) {
          this.log( 'choice presented' );

          this.$.currentChoice.hidden = false;

          // TODO: This could stay here if there were a reliable way to dynamically re-attach (not saying there isn't; just not sure why it's not already happpening)
          $videoPlayer.removeEventListener( 'timeupdate', this.Events.presentChoice, false );
        }
      },

      "choiceClicked": ( event ) => {
        event.preventDefault();

        let $clicked = event.target;
        let nodeName = $clicked.nodeName.toLowerCase();

        // Prevent clicks on `a > span` from following the link
        if ( nodeName !== 'a' ) {
          while ( ( $clicked !== event.currentTarget ) && ( nodeName !== 'a' ) ) {
            $clicked = $clicked.parentNode;
            nodeName = $clicked.nodeName.toLowerCase();
          }
        }

        if ( nodeName === 'a' ) {
          this.handleChoice( $clicked );
        }
      },
    };
  }

  _registerChoiceEvents() {
    if ( this.isNonlinear() ) {
      this.$.localMedia.addEventListener(
        'timeupdate',
        this.Events.presentChoice,
        false
      );
    }

    this.$.annotations.addEventListener(
      'click',
      this.Events.choiceClicked,
      false
    );
  }

  constructor() {
    super();

    window.RedBlue = ( window.RedBlue || {} );

    this.bufferTypes = {
      'webm': 'video/webm; codecs="vorbis,vp8"',
      'mp4': 'video/mp4; codecs="avc1.42E01E,mp4a.40.2"'
    };

    this.mimeTypes = {
      'webm': 'video/webm',
      'mp4': 'video/mp4'
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

    this.$ = {
      "currentChoice": null,
    };
   
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

    switch ( RedBlue.cachingStrategy ) {
      case 'preload':
        this.cachingStrategy = RedBlueVideo.cachingStrategies.PRELOAD;
      break;

      // case 'predictive':
      // break;

      case 'lazy':
      default:
        this.cachingStrategy = RedBlueVideo.cachingStrategies.LAZY;
    }

    // TODO: Avoid falling out of sync:
    // Option A.) delete RedBlue.cachingStrategy;
    // Option B.) observe property changes

    this.embedID = ( new Date().getTime() );
    this.$template = this.parseHTML(
      RedBlueVideo.template
        .replace( 'id="embedded-media"', `id="embedded-media-${this.embedID}"` )
        .replace( 'id="local-media"', `id="local-media-${this.embedID}"` )
    ).children[RedBlueVideo.is];
    this.mediaQueue = [];
    // TODO: this.mediaQueueHistory = [];
    this._isNonlinear = false;

    this.MISSING_XML_PARSER_ERROR = 'Can’t process; XML mixin class has not been applied.';
    this.MISSING_JSONLD_PARSER_ERROR = 'Can’t process; JSON-LD mixin class has not been applied.';
    this.YOUTUBE_VIDEO_REGEX = /^(?:https?:)?\/\/(?:www\.)?youtube\.com\/watch\?v=([^&?]+)/i;
    this.YOUTUBE_DOMAIN_REGEX = /^(?:(?:https?:)?\/\/)?(?:www\.)?youtube\.com/i;
    this.VIMEO_VIDEO_REGEX = /^(?:https?:)?\/\/(?:www\.)?vimeo\.com\/([^\/]+)/i;
    this.VIMEO_DOMAIN_REGEX = /^(?:(?:https?:)?\/\/)?(?:www\.)?vimeo\.com/i;
  } // constructor

  isNonlinear() {
    return this._isNonlinear;
  }

  hasAttributeAnyNS( $element, attribute ) {
    const attributeParts = attribute.split( ':' );

    if ( attributeParts.length > 1 ) { // Has namespace
      const namespace = attributeParts[0];
      const localName = attributeParts[1];

      if ( this.hostDocument.isXHTML() ) {
        if ( RedBlueVideo.NS.hasOwnProperty( namespace ) ) {
          return $element.hasAttributeNS( RedBlueVideo.NS[namespace], localName );
        }

        throw new Error(
          `Can’t check if <${$element.nodeName.toLowerCase()}> has attribute “${attribute}”: no namespace URI defined in \`RedBlueVideo.NS\` for “${namespace}”`
        );
      }
    }

    // Non-namespace-aware
    return $element.hasAttribute( attribute );
  }

  getAttributeAnyNS( $element, attribute ) {
    const attributeParts = attribute.split( ':' );

    if ( attributeParts.length > 1 ) { // Has namespace
      const namespace = attributeParts[0];
      const localName = attributeParts[1];

      if ( this.hostDocument.isXHTML() ) {
        if ( RedBlueVideo.NS.hasOwnProperty( namespace ) ) {
          return $element.getAttributeNS( RedBlueVideo.NS[namespace], localName );
        }

        throw new Error(
          `Can’t get attribute “${attribute}” from <${$element.nodeName.toLowerCase()}>: no namespace URI defined in \`RedBlueVideo.NS\` for “${namespace}”`
        );
      }
    }

    // Non-namespace-aware
    return $element.getAttribute( attribute );
  }

  _getXPathFromXPointerURI( uri ) {
    return uri.replace( /#xpointer\(([^)]+)\)/i, '$1' );
  }

  getMimeTypeFromFileElement( fileElement ) {
    const container = this.find( './/container/mime/text()', fileElement ).snapshotItem(0);
    const videoCodec = this.find( './/codec[@type="video"]/mime/text()', fileElement ).snapshotItem(0);
    const audioCodec = this.find( './/codec[@type="audio"]/mime/text()', fileElement ).snapshotItem(0);
    const ambiguousCodec = this.find( './/codec[not(@type)]/mime/text()' ).snapshotItem(0);

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
        mimeType += `; codecs=${codecs.join( ', ' )}`;
      }
    } else if ( ambiguousCodec ) {
      mimeType += ambiguousCodec.textContent;
    }

    return mimeType;
  }

  fetchMedia( mediaQueueObject ) {
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
      }
    )
      .then( ( response ) => {
        // this.log( 'response', response );
      } )
      .catch( ( error ) => {
        console.error( error );
      } )
    ;
  }

  _handleMediaFromFileElements( xpath, callback ) {
    // TODO: Check if xpath is actually searching for a file element

    const fileElements = this.find( xpath );

    for ( let index = 0; index < fileElements.snapshotLength; index++ ) {
      const fileElement = fileElements.snapshotItem(index);
      const mimeType = this.getMimeTypeFromFileElement( fileElement );

      const mediaQueueObject = {
        //'type': 'media',
        "mime": mimeType,
        "path": this.getAttributeAnyNS( fileElement, 'xlink:href' ),
      };

      if ( /^image\/.*/i.test( mimeType ) ) {
        callback( mediaQueueObject );
      } else if ( this.$.localMedia.canPlayType( mimeType ) ) {
        callback( mediaQueueObject );
        break;
      }
    }
  }

  queueMediaFromFileElements( xpath ) {
    this._handleMediaFromFileElements(
      xpath,
      // this.mediaQueue.push.bind( this )
      mediaQueueObject => {
        this.mediaQueue.push( mediaQueueObject );
      },
    );
  }

  fetchMediaFromFileElements( xpath ) {
    this._handleMediaFromFileElements(
      xpath,
      this.fetchMedia.bind( this ),
    );
  }

  _handleMediaFromMediaElement( $mediaElement, callback ) {
    if ( this.hasAttributeAnyNS( $mediaElement, 'xlink:href' ) ) {
      const xpath = this._getXPathFromXPointerURI(
        this.getAttributeAnyNS( $mediaElement, 'xlink:href' )
      );

      callback( xpath );
    }
  }

  queueMediaFromMediaElement( $mediaElement ) {
    this._handleMediaFromMediaElement(
      $mediaElement,
      this.queueMediaFromFileElements.bind( this )
    );
  }

  fetchMediaFromMediaElement( $mediaElement ) {
    this._handleMediaFromMediaElement(
      $mediaElement,
      this.fetchMediaFromFileElements.bind( this )
    );
  }

  _handleMediaFromPlaylistItem( $playlistItem, mediaCallback, choicesCallback ) {
    const nodeName = $playlistItem.nodeName.toLowerCase();
    let $mediaElementsForChoicePrompt;

    if ( !choicesCallback ) {
      choicesCallback = mediaCallback;
    }

    switch ( nodeName ) {
      case 'media':
        mediaCallback( $playlistItem );
      break;

      case 'choices':
        $mediaElementsForChoicePrompt = this.find( './/media', $playlistItem );

        for ( let index = 0; index < $mediaElementsForChoicePrompt.snapshotLength; index++) {
          const $mediaElement = $mediaElementsForChoicePrompt.snapshotItem(index);

          choicesCallback( $mediaElement );
        }
      break;
    }
  }

  queueMediaFromPlaylistItem( $playlistItem ) {
    this._handleMediaFromPlaylistItem(
      $playlistItem,
      this.queueMediaFromMediaElement.bind( this )
    );
  }

  fetchMediaFromPlaylistItem( $playlistItem ) {
    this._handleMediaFromPlaylistItem(
      $playlistItem,
      this.fetchMediaFromMediaElement.bind( this )
    );
  }

  connectedCallback() {
    this.setAttribute( 'class', 'redblue-video' );
    this.setAttribute( 'role', 'application' );

    this.debug = this.hasAttribute( 'debug' );

    // https://stackoverflow.com/a/32928812/214325
    if ( this.debug ) {
      this.log = console.log.bind( window.console );
    } else {
      this.log = function () {};
    }

    if ( !this.shadowRoot ) {
      this.attachShadow( { "mode": "open" } );
      this.shadowRoot.appendChild(
        document.importNode( this.$template.content, true )
      );
    }

    // this.$   = {};
    this.$$  = this.shadowRoot.querySelector.bind( this.shadowRoot );
    this.$$$ = this.shadowRoot.querySelectorAll.bind( this.shadowRoot );
    this.$id = this.shadowRoot.getElementById.bind( this.shadowRoot );

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
          $lightDomChild.id = $lightDomChild.getAttribute( 'xml:id' );
        }

        // qsa += ', [xlink\\:href]'
        // if ( $lightDomChild.hasAttribute( 'xlink:href' ) ) {
        //   $lightDomChild.dataset.xlinkHref = $lightDomChild.getAttribute( 'xlink:href' );
        // }
      } );
    }

    // Cached elements
    this.$.fullscreenButton = this.$id( 'fullscreen-button' );
    this.$.fullscreenContext = this.$id( 'fullscreen-context' );
    this.$.fullscreenButton.addEventListener( 'click', this.toggleFullscreen.bind( this ) );
    this.$.annotations = this.$id( 'annotations' );
    this.$.style = this.$$( 'style' );
    this.stylesheetRules = ( this.$.style.sheet.cssRules || this.$.style.sheet.rules );

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
    this.$.embeddedMedia = this.$id( `embedded-media-${this.embedID}` );
    this.$.localMedia = this.$id( `local-media-${this.embedID}` );
    this.currentChoiceAnnotationIndex = 0;
    this.$.currentChoice = this.$.annotations.children[0];

    try {
      const embedUri = this.getEmbedUri();

      if ( this.YOUTUBE_DOMAIN_REGEX.test( embedUri ) ) {
        this.log( 'youtube' );
        this.embedParameters = '?' + [
          'rel=0',
          'showinfo=0',
          'start=517',
          'end=527',
          'enablejsapi=1',
          'controls=1',
          'modestbranding=1',
          'playsinline=1',
          'fs=0',
          `origin=${encodeURIComponent(window.location.origin)}`
        ].join( '&amp;' );
        this.$.embeddedMedia.hidden = false;
        this.$.embeddedMedia.src = embedUri + this.embedParameters;
        this.setUpYouTubeIframeAPI();
      } else if ( this.VIMEO_DOMAIN_REGEX.test( this.$.embeddedMedia.src ) ) {
        this.log( 'vimeo' );
        // @todo: Handle Vimeo videos
      }
    } catch ( error ) {
      console.warn( error );

      try {
        const nonlinearPlaylist = this.getNonlinearPlaylist();
        const nonlinearPlaylistChildren = Array.from( nonlinearPlaylist.children );

        this.$.localMedia.hidden = false;

        this._isNonlinear = !!nonlinearPlaylist;
        
        // No need to if-guard with isNonlinear() since the
        // try block will fail if getNonlinearPlaylist() throws
        this._initChoiceEvents(); // FIXME: potentially applies to linear video with annotations
        this._registerChoiceEvents();

        // Cache playlist media
        switch ( this.cachingStrategy ) {
          case RedBlueVideo.cachingStrategies.PRELOAD:
            nonlinearPlaylistChildren.forEach( $playlistItem =>
              this.fetchMediaFromPlaylistItem( $playlistItem )
            );
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
            $mediaElement => {
              if ( this.cachingStrategy === RedBlueVideo.cachingStrategies.LAZY ) {
                this.fetchMediaFromMediaElement( $mediaElement );
              }

              this.queueMediaFromMediaElement( $mediaElement );
            },

            /*
              choicesCallback:
              If we have a choice prompt (<choices>),
              get its background image/video (direct <media> child),
              then break the loop so we aren’t queuing up the media for
              every possible story branch.
            */
            $mediaElement => {
              if ( this.cachingStrategy === RedBlueVideo.cachingStrategies.LAZY ) {
                this.fetchMediaFromMediaElement( $mediaElement );
              }

              this.queueMediaFromMediaElement( $mediaElement );
              index = nonlinearPlaylistChildren.length;
            },
          );
        }
        
        this.log( 'this.mediaQueue', this.mediaQueue );
      } catch ( error ) {
        console.warn( error );

        // const playlist = this.getPlaylist();
      }
    }
  } // connectedCallback

  // https://developer.mozilla.org/en-US/docs/Web/API/Fullscreen_API
  toggleFullscreen( event ) {
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
          throw this.MISSING_XML_PARSER_ERROR;
        }
        return this.resolveCSSNamespacePrefixFromXML();
      break;

      case 'json-ld':
        if ( !this.hasJSONLDParser ) {
          throw this.MISSING_JSONLD_PARSER_ERROR;
        }
        return await this.resolveCSSNamespacePrefixFromJSONLD();
      break;
    }
  }

  applyAnnotationStyles( loopObject = this.annotations, parentIndex ) {
    const stylesheet = this.$.style.sheet;

    for ( let annotationIndex = 0; annotationIndex < loopObject.length; annotationIndex++ ) {
      let annotation = loopObject[annotationIndex];

      if ( annotation.type === 'choices' ) {
        this.applyAnnotationStyles( annotation.choices, annotationIndex );
      } else {
        let animation = loopObject[annotationIndex].goto.animate;
        let animationLength = ( animation.length || 1 );

        for ( let animateIndex = 0; animateIndex < animationLength; animateIndex++ ) {
          let animate = animation[animateIndex];

          if ( animateIndex === 0 ) {
            let styleProperties = '';
            let compoundIndex = annotationIndex;
  
            for ( let attribute in annotation.goto ) {
              if ( ( attribute === 'height' ) || ( attribute === 'width' ) ) {
                styleProperties += `${attribute}: ${annotation.goto[attribute]};\n`;
              } else {
                let cssAttributeRegex = new RegExp( `^${this._cssNamespacePrefix}:([^=]+)`, 'i' );
                let cssAttribute = attribute.match( cssAttributeRegex );
  
                if ( cssAttribute ) {
                  styleProperties += `${cssAttribute[1]}: ${annotation.goto[attribute]};`;
                }
              }
            }

            if ( typeof parentIndex !== 'undefined' ) {
              compoundIndex = `${parentIndex}-${annotationIndex}`;
            }

            let rule = `
            .redblue-annotations__link.redblue-annotations__link--${compoundIndex} {
              ${styleProperties}
              ${animate ? `transition: ${animate.endTime - animate.startTime}s bottom linear;` : '' }
            }`;

            stylesheet.insertRule( rule, ( this.stylesheetRules.length ) );
  
            if ( animate ) {
              stylesheet.insertRule( `
                .redblue-annotations__link.redblue-annotations__link--${compoundIndex}-start {
                  left: ${animate.startX};
                  bottom: ${animate.startY};
                }`, ( this.stylesheetRules.length )
              );

              stylesheet.insertRule( `
                .redblue-annotations__link.redblue-annotations__link--${compoundIndex}-animate-${animateIndex}-end {
                  left: ${animate.startX};
                  bottom: ${animate.endY};
                }`, ( this.stylesheetRules.length )
              );
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

  parseHTML( string ) {
    return document.createRange().createContextualFragment( string );
  }

  initializeYoutubePlayer() {
    this.player = new YT.Player( this.$.embeddedMedia, {
      "events": {
        "onReady": this.onPlayerReady.bind( this ),
        "onStateChange": this.onStateChange.bind( this )
      }
    } );

    document.addEventListener( 'keydown', ( event ) => {
      switch ( event.key ) {
        case 'm':
          this.log( this.player.getCurrentTime() );
        break;
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
      if ( this.debug ) {
        var time = ( new Date() ).getTime();
        var counter = 0;
      }
      let interval = setInterval( () => {
        if ( ( 'YT' in window ) && YT.Player ) {
          clearInterval( interval );
          this.initializeYoutubePlayer();
          this.log( `YouTube Iframe API found after ${counter} tries in ${( new Date() ).getTime() - time } seconds` );
        }
        if ( this.debug ) {
          counter++;
        }
      }, 0 );
      // Kill the check for YT after n minutes
      setTimeout( () => {
        // this.log( 'YT NOT found after ', ( new Date() ).getTime() - time, ' seconds' );
        clearInterval( interval );
        if ( this.debug ) {
          console.error( `Couldn’t find YouTube Iframe API after ${counter} tries in ${( new Date() ).getTime() - time} seconds'` );
        } else {
          console.error( `Couldn’t find YouTube Iframe API` );
        }
      }, ( 1000 * 60 * 2.5 ) ); // 2 minutes 30 seconds
    }
  }

  onPlayerReady( event ) {
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
      const time = this.player.getCurrentTime(); /* * 1000*/
      const state = this.player.getPlayerState();

      // https://stackoverflow.com/a/9882349/214325
      switch ( state ) {
        case YT.PlayerState.PLAYING:
          for ( let startTime in this.timelineTriggers ) {
            startTime  = parseFloat( startTime );
            let trigger = this.timelineTriggers[startTime];
            let endTime = trigger.endTime;
            let totalAnimations = this.annotations[trigger.annotationIndex].goto.animate.length;

            if ( ( time >= startTime ) && ( time <= endTime ) && !trigger.$ui.classList.contains( trigger.endClass ) ) {
              this.log( '---------' );
              let drift = Math.abs( time - trigger.startTime );

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
                let transitionDuration = parseFloat( getComputedStyle( trigger.$ui ).getPropertyValue( 'transition-duration' ).slice( 0, -1 ) );

                this.log( '---------' );
                this.log( 'No more animations' );
                this.log( 'this.annotations', this.annotations );

                setTimeout( () => {
                  this.log( 'timeout' );

                  // Remove all previous animate classes
                  while ( totalAnimations-- ) {
                    trigger.$ui.classList.remove(
                      trigger.endClass.replace( /animate-[0-9]+-/, `animate-${totalAnimations}-` )
                    );
                  }

                  trigger.$ui.classList.add( trigger.startClass );
                }, transitionDuration * 1000 );
              }
            }
          }
        break;

        case YT.PlayerState.PAUSED:
          // this.log( 'not playing' );

        break;
      }
    }

    requestAnimationFrame( this.updateUIOnYoutubePlayback.bind( this ) );
  }

  loadData() {
    for ( let i = 0; i < this.children.length; i++ ) {
      let child = this.children[i];

      switch ( child.nodeName.toLowerCase() ) {
        case 'hvml':
          this.hvml = child;
          this._hvmlParser = 'xml';
          return;
        break;

        case 'script':
          if ( child.hasAttribute( 'type' ) && ( child.type === 'application/ld+json' ) ) {
            this.hvml = JSON.parse( child.textContent );
            this._hvmlParser = 'json-ld';
            return;
          }
        break;
      } // switch
    } // for
  }

  getEmbedUri() {
    let youtubeUrl = this.find( `.//showing[@scope="release"]/venue[@type="site"]/uri[contains(., '//www.youtube.com/watch?v=')]/text()` ).snapshotItem(0);

    if ( youtubeUrl ) {
      return youtubeUrl.textContent.replace( this.YOUTUBE_VIDEO_REGEX, `//www.youtube.com/embed/$1${this.embedParameters || ''}` );
    }

    throw 'No Embed URL found';
  }

  getNonlinearPlaylist() {
    const nonlinearPlaylist = this.find( `.//presentation/playlist[@type="nonlinear"]` ).snapshotItem(0);

    if ( nonlinearPlaylist ) {
      return nonlinearPlaylist;
    }

    throw 'No nonlinear playlists found';
  }

  createHotspots() {
    if ( !this.annotations || !this.annotations.length ) {
      return false;
    }

    for ( let i = 0; i < this.annotations.length; i++ ) {
      let annotation = this.annotations[i];

      this.createHotspot( annotation, i );
    }

    return true;
  }

  createHotspot( annotation, index, $target = this.$.annotations ) {
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
      case 'choices':
        backgroundMedia = this.find(
          this._getXPathFromXPointerURI(
            annotation.media['xlink:href']
          )
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
          const $fileElement = backgroundMedia.snapshotItem(i);
          
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
          </div>`
        );
        $target.appendChild( $annotation );

        for ( let i = 0; i < annotation.choices.length; i++ ) {
          let choice = annotation.choices[i];
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
          </a>`
        );
        $target.appendChild( $annotation );
      break;
    }
  }

  mapAttributeToKeyValuePair( attribute ) {
    const object = {};
    object[RedBlueVideo.reCamelCase(attribute.nodeName)] = attribute.nodeValue;
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
      break;

      case 'json-ld':
        if ( !this.hasJSONLDParser ) {
          throw this.MISSING_JSONLD_PARSER_ERROR;
        }
        return this.getAnnotationsFromJSONLD();
      break;
    } // switch
  } // getAnnotations

  getTimelineTriggers() {
    if ( !this.annotations ) {
      return null;
    }

    let triggers = {};

    for ( let annotationIndex = 0; annotationIndex  < this.annotations.length; annotationIndex++ ) {
      let annotation = this.annotations[annotationIndex ];

      if ( annotation.goto && annotation.goto.animate ) {
        for ( let animateIndex = 0, totalAnimations = annotation.goto.animate.length; animateIndex < totalAnimations; animateIndex++ ) {
          let animate = annotation.goto.animate[animateIndex];

          triggers[animate.startTime] = {
            ...animate,
            annotationIndex,
            animateIndex,
            "name": annotation.name,
            "$ui": this.$$( `#annotations [data-index="${annotationIndex}"]` ),
            "startClass": `redblue-annotations__link--${annotationIndex}-start`,
            "endClass": `redblue-annotations__link--${annotationIndex}-animate-${animateIndex}-end`
          };

          if ( animateIndex > 0 ) {
            triggers[animate.startTime].previousEndClass = `redblue-annotations__link--animate-${animateIndex - 1}-end`;
          }
        }
      }
    }

    return triggers;
  }

  find( query, contextNode ) {
    switch ( this._hvmlParser ) {
      case 'xml':
        if ( !this.hasXMLParser ) {
          throw this.MISSING_XML_PARSER_ERROR;
        }
        return this.findInXML( query, contextNode );
      break;

      case 'json-ld':
        if ( !this.hasJSONLDParser ) {
          throw this.MISSING_JSONLD_PARSER_ERROR;
        }
        return this.findInJSONLD( query/*, contextNode*/ );
      break;
    }
  }
}

export default RedBlueVideo;
