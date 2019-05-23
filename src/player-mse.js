'use strict';

const RedBlueMSEPlayer = ( superClass ) => {
  return class extends superClass {
    constructor() {
      super();

      this.MSE = {
        "supported": () => {
          return !!( window.MediaSource || window.WebKitMediaSource );
        },
      };

      // Don’t spend CPU initializing this stuff unless we need to
      if ( this.MSE.supported() ) {
        this.MSE = {
          ...this.MSE,

          "mediaSource": new window.MediaSource(),

          "endOfStream": false,

          "onSourceOpen": () => {
            console.log( 'onSourceOpen' );
            // if ( !this.MSE.endOfStream ) {
            this.MSE.sourceBuffer = this.MSE.mediaSource.addSourceBuffer(
              // FIXME: use real buffer type
              // this.DEBUG_BUFFER_TYPE
              // 'video/webm'
              this.mediaQueue[0].mime
            );
            // }
          },

          "onSourceEnded": ( event ) => {
            console.log( 'onSourceEnded' );

            this.MSE.mediaSource = event.target;

            console.log('mediaSource readyState: ' + this.MSE.mediaSource.readyState);
          },

          "isReady": () => {
            // if ( !this.MSE.supported() ) {
            //   return true;
            // }
            console.log( 'this.MSE.mediaSource.sourceBuffers.length', this.MSE.mediaSource.sourceBuffers.length );

            if ( !this.MSE.mediaSource.sourceBuffers[0] ) {
              console.log( 'NOT READY: !mediaSource.sourceBuffers[0]' );
              return false;
            }
        
            if ( this.MSE.mediaSource.sourceBuffers[0].updating ) {
              console.log('NOT READY: mediaSource.sourceBuffers[0].updating');
              return false;
            }
        
            if ( this.MSE.mediaSource.readyState !== "open" ) {
              console.log( 'NOT READY: mediaSource.readyState !== "open"', RedBlue.MSE.mediaSource.readyState );
              return false;
            }
        
            if ( this.MSE.mediaSource.sourceBuffers[0].mode == "PARSING_MEDIA_SEGMENT" ) {
              console.log( 'NOT READY: mediaSource.sourceBuffers[0].mode == PARSING_MEDIA_SEGMENT' );
              return false;
            }
        
            if ( this.mediaQueue.length === 0 ) {
              console.log( 'NOT READY: RedBlue.mediaQueue.length === 0' );
              return false;
            }
        
            console.log( 'READY' );
            return true;
          }, // isReady
        } // this.MSE

        this.MSE.mediaSource.addEventListener( 'sourceopen', this.MSE.onSourceOpen, false );
        this.MSE.mediaSource.addEventListener( 'sourceended', this.MSE.onSourceEnded, false );
      } // this.MSE.supported()
    }

    connectedCallback() {
      super.connectedCallback();
      
      // TODO: this.choicesContainer.addEventListener( 'click', RedBlue.MSEPlayer.Events.choiceClicked, false );

      if ( this.isNonlinear() ) {
        this.$.localMedia.addEventListener( 'timeupdate', this.Events.presentChoice );
      }

      this.$.localMedia.src = window.URL.createObjectURL( this.MSE.mediaSource );
      // this.$.localMedia.pause();
    }

    get hasMSEPlayer() {
      return true;
    }

    fetchMedia( mediaQueueObject ) {
      /* {
        "mime": 'video/webm',
        "path": '/foo/bar',
      }; */
  
      const xhr = fetch(
        mediaQueueObject.path,
        {
          "method": "GET",
          "cache": "force-cache",
        }
      );

      if ( /^video\/.*/i.test( mediaQueueObject.mime ) ) {
        xhr
          .then( response => response.arrayBuffer() )
          .then( ( arrayBuffer ) => {
            this.log( 'MSE Player fetched as arrayBuffer:', arrayBuffer );

            const appendBufferWhenReadyTimeout = setTimeout( () => {
              clearInterval( appendBufferWhenReady );
              console.error( 'appendBufferWhenReady timed out' );
            }, 10000 );

            const appendBufferWhenReady = setInterval( () => {
              if ( this.MSE.isReady() ) {
                this.MSE.sourceBuffer.timestampOffset = ( this.MSE.mediaSource.duration || 0 );
                this.MSE.sourceBuffer.appendBuffer( new Uint8Array( arrayBuffer ) );
                this.$.localMedia.play()
                  .then( _ => console.log( 'Played!' ) )
                  .catch( error => console.error( error.message ) )
                ;
                clearInterval( appendBufferWhenReady );
                clearTimeout( appendBufferWhenReadyTimeout );
                this.mediaQueue = this.mediaQueue.slice(1);
                console.log( 'this.mediaQueue', this.mediaQueue );
              }
            }, 1000 );
          } )
        ;
      }
        
      xhr.catch( ( error ) => {
        console.error( error );
      } );
    }
  };
};

export default RedBlueMSEPlayer;
