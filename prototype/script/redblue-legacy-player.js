/* eslint-disable */
RedBlue.LegacyPlayer = extend(RedBlue.__Player, {
  "init": function () {
    console.log( '--init()--' );

    //video.src = window.URL.createObjectURL( mediaSource );
    this.video.pause();

    this.choicesContainer.innerHTML = '';
    this.choicesContainer.removeEventListener( 'click', RedBlue.LegacyPlayer.Events.choiceClicked, false );
    this.choicesContainerCounter = 0;
    this.choicesCounter = 0;

    this.choicesContainer.addEventListener( 'click', RedBlue.LegacyPlayer.Events.choiceClicked, false );

    // console.log( 'this.choicesContainer', this.choicesContainer );
    // console.log( 'RedBlue.Player.choicesContainer', RedBlue.Player.choicesContainer );
    // console.log( 'this.choicesContainer === RedBlue.Player.choicesContainer', this.choicesContainer === RedBlue.Player.choicesContainer )

    if ( !RedBlue.XML.xmlLoaded ) {
      // Load playlist
      RedBlue.XML.import( 'db/redblue.ovml.xml' );
    } else {
      console.log( '--XML already loaded--' );

      RedBlue.XHR.GET( RedBlue.mediaQueue[0].path, RedBlue.mediaQueue[0].type, RedBlue.LegacyPlayer.readPlaylistItem );
    }

    //RedBlue.LegacyPlayer.video.src =
  },

  "readPlaylistItem": function () {
    // if ( !RedBlue.Player.firstSegmentAppended ) {
    // RedBlue.Player.video.addEventListener( 'timeupdate', RedBlue.Player.Events.presentChoice );

    RedBlue.Player.firstSegmentAppended = true;
    // }

    if ( RedBlue.Player.video.paused ) {
      RedBlue.Player.video.play(); // Start playing after 1st chunk is appended.
    }

    // RedBlue.mediaQueue = RedBlue.mediaQueue.slice( 1 );

    // if ( RedBlue.mediaQueue.length > 0 ) {
    //   // RedBlue.Player.playNextWhenReady();
    //   RedBlue.Player.play();
    // }
  },

  "play": function () {
    if ( RedBlue.mediaQueue.length === 0 ) {
      return false;
    }

    if ( RedBlue.Player.isPlaying() ) {
      RedBlue.Player.video.pause();
    }

    RedBlue.Player.video.src = RedBlue.mediaQueue[0].path;

    RedBlue.mediaQueue = RedBlue.mediaQueue.slice( 1 );

    // RedBlue.Player.video.play();

    //RedBlue.XHR.GET( RedBlue.mediaQueue[0].path, RedBlue.mediaQueue[0].type, RedBlue.Reader.init );

    return true;
  },

  // "checkStatusInterval": function() {
  //   RedBlue.Player.play();
  // },

  // "playNextWhenReady": function() {
  //   console.log( '--Player.playNextWhenReady()--' );

  //   // RedBlue.Player.checkStatusInterval();
  //   RedBlue.Player.play();
  // }
});