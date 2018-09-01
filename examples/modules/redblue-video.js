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
                allowfullscreen="allowfullscreen">
              </iframe>
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

  constructor() {
    super();

    window.RedBlue = ( window.RedBlue || {} );

    this.embedID = ( new Date().getTime() );
    this.$template = this.parseHTML( RedBlueVideo.template.replace( 'id="embed"', `id="embed-${this.embedID}"` ) ).children[RedBlueVideo.is];

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

    this.$.fullscreenButton = this.$id( 'fullscreen-button' );
    this.$.fullscreenContext = this.$id( 'fullscreen-context' );

    this.$.fullscreenButton.addEventListener( 'click', this.toggleFullscreen.bind( this ) );

    try {
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
      this.$.embed = this.shadowRoot.getElementById( `embed-${this.embedID}` );
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
      } else {
        this.log( 'no embed match' );
      }
    } catch ( error ) {
      console.error( error );
    }
  } // connectedCallback

  log( data ) {
    if ( this.debug ) {
      return console.log.apply( null, arguments );
    }
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

  setupAnimations() {
    if ( !this.annotations || !this.annotations.length ) {
      return false;
    }

    const stylesheet = this.$$( 'style' ).sheet;
    const stylesheetRules = ( stylesheet.cssRules || stylesheet.rules );

    for ( let annotationIndex = 0; annotationIndex < this.annotations.length; annotationIndex++ ) {
      let annotation = this.annotations[annotationIndex];

      for ( let animateIndex = 0; animateIndex < this.annotations[annotationIndex].goto.animate.length; animateIndex++ ) {
        let animate = this.annotations[annotationIndex].goto.animate[animateIndex];

        if ( animateIndex === 0 ) {
          let styleProperties = '';

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

          stylesheet.insertRule( `
            .redblue-annotations__link.redblue-annotations__link--${annotationIndex} {
              ${styleProperties}
              transition: ${animate.endTime - animate.startTime}s bottom linear;
            }`, ( stylesheetRules.length )
          );

          stylesheet.insertRule( `
            .redblue-annotations__link.redblue-annotations__link--${annotationIndex}-start {
              left: ${animate.startX};
              bottom: ${animate.startY};
            }`, ( stylesheetRules.length )
          );
        }

        stylesheet.insertRule( `
          .redblue-annotations__link.redblue-annotations__link--${annotationIndex}-animate-${animateIndex}-end {
            left: ${animate.startX};
            bottom: ${animate.endY};
          }`, ( stylesheetRules.length )
        );
      }
    } // for

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
    try {
      let youtubeUrl = this.find( `.//showing[@scope="release"]/venue[@type="site"]/uri[contains(., '//www.youtube.com/watch?v=')]/text()` ).snapshotItem(0);

      if ( youtubeUrl ) {
        return youtubeUrl.textContent.replace( this.YOUTUBE_VIDEO_REGEX, `//www.youtube.com/embed/$1${this.embedParameters || ''}` );
      }

      throw 'No YouTube URL found';
    } catch ( error ) {
      console.error( error );
    }
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

  createHotspot( annotation, index ) {
    let $annotation = this.parseHTML(
      `<a
        id="annotation-${index}"
        class="redblue-annotations__link redblue-annotations__link--${index} redblue-annotations__link--${index}-start"
        href="${annotation.goto['xlink:href']}"
        target="_blank"
       >
         <span>${annotation.name}</span>
      </a>`
    );

    this.$id( 'annotations' ).appendChild( $annotation );
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

    return triggers;
  }

  find( query ) {
    switch ( this._hvmlParser ) {
      case 'xml':
        if ( !this.hasXMLParser ) {
          throw this.MISSING_XML_PARSER_ERROR;
        }
        return this.findInXML( query );
      break;

      case 'json-ld':
        if ( !this.hasJSONLDParser ) {
          throw this.MISSING_JSONLD_PARSER_ERROR;
        }
        return this.findInJSONLD( query );
      break;
    }
  }
}

export default RedBlueVideo;
