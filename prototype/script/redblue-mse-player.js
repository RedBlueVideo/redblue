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
    var appended = RedBlue.Player.play();

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

  "play": function() {
    console.log( '--play()--' );
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