'use strict';

import RedBlueOmniParser from "./parser-omni";
import RedBlueVideo, { MediaQueueObject } from "./redblue-video";

export type MSE = {
  apply: () => void;
  endOfStream: boolean;
  init: () => void;
  isReady: () => boolean;
  mediaSource: MediaSource;
  onSourceEnded: NonNullable<MediaSource['onsourceended']>;
  onSourceOpen: NonNullable<MediaSource['onsourceopen']>;
  registerEvents: () => void;
  sourceBuffer?: SourceBuffer;
};

const RedBlueMSEPlayer = ( RedBlueVideo: typeof RedBlueOmniParser ) => {
  return class RedBlueMSEPlayer extends RedBlueVideo {
    MSE: MSE;

    constructor() {
      super();

      // Don’t spend CPU initializing this stuff unless we need to
      if ( RedBlueVideo.MSEsupported() ) {
        this.MSE = {
          "mediaSource": new window.MediaSource(),

          "endOfStream": false,

          "onSourceOpen": () => {
            this.log( 'onSourceOpen' );
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

            this.MSE.mediaSource = event.target as MediaSource;

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
              console.log( 'NOT READY: mediaSource.readyState !== "open"', this.MSE.mediaSource.readyState );
              return false;
            }
        
            if ( this.mediaQueue.length === 0 ) {
              console.log( 'NOT READY: RedBlue.mediaQueue.length === 0' );
              return false;
            }
        
            console.log( 'READY' );
            return true;
          }, // isReady

          "registerEvents": () => {
            this.MSE.mediaSource.addEventListener( 'sourceopen', this.MSE.onSourceOpen, false );
            this.MSE.mediaSource.addEventListener( 'sourceended', this.MSE.onSourceEnded, false );
          },

          "apply": () => {
            this.$.localMedia.src = window.URL.createObjectURL( this.MSE.mediaSource );
          },

          "init": () => {
            this.MSE.mediaSource = new window.MediaSource();
            this.MSE.registerEvents();
            this.MSE.apply();
          },
        } // this.MSE

        this.MSE.registerEvents();
      } // this.MSE.supported()
    }

    connectedCallback() {
      super.connectedCallback();

      this.MSE.apply();
      // this.$.localMedia.pause();
    }

    get hasMSEPlayer() {
      return true;
    }

    fetchMedia( mediaQueueObject: MediaQueueObject ) {
      /* {
        "mime": 'video/webm',
        "path": '/foo/bar',
      }; */

      const xhr = fetch(
        mediaQueueObject.path,
        {
          "method": "GET",
          "cache": "force-cache",
        },
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
                this.MSE.sourceBuffer!.timestampOffset = ( this.MSE.mediaSource.duration || 0 );
                this.MSE.sourceBuffer!.appendBuffer( new Uint8Array( arrayBuffer ) );
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
