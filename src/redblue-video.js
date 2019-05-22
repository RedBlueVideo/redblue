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
              <iframe id="embed" class="redblue-player"
                src=""
                frameborder="0"
                allow="autoplay; encrypted-media"
                allowfullscreen="allowfullscreen"
                >
              </iframe>
              <video id="local" class="redblue-player"
                controls="controls"
                src="">
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

  get hostDocument() {
    // TODO: this.ownerDocument
    return {
      "isPlainHTML": () => ( document.body.nodeName === 'BODY' ),
      "isXHTML": () => ( document.body.nodeName === 'body' ),
    };
  }
  
  isReady() {
    if ( !this.MSE ) {
      return false;
    }

    if ( !this.MSE.mediaSource.sourceBuffers[0] ) {
      this.log( 'NOT READY: !mediaSource.sourceBuffers[0]' );
      return false;
    }

    if ( this.MSE.mediaSource.sourceBuffers[0].updating ) {
      this.log('NOT READY: mediaSource.sourceBuffers[0].updating');
      return false;
    }

    if ( this.MSE.mediaSource.readyState !== "open" ) {
      this.log( 'NOT READY: mediaSource.readyState !== "open"', this.MSE.mediaSource.readyState );
      return false;
    }

    if ( this.MSE.mediaSource.sourceBuffers[0].mode == "PARSING_MEDIA_SEGMENT" ) {
      this.log( 'NOT READY: mediaSource.sourceBuffers[0].mode == PARSING_MEDIA_SEGMENT' );
      return false;
    }

    if ( this.mediaQueue.length === 0 ) {
      this.log( 'NOT READY: this.mediaQueue.length === 0' );
      return false;
    }

    this.log( 'READY' );
    return true;
  }

  constructor() {
    super();

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
  
    this.mediaQueue = [];
    this.mediaQueueHistory = [];
  
    this.totalVideos = 0;
  
    this.fileTypePreferences = [];
    // this.replacing = false;
  
    this.playerType = '';

    this.choiceContainer = null;
    this.choicesCounter = 0;
    this.choicesContainerCounter = 0;
    this.firstChoiceSelected = false;

    this.firstSegmentAppended = false;
    this.lastSegmentAppended = false;

    // TODO: make pluggable with custom XHR methods
    this.XHR = {
      "GET": ( url, type, callback ) => {
        this.log( '--XHR.GET()--' );
    
        var xhr = new XMLHttpRequest();
        xhr.open( 'GET', url, true );
        xhr.responseType = 'arraybuffer';
        xhr.send();
    
        xhr.onload = ( event ) => {
          if ( xhr.status !== 200 ) {
            this.log( "Unexpected status code " + xhr.status + " for " + url );
            return false;
          }
          callback( new Uint8Array( xhr.response ), type );
        };
      }
    };

    this.HVML = {
      "getMime": ( fileElement ) => {
        var returnVal = this.find( 'container/mime', fileElement, XPathResult.ORDERED_NODE_ITERATOR_TYPE ).iterateNext();
    
        if ( returnVal ) {
          return returnVal.textContent;
        }
    
        // for images etc. with no container format
        returnVal = this.find( 'codec/mime', fileElement, XPathResult.ORDERED_NODE_ITERATOR_TYPE ).iterateNext();
    
        if ( returnVal ) {
          return returnVal.textContent;
        }
    
        return returnVal;
      },
    
      "parse": {
        "playlist": ( XPathResult ) => {
          var playlistElement = XPathResult.iterateNext();
          var playlistType = playlistElement.getAttribute( 'type' );
    
          switch ( playlistType ) {
            case 'linear':
            break;
    
            case 'nonlinear':
              this.HVML.parse.nonlinearPlaylistItems( playlistElement );
            break;
    
            default:
          }
        },
    
        "mediaElement": ( playlistItem ) => {
          var containers = [];
          var container;
          var fileElement;
          var i;
          var mediaFile;
          var plGrandchild;
          var query;
          var obj;
    
          query = this.XLink.getQuery( playlistItem );
    
          mediaFile = this.find( query ); // This will return both webm and mp4
    
          fileElement = mediaFile.iterateNext();
    
          this.log( this.fileTypePreferences );
    
          // @todo: canPlayType
          while ( fileElement ) {
            for ( i = this.fileTypePreferences.length - 1; i >= 0; --i ) {
              for ( var mime in this.fileTypePreferences[i] ) {
                container = this.find( 'container[./mime[text() = "' + mime + '"]]', fileElement, XPathResult.ORDERED_NODE_ITERATOR_TYPE ).iterateNext();
    
                if ( container ) {
                  containers.push( { 'mime': mime, 'node': container} );
                }
              }
            }
    
            fileElement = mediaFile.iterateNext();
          }
    
          if ( containers.length > 0 ) {
            obj = {
              //'type': 'media',
              'mime': containers[0]['mime'],
              'path': this.XLink.get( containers[0]['node'].parentElement )
            };
    
            this.mediaQueue.push( obj );
            this.mediaQueueHistory.push( obj );
          }
    
          if ( playlistItem.children.length > 0 ) {
            for ( i = playlistItem.children.length - 1; i >= 0; --i) {
              plGrandchild = playlistItem.children[i];
    
              switch( plGrandchild.localName ) {
                case 'goto':
                  query = this.XLink.getQuery( plGrandchild );
    
                  if ( query ) {
                    this.HVML.parse.nonlinearPlaylistItems( this.find( query, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE ).iterateNext() );
                  }
                break;
              }
            }
          } else {
            this.MSE.endOfStream = true;
            // this.playNextWhenReady();
            this.play();
          }
        },
    
        "choicesElement": ( playlistItem ) => {
          var choicesBg = this.find( 'media', playlistItem, XPathResult.ORDERED_NODE_ITERATOR_TYPE ).iterateNext();
          var choices = this.find( 'choice', playlistItem, XPathResult.ORDERED_NODE_ITERATOR_TYPE );
          var choicesName = this.find( 'name', playlistItem, XPathResult.ORDERED_NODE_ITERATOR_TYPE ).iterateNext().textContent;
          var choice = choices.iterateNext();
          var choiceLetter;
          var choicesHTML = '<ul>';
          var choicesCounter = 1;
          var file;
          var fileElement;
          var fileMime;
          var mediaElement;
          var timeline;
          var gotoElement;
          var playlistActions = [];
          var playlistActionElements;
          var playlistActionElement;
          var query;
          var xlinkHref;
    
          // console.log( 'this.choicesContainer.innerHTML', this.choicesContainer.innerHTML );
    
          console.log('encountered a choice');
    
          ++this.choicesContainerCounter;
    
          // static bg - use poster frame?
          // http://stackoverflow.com/a/19457115/214325
    
          while ( choice ) {
            playlistActionElements = this.find( 'playlistAction', choice );
            playlistActionElement = playlistActionElements.iterateNext();
    
            while ( playlistActionElement ) {
              var playlistActionMethod = playlistActionElement.getAttribute( 'method' );
    
              if ( playlistActionMethod ) {
                playlistActions.push( playlistActionMethod );
              } else {
                playlistActions.push( choice.getAttributeNS( this.XML.ns.xml, 'id' ) );
              }
    
              playlistActionElement = playlistActionElements.iterateNext();
            }
    
            gotoElement = this.find( 'goto', choice, XPathResult.ORDERED_NODE_ITERATOR_TYPE ).iterateNext();
    
            //console.log( 'gotoElement', gotoElement );
    
            xlinkHref = this.XLink.get( gotoElement );
            query = RedBlue.XPointer.parse( xlinkHref );
            timeline = gotoElement.getAttribute( 'timeline' );
    
            mediaElement = this.find( query, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE ).iterateNext();
    
            query = this.XLink.getQuery( mediaElement );
            fileElement = this.find( query, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE ).iterateNext(); // @todo: filter by filetype/etc.
            fileMime = this.HVML.getMime( fileElement );
    
            choiceLetter = String.fromCharCode( 64 + choicesCounter ).toLowerCase();
    
            // @todo: Instead of storing in the DOM, just keep track of the damn things (right?)
            // choicesHTML += [
            //   '<li>',
            //     '<a id="choice-', this.choicesContainerCounter, choiceLetter, '"',
            //       ' class="choice choice-', choiceLetter, '"',
            //       ' href="javascript:void(0);"',
            //       ' data-actions="[\'', playlistActions.join("','"), '\']"',
            //       ' data-goto="', xlinkHref, '"',
            //       ' data-play="', this.XLink.get( fileElement ), '"',
            //       ' data-type="', fileMime, '"',
            //       ( timeline ? ' data-timeline="' + timeline + '"' : '' ),
            //       '>', this.find( 'name', choice, XPathResult.ORDERED_NODE_ITERATOR_TYPE ).iterateNext().textContent,
            //     '</a>',
            //   '</li>'
            // ].join('');
    
            choice = choices.iterateNext();
            ++choicesCounter;
          }
          // choicesHTML += '</ul>';
    
          // this.choicesContainer.innerHTML += '<nav id="choice-' + this.choicesContainerCounter + '" class="choices" hidden="hidden"><div class="container"><h2>' + choicesName + '</h2>' + choicesHTML + '</div></nav>';
    
          this.choiceContainer = this.$id( 'annotation-' + this.choicesContainerCounter );
          console.log( 'annotation-' + this.choicesContainerCounter );
          console.log( 'this.choiceContainer', this.choiceContainer );

          // if bg
          fileElement = this.XLink.getNodes( choicesBg, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE ).iterateNext();
          fileMime = this.HVML.getMime( fileElement );
          file = this.XLink.get( fileElement );
    
          switch ( fileMime ) {
            case 'image/jpeg':
            case 'image/png':
            case 'image/gif':
            case 'image/webp':
              this.choiceContainer.style.backgroundImage = 'url(' + file + ')';
              this.choiceContainer.style.backgroundRepeat = 'no-repeat';
              this.choiceContainer.style.backgroundSize = 'contain';
            break;
    
            default:
              console.log('Choice background image file type "' + fileMime + '" not supported.');
          }
    
          this.video.addEventListener( 'timeupdate', this.Events.presentChoice );
        }, // parse.choicesElement
    
        "nonlinearPlaylistItems": ( playlistItems ) => {
          console.log( '--OVML.parse.nonlinearPlaylistItems()--' );
          //console.log( 'playlistItems', playlistItems );
    
          var playlistItem;
    
          // hasOwnProperty('children') does not work in Firefox
          if ( ( playlistItems.localName === 'playlist' ) && playlistItems.children && playlistItems.children.length > 0 ) {
            playlistItem = playlistItems.children[0];
            //console.log( 'playlistItem', playlistItem );
          } else {
            playlistItem = playlistItems;
            //console.log( 'playlistItem', playlistItem );
          }
    
          switch ( playlistItem.localName ) {
            case 'media':
              this.HVML.parse.mediaElement( playlistItem );
            break;
    
            case 'choices':
              this.HVML.parse.choicesElement( playlistItem );
            break;
          }
        } // nonlinearPlaylistItems
      } // parse
    }; // OVML

    this.embedID = ( new Date().getTime() );
    this.$template = this.parseHTML(
      RedBlueVideo.template
        .replace( 'id="embed"', `id="embed-${this.embedID}"` )
        .replace( 'id="local"', `id="local-${this.embedID}"` )
    ).children[RedBlueVideo.is];

    this.MISSING_XML_PARSER_ERROR = 'Can’t process; XML mixin class has not been applied.';
    this.MISSING_JSONLD_PARSER_ERROR = 'Can’t process; JSON-LD mixin class has not been applied.';
    this.YOUTUBE_VIDEO_REGEX = /^(?:https?:)?\/\/(?:www\.)?youtube\.com\/watch\?v=([^&?]+)/i;
    this.YOUTUBE_DOMAIN_REGEX = /^(?:(?:https?:)?\/\/)?(?:www\.)?youtube\.com/i;
    this.VIMEO_VIDEO_REGEX = /^(?:https?:)?\/\/(?:www\.)?vimeo\.com\/([^\/]+)/i;
    this.VIMEO_DOMAIN_REGEX = /^(?:(?:https?:)?\/\/)?(?:www\.)?vimeo\.com/i;
  } // constructor

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

    this.$   = {};
    this.$$  = this.shadowRoot.querySelector.bind( this.shadowRoot );
    this.$$$ = this.shadowRoot.querySelectorAll.bind( this.shadowRoot );
    this.$id = this.shadowRoot.getElementById.bind( this.shadowRoot );

    if ( this.hostDocument.isPlainHTML() ) {
      this.querySelectorAll( '[xml\\:id]' ).forEach( ( el ) => {
        el.setAttribute( 'id', el.getAttribute( 'xml:id' ) );
      } );
    }

    // -- Prototype --
    this.choices = this.$$$( '.choice' );
    this.choicesContainer = this.$id( 'annotations' ); // this.$id( 'choices-container' );
    this.video = this.$id( `local-${this.embedID}` );

    this.Events = {
      "choiceClicked": ( event ) => {
        this.log( '--Player.Events.choiceClicked()--' );
        var link = event.target;

        if ( link.nodeName.toLowerCase() === 'a' ) {
          event.preventDefault();

          // var link = event.target;
          var id = link.id;

          while ( link && link.nodeName.toLowerCase() !== 'a' ) {
            link = link.parentNode;
          }

          //this.log( 'clicked choice:', link );

          // this.choiceContainer.setAttribute('hidden', 'hidden');
          this.choiceContainer.hidden = true;
          this.firstChoiceSelected = true;
          this.lastSegmentAppended = true;

          var replaceTimeline = link && ( link.getAttribute( 'data-timeline' ) === 'replace' );

          if ( replaceTimeline ) {
            this.log ( '--Replacing stream--' );

            // this mostly works but for some reason double-append of intro at the beginning
            //initVars();

            // this.XML.xmlLoaded = true;
            this.XML.xmlLoaded = false; // TODO: performance bottleneck?

            this.init();

            return;
          }

          // this.HVML.parse.nonlinearPlaylistItems(
          //   this.XML.getNodes(
          //     RedBlue.XPointer.parse(
          //       link.getAttribute( 'data-goto' )
          //     ) // XPointer.parse
          //   ) // XML.getNodes
          //   .iterateNext()
          // ); // OVML.parse.nonlinearPlaylistItems
          this.log( 'do something with this', link.getAttribute( 'href' ) );

          
          this.log( 'link', link );

          const fileId = link.getAttribute( 'href' ).slice(1);
          // Plain HTML
          if ( this.hostDocument.isPlainHTML() ) {
            // xmlIdSelector = `@*[local-name() = "xml:id" and text() = "${fileId}"]`;
            let fileElement = this.find(
              document.getElementById( fileId )
                .getAttribute( 'xlink:href' )
                .replace(
                  /#xpointer\(([^)]+)\)/i,
                  `$1[container/mime[text() = '${this.DEBUG_MIME_TYPE}']]`
                )
            ).snapshotItem(0);
            let segmentUrl = fileElement.getAttribute( 'xlink:href' );

            const obj = {
              //'type': 'media',
              'mime': this.DEBUG_MIME_TYPE,
              'path': segmentUrl,
            };
    
            this.mediaQueue.push( obj );
            this.mediaQueueHistory.push( obj );

            this.choiceContainer = this.$id( `annotation-${++this.choicesContainerCounter}` );

            this.XHR.GET( segmentUrl, this.DEBUG_MIME_TYPE, ( uInt8Array, type ) => {
              this.Reader.init( uInt8Array, type );
              // this.play();
            } );
          // XHTML
          } else if ( this.hostDocument.isXHTML() ) {
            let xmlIdSelector = `@xml:id="${fileId}"`;
            // this.find 
          }

          // this.XHR.GET( firstSegmentUrl, this.DEBUG_MIME_TYPE, this.Reader.init );

          // this.log( '--Player.play()--' );
          // this.play();
        }
      },

      "presentChoice": ( event ) => {
        // toFixed works around a Firefox bug but makes it slightly less accurate
        // @todo: Maybe detect Firefox and implement this conditionally? But then inconsistent playback experience.
        // Imprecision may not matter if it's going to be an overlay onto bg video.
        var videoPlayer = event.target; // this
        var currentTime = +videoPlayer.currentTime.toFixed(0);
        var currentDuration = +videoPlayer.duration.toFixed(0);

        if ( currentTime === currentDuration ) {

          this.log( 'choice presented' );

          this.log( 'this.choicesContainerCounter', this.choicesContainerCounter );

          if ( !this.choicesContainerCounter || !this.choiceContainer ) {
            this.choicesContainerCounter = 0;
            this.choiceContainer = this.$id( 'annotation-0' );
          }

          // this.choiceContainer.removeAttribute( 'hidden' );
          this.choiceContainer.hidden = false;

          //this.log( this.choiceContainer );

          // @todo: This could stay here if there were a reliable way to dynamically re-attach (not saying there isn't; just not sure why it's not already happpening)
          this.removeEventListener( 'timeupdate', this.Events.presentChoice );
        }
      }
    }; // Events
    // -- End Prototype

    // this.$.annotations = this.$id( 'annotations' );

    this.$.fullscreenButton = this.$id( 'fullscreen-button' );
    this.$.fullscreenContext = this.$id( 'fullscreen-context' );

    this.$.fullscreenButton.addEventListener( 'click', this.toggleFullscreen.bind( this ) );

    // The order here is important
    this.loadData();
    this.annotations = this.getAnnotations();
    this.log( `annotations - ${this._hvmlParser}`, this.annotations );
    this.resolveCSSNamespacePrefix().then( ( prefix ) => {
      this._cssNamespacePrefix = prefix;
      // this.log( 'this._cssNamespacePrefix', this._cssNamespacePrefix );
      this.setupAnimations();
    } );
    this.timelineTriggers = this.getTimelineTriggers();

    // FIXME: Not sure why the timeout here is necessary; race condition?
    setTimeout( () => {
      this.createHotspots();
      this.choiceContainer = this.$id( 'annotation-0' ); // will be overriden depending on current
      // this.log( 'this.choiceContainer', this.choiceContainer );
    }, 0 );

    this.$.embed = this.shadowRoot.getElementById( `embed-${this.embedID}` );

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
        this.$.embed.src = embedUri + this.embedParameters;
        this.setUpYouTubeIframeAPI();
      } else if ( this.VIMEO_DOMAIN_REGEX.test( this.$.embed.src ) ) {
        this.log( 'vimeo' );
        // @todo: Handle Vimeo videos
      }
    } catch ( error ) {
      this.log( error.message );
      // switch ( error.message ) {
      //   case 'No Embed URL found':
      //   break;
      // }
      // If third-party embed not found, initialize MSE or Legacy Player
      // if ( 'init' in this ) {
      //   this.init();
      // }
    }
  } // connectedCallback

  isPlaying() {
    // https://stackoverflow.com/a/36898221/214325
    return ( this.video.currentTime > 0 && !this.video.paused && !this.video.ended && this.video.readyState > 2 );
  }

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
    const stylesheet = this.$$( 'style' ).sheet;
    const stylesheetRules = ( stylesheet.cssRules || stylesheet.rules );

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

            stylesheet.insertRule( rule, ( stylesheetRules.length )
            );
  
            if ( animate ) {
              stylesheet.insertRule( `
                .redblue-annotations__link.redblue-annotations__link--${compoundIndex}-start {
                  left: ${animate.startX};
                  bottom: ${animate.startY};
                }`, ( stylesheetRules.length )
              );

              stylesheet.insertRule( `
                .redblue-annotations__link.redblue-annotations__link--${compoundIndex}-animate-${animateIndex}-end {
                  left: ${animate.startX};
                  bottom: ${animate.endY};
                }`, ( stylesheetRules.length )
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
    this.player = new YT.Player( this.$.embed, {
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
    this.$.embed.style.borderColor = '#FF6D00';
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
    function getXpath( urlPattern ) {
      const xpath = `.//showing[@scope="release"]/venue[@type="site"]/uri[contains(., '${urlPattern}')]/text()`;
      return xpath;
    }

    const youtubeUrl = this.find( getXpath( '//www.youtube.com/watch?v=' ) ).snapshotItem(0);

    if ( youtubeUrl ) {
      return youtubeUrl.textContent.replace( this.YOUTUBE_VIDEO_REGEX, `//www.youtube.com/embed/$1${this.embedParameters || ''}` );
    }

    /* … Vimeo, etc. */

    throw new Error( 'No Embed URL found' );
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

  createHotspot( annotation, index, $target = this.choicesContainer ) {
    let $annotation;

    switch ( annotation.type ) {
      case 'choices':
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
            id="annotation-${index}"
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
            "$ui": this.$id( `annotation-${annotationIndex}` ),
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

  find( query, contextNode = null, resultType = null ) {
    switch ( this._hvmlParser ) {
      case 'xml':
        if ( !this.hasXMLParser ) {
          throw this.MISSING_XML_PARSER_ERROR;
        }
        return this.findInXML( query, contextNode, resultType );
      break;

      case 'json-ld':
        if ( !this.hasJSONLDParser ) {
          throw this.MISSING_JSONLD_PARSER_ERROR;
        }
        // TODO: contextNode
        return this.findInJSONLD( query );
      break;
    }
  }
}

export default RedBlueVideo;
