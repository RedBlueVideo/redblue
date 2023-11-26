'use strict';

import RedBlueOmniParser from "./parser-omni.js";
import { MediaQueueObject } from "./redblue-video.js";

/**
 * Fallback player for when the browser
 * does not support Media Source Extensions.
 *
 * The drawback of this approach is that choices can not
 * be played back contiguously. Each choice replaces
 * the video src (hard URL) rather than appending a
 * chunk to the video src (MediaSource Blob).
 */
const _RedBlueLegacyPlayer = ( RedBlueVideo: typeof RedBlueOmniParser ) => {
  return class RedBlueLegacyPlayer extends RedBlueVideo {
    Legacy: {
      init: () => void;
    };

    constructor() {
      super();

      this.Legacy = {
        init: () => {
          for ( let index = 0; index < this.mediaQueue.length; index++ ) {
            const mediaQueueItem = this.mediaQueue[index];

            if ( this.$.localMedia.canPlayType( mediaQueueItem.mime ) ) {
              this.$.localMedia.src = mediaQueueItem.path;
              break;
            } // if
          } // for
        }, // init
      }; // this.Legacy
    }

    connectedCallback() {
      super.connectedCallback();

      this.Legacy.init();
    }

    get hasLegacyPlayer() {
      return true;
    }

    fetchMedia( mediaQueueObject: MediaQueueObject ) {
      /* {
        "mime": 'video/webm',
        "path": '/foo/bar',
      }; */

      if ( /^video\/.*/i.test( mediaQueueObject.mime ) ) {
        if ( this.$.localMedia.canPlayType( mediaQueueObject.mime ) ) {
          this.$.localMedia.src = mediaQueueObject.path;
          this.$.localMedia.addEventListener( 'canplay', () => {
            this.$.localMedia.play()
              .then( () => console.log( 'Played!' ) )
              .catch( ( error ) => console.error( error.message ) )
            ;
          } );
        } // if canplaytype
      } // if video
    }
  };
};

export default _RedBlueLegacyPlayer;
