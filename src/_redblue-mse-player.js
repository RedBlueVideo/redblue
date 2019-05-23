'use strict';

const RedBlueMSEPlayer = ( superClass ) => {
  return class extends superClass {
    constructor() {
      super();

      this.Reader = {
        "onload": ( event ) => {
          this.log( '--reader.onload--');
          this.MSE.mediaSegment = new Uint8Array( event.target.result );
          this.appendBufferWhenReady();
          // console.log( [this] );
        },
      
        "init": ( uInt8Array, type ) => {
          this.log( '--GET callback--');
          var buffer = 0;

          this.log( 'this.mediaQueue', this.mediaQueue );

          // if ( !!!type ) {
          //   type = ( this.mediaQueue[0].type || this.DEBUG_BUFFER_TYPE ); //'video/webm',
          // }
          if ( !type && this.debug ) {
            this.log( 'Using debug buffer type:', this.DEBUG_BUFFER_TYPE );
            type = this.DEBUG_BUFFER_TYPE;
          }

          var file = new Blob(
            [uInt8Array],
            {
              type: type
            }
          );
  
          var reader = new FileReader();
      
          // Reads aren't guaranteed to finish in the same order they're started in,
          // so we need to read + append the next chunk after the previous reader
          // is done (onload is fired).
          reader.onload = this.Reader.onload;
      
          reader.readAsArrayBuffer( file );
        }
      };
    }

    connectedCallback() {
      super.connectedCallback();

      this.MSE = {
        "buffers": [],
        "bufferLoading": false,
        "endOfStream": false,
        "sourceBuffer": null,
        "mediaSource": null,
        "mediaSegment": null,
        "checkStatus": null,
        "checkStatusBuffer": null, // Do we really need 2?
      
        "supported": () => {
          window.MediaSource = window.MediaSource || window.WebKitMediaSource;
      
          if ( !!!window.MediaSource ) {
            // alert( 'MediaSource API is not supported.' );
            return false;
          }
      
          return true;
        },

        "fetchMediaSegment": () => {
          let segmentUrl;
          let segmentGenericXpath;
          let segmentSupportedFormatXpath;
          let segmentFileElement;
          let xlinkHrefSelector;

          // Plain HTML
          if ( this.hostDocument.isPlainHTML() ) {
            xlinkHrefSelector = '@*[local-name() = "xlink:href"]';
          // XHTML
          } else if ( this.hostDocument.isXHTML() ) {
            xlinkHrefSelector = '@xlink:href';
          }

          segmentGenericXpath = `(//presentation/playlist[@type="nonlinear"]//media)[1]/${xlinkHrefSelector}[1]`;
          segmentSupportedFormatXpath = this.find( segmentGenericXpath )
            .snapshotItem(0)
            .textContent
            .replace(
              /#xpointer\(([^)]+)\)/i,
              `$1[container/mime[text() = '${this.DEBUG_MIME_TYPE}']]`
            );
          segmentFileElement = this.find( segmentSupportedFormatXpath ).snapshotItem(0);
          segmentUrl = segmentFileElement.getAttributeNS( 'https://www.w3.org/1999/xlink', 'href' ) || segmentFileElement.getAttribute( 'xlink:href' );

          // /${xlinkHrefSelector}
          console.log( segmentFileElement )
          console.log( 'generic:', segmentGenericXpath );
          console.log( 'supported format:', segmentSupportedFormatXpath );

          const obj = {
            //'type': 'media',
            'mime': this.DEBUG_MIME_TYPE,
            'path': segmentUrl,
          };
  
          this.mediaQueue.push( obj );
          this.mediaQueueHistory.push( obj );

          this.XHR.GET( segmentUrl, this.DEBUG_MIME_TYPE, this.Reader.init );
        },
      
        "onSourceOpen": ( event ) => {
          this.log( '--MSE.onSourceOpen()--' );
      
          // Why would sourceopen even fire again after the first time???
          if ( !this.endOfStream ) {
            // 'video/webm; codecs="vorbis,vp8"'
            //
            this.MSE.sourceBuffer = this.MSE.mediaSource.addSourceBuffer( this.DEBUG_BUFFER_TYPE );
          } else {
            return false;
          }

          if ( this.hvml ) {
            // this.log( 'has inline hvml' );
            // this.find( '' );
            // this.XHR.GET();
            this.MSE.fetchMediaSegment();
          } else {
            if ( !this.XML.xmlLoaded ) {
              // Load playlist
              this.XML.import( 'db/redblue.ovml.xml' );
            } else {
              this.log( '--XML already loaded--' );
              this.XHR.GET( this.mediaQueue[0].path, this.mediaQueue[0].type, this.Reader.init );
            }
          }
        },
      
        "onSourceEnded": ( event ) => {
          this.MSE.mediaSource = event.target;
          this.log('mediaSource readyState: ' + this.MSE.mediaSource.readyState);
        },
      };

      // super.connectedCallback();

      this.log( '--init()--' );
      // https://html5-demos.appspot.com/static/media-source.html
      // window.RedBlue = ( window.RedBlue || {} );

      this.MSE.mediaSource = new window.MediaSource();
      this.video.src = window.URL.createObjectURL( this.MSE.mediaSource );
      this.video.pause();

      // this.choicesContainer.innerHTML = '';
      this.choicesContainer.removeEventListener( 'click', this.Events.choiceClicked, false );
      this.choicesContainerCounter = 0;
      this.choicesCounter = 0;

      //if ( !skipEventListeners ) {
        this.choicesContainer.addEventListener( 'click', this.Events.choiceClicked, false );

        this.MSE.mediaSource.addEventListener( 'sourceopen', this.MSE.onSourceOpen, false );

        this.MSE.mediaSource.addEventListener( 'sourceended', this.onSourceEnded, false );
      //}
    }

    // init( skipEventListeners ) {
      
    // }

    checkStatusInterval() {
      var appended = this.play();

      if ( appended ) {
        clearInterval( this.checkStatus );
      }
    }

    playNextWhenReady() {
      this.log( '--Player.playNextWhenReady()--' );

      clearInterval( this.checkStatus );

      this.checkStatus = setInterval( this.checkStatusInterval, this.POLLING_INTERVAL );
    }

    appendBufferWhenReady() {
      this.log( '--Player.appendBufferWhenReady()--' );
      clearInterval( this.checkStatusBuffer );

      this.checkStatusBuffer = setInterval( () => {
        this.checkStatusBufferInterval()
      }, this.POLLING_INTERVAL );

      setTimeout( () => {
        clearInterval( this.checkStatusBuffer );
        console.error( 'Buffer append timed out' );
      }, 7500 )
    }

    //"Events": {},

    play() {
      this.log( '--play()--' );
      // Make sure the previous append is not still pending.
      var ready = this.isReady();

      if ( !ready ) {
        return false;
      }

      //this.log( 'this.mediaQueue.length', this.mediaQueue.length );

      // This is already checked in MSE.isReady. Am I going insane?
      if ( this.mediaQueue.length === 0 ) {
        return false;
      }

      this.XHR.GET( this.mediaQueue[0].path, this.mediaQueue[0].type, this.Reader.init );

      return true;
    }

    checkStatusBufferInterval() {
      var ready = this.isReady();
      var firstSegmentDuration;

      //this.log( 'MSE.isReady', ready );

      if ( ready ) {
        clearInterval( this.checkStatusBuffer );

        this.duration = this.MSE.mediaSource.duration || 0;

        //this.log('Duration: ' + this.duration);

        this.MSE.sourceBuffer.timestampOffset = this.duration;

        this.MSE.sourceBuffer.appendBuffer( this.MSE.mediaSegment );

        if ( !this.firstSegmentAppended ) {
          firstSegmentDuration = this.duration;

          this.video.addEventListener( 'timeupdate', this.Events.presentChoice );

          this.firstSegmentAppended = true;
        }

        // console.log( this.video );

        if ( this.video.paused ) {
          const promise = this.video.play(); // Start playing after 1st chunk is appended.
          if ( promise !== undefined ) {
            promise.then( _ => {
              console.log( 'Autoplay started!' );
            } ).catch( error => {
              console.error( 'Autoplay was prevented.' );
              // Show a "Play" button so that user can start playback.
            } );
          }
        }

        this.mediaQueue = this.mediaQueue.slice( 1 );

        if ( this.mediaQueue.length > 0 ) {
          this.choiceContainer = this.$id( `annotation-${++this.choicesContainerCounter}` );
          this.playNextWhenReady();
        }
      }
    }

    readPlaylistItem( uInt8Array, type ) {
      type = type || this.DEBUG_MIME_TYPE; //'video/webm';

      var file = new Blob(
        [uInt8Array],
        {
          type: type
        }
      );

      var reader = new FileReader();

      reader.onloadstart = ( event ) => {
        this.bufferLoading = true;
      };

      reader.onload = ( event ) => {
        this.buffers.push( new Uint8Array( event.target.result ) );
        this.bufferLoading = false;
        //this.log(buffers);
      };

      //this.log( file );
      reader.readAsArrayBuffer( file );
    }
  }
};

export default RedBlueMSEPlayer;
