RedBlue.MSE = {
  "buffers": [],
  "bufferLoading": false,
  "endOfStream": false,
  "sourceBuffer": null,
  "mediaSource": null,
  "mediaSegment": null,
  "checkStatus": null,
  "checkStatusBuffer": null, // Do we really need 2?

  "supported": function() {
    window.MediaSource = window.MediaSource || window.WebKitMediaSource;
    
    if ( !!!window.MediaSource ) {
      alert( 'MediaSource API is not supported.' );
      return false;
    }

    return true;
  },

  "onSourceOpen": function( event ) {
    console.log( '--MSE.onSourceOpen()--' );

    // Why would sourceopen even fire again after the first time???
    if ( !RedBlue.MSE.endOfStream ) {
      // 'video/webm; codecs="vorbis,vp8"'
      // 
      RedBlue.MSE.sourceBuffer = RedBlue.MSE.mediaSource.addSourceBuffer( RedBlue.DEBUG_BUFFER_TYPE );
    } else {
      return false;
    }

    if ( !RedBlue.XML.xmlLoaded ) {
      // Load playlist
      RedBlue.XML.import( 'db/redblue.ovml.xml' );
    } else {
      console.log( '--XML already loaded--' );
      RedBlue.XHR.GET( RedBlue.mediaQueue[0].path, RedBlue.mediaQueue[0].type, RedBlue.Reader.init );
    }
  },

  "onSourceEnded": function( event ) {
    RedBlue.MSE.mediaSource = event.target;
    console.log('mediaSource readyState: ' + RedBlue.MSE.mediaSource.readyState);
  },

  "isReady": function() {
    if ( !RedBlue.MSE.mediaSource.sourceBuffers[0] ) {
      console.log( 'NOT READY: !mediaSource.sourceBuffers[0]' );
      return false;
    }

    if ( RedBlue.MSE.mediaSource.sourceBuffers[0].updating ) {
      console.log('NOT READY: mediaSource.sourceBuffers[0].updating');
      return false;
    }

    if ( RedBlue.MSE.mediaSource.readyState !== "open" ) {
      console.log( 'NOT READY: mediaSource.readyState !== "open"', RedBlue.MSE.mediaSource.readyState );
      return false;
    }

    if ( RedBlue.MSE.mediaSource.sourceBuffers[0].mode == "PARSING_MEDIA_SEGMENT" ) {
      console.log( 'NOT READY: mediaSource.sourceBuffers[0].mode == PARSING_MEDIA_SEGMENT' );
      return false;
    }

    if ( RedBlue.mediaQueue.length === 0 ) {
      console.log( 'NOT READY: RedBlue.mediaQueue.length === 0' );
      return false;
    }

    console.log( 'READY' );
    return true;
  }
};

RedBlue.MSEPlayer = extend(RedBlue.__Player, {
  "init": function( skipEventListeners ) {
    console.log( '--init()--' );
    // https://html5-demos.appspot.com/static/media-source.html

    RedBlue.MSE.mediaSource = new window.MediaSource();
    this.video.src = window.URL.createObjectURL( RedBlue.MSE.mediaSource );
    this.video.pause();

    this.choicesContainer.innerHTML = '';
    this.choicesContainer.removeEventListener( 'click', RedBlue.MSEPlayer.Events.choiceClicked, false );
    this.choicesContainerCounter = 0;
    this.choicesCounter = 0;

    //if ( !skipEventListeners ) {
      this.choicesContainer.addEventListener( 'click', RedBlue.MSEPlayer.Events.choiceClicked, false );

      RedBlue.MSE.mediaSource.addEventListener( 'sourceopen', RedBlue.MSE.onSourceOpen, false );

      RedBlue.MSE.mediaSource.addEventListener( 'sourceended', RedBlue.MSE.onSourceEnded, false );
    //}
  },

  "checkStatusInterval": function() {
    var appended = RedBlue.Player.getAndPlay();

    if ( appended ) {
      clearInterval( RedBlue.MSE.checkStatus );
    }
  },

  "playNextWhenReady": function() {
    console.log( '--Player.playNextWhenReady()--' );

    clearInterval( RedBlue.MSE.checkStatus );

    RedBlue.MSE.checkStatus = setInterval( RedBlue.Player.checkStatusInterval, RedBlue.POLLING_INTERVAL );
  },

  "appendBufferWhenReady": function() {
    console.log( '--Player.appendBufferWhenReady()--' );
    clearInterval( RedBlue.MSE.checkStatusBuffer );

    RedBlue.MSE.checkStatusBuffer = setInterval( RedBlue.Player.checkStatusBufferInterval, RedBlue.POLLING_INTERVAL );
  },

  //"Events": {},

  "getAndPlay": function() {
    console.log( '--getAndPlay()--' );
    // Make sure the previous append is not still pending.
    var ready = RedBlue.MSE.isReady();

    if ( !ready ) {
      return false;
    }

    //console.log( 'RedBlue.mediaQueue.length', RedBlue.mediaQueue.length );

    // This is already checked in MSE.isReady. Am I going insane?
    if ( RedBlue.mediaQueue.length === 0 ) {
      return false;
    }

    RedBlue.XHR.GET( RedBlue.mediaQueue[0].path, RedBlue.mediaQueue[0].type, RedBlue.Reader.init );

    return true;
  },

  "checkStatusBufferInterval": function() {
    var ready = RedBlue.MSE.isReady();
    var firstSegmentDuration;

    //console.log( 'MSE.isReady', ready );

    if ( ready ) {
      clearInterval( RedBlue.MSE.checkStatusBuffer );

      RedBlue.duration = RedBlue.MSE.mediaSource.duration || 0;

      //console.log('Duration: ' + RedBlue.duration);

      RedBlue.MSE.sourceBuffer.timestampOffset = RedBlue.duration;

      RedBlue.MSE.sourceBuffer.appendBuffer( RedBlue.MSE.mediaSegment );

      if ( !RedBlue.Player.firstSegmentAppended ) {
        firstSegmentDuration = RedBlue.duration;

        RedBlue.Player.video.addEventListener( 'timeupdate', RedBlue.Player.Events.presentChoice );

        RedBlue.Player.firstSegmentAppended = true;
      }

      if ( RedBlue.Player.video.paused ) {
        RedBlue.Player.video.play(); // Start playing after 1st chunk is appended.
      }
      
      RedBlue.mediaQueue = RedBlue.mediaQueue.slice( 1 );

      if ( RedBlue.mediaQueue.length > 0 ) {
        RedBlue.Player.playNextWhenReady();
      }
    }
  },

  "readPlaylistItem": function( uInt8Array, type ) {
    type = type || RedBlue.DEBUG_MIME_TYPE; //'video/webm';
    
    var file = new Blob(
      [uInt8Array],
      {
        type: type
      }
    );

    var reader = new FileReader();

    reader.onloadstart = function ( event ) {
      RedBlue.MSE.bufferLoading = true;
    };

    reader.onload = function ( event ) {
      RedBlue.MSE.buffers.push( new Uint8Array( event.target.result ) );
      RedBlue.MSE.bufferLoading = false;
      //console.log(buffers);
    };

    //console.log( file );
    reader.readAsArrayBuffer( file );
  }
});