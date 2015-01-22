/*jshint laxcomma:true, smarttabs:true, globalstrict: true */
/*
 * RedBlue
 * Open-Source Interactive Video Framework
 *
 * VERSION: 0.1-alpha
 * MODIFIED: 2015-01-21 22:33:56
 * LICENSE: GPLv3
 *
 * References:
 * - http://www.w3.org/TR/media-source/#examples
 * - https://github.com/jbochi/media-source-playground/blob/master/test.html
*/
//(function () {
"use strict";

if ( typeof console == "undefined" ) {
  var console = {
    log: function () {}
  };
}

if ( typeof alert == "undefined" ) {
  var alert = function () {};
}

// http://j201.github.io/posts/2013-06-22-JS-Object-Literal-Inheritance.html
function extend( proto, literal ) {
  var result = Object.create( proto );

  Object.keys( literal ).forEach(function(key) {
    result[key] = literal[key];
  });

  return result;
}

// ES3-compat
// var extend = function() {
//   function F(){}
//   return function(proto, literal) {
//       F.prototype = proto;
//       var result = new F();
//       for (var prop in literal) {
//           if (literal.hasOwnProperty(prop)) {
//               result[prop] = literal[prop];
//           }
//       }
//       return result;
//   };
// }();

var bufferTypes = {
  'webm': 'video/webm; codecs="vorbis,vp8"',
  'mp4': 'video/mp4; codecs="avc1.42E01E,mp4a.40.2"'
};

var mimeTypes = {
  'webm': 'video/webm',
  'mp4': 'video/mp4'
};

var RedBlue = RedBlue || {
  "DEBUG_MODE": true,
  //"DEBUG_MEDIA": 'mp4',
  "DEBUG_MEDIA": 'webm',

  //"POLLING_INTERVAL": 1000, // 1 second
  //"POLLING_INTERVAL": 41.66666666667, // 1/24 second
  //"POLLING_INTERVAL": 33.33333333333, // 1/30 second
  //"POLLING_INTERVAL": 20.83333333333, // 1/48 second
  "POLLING_INTERVAL": 16.66666666667, // 1/60 second

  // Past this point, errors: second video gets appended twice, third not at all, because shit is not ready
  //"POLLING_INTERVAL": 8.33333333333, // 1/120 second
  //"POLLING_INTERVAL": 1, // 1/1000 second
  
  "duration": 0,
  
  "mediaQueue": [],
  "mediaQueueHistory": [],

  "totalVideos": 0,
  
  "fileTypePreferences": [],
  //"replacing": false,
};

RedBlue.init = (function() {
  if ( !RedBlue.DEBUG_MODE ) {
    console.log = function () {};
  }

  RedBlue.DEBUG_BUFFER_TYPE = bufferTypes[RedBlue.DEBUG_MEDIA];
  RedBlue.DEBUG_MIME_TYPE = mimeTypes[RedBlue.DEBUG_MEDIA];

  switch ( RedBlue.DEBUG_MEDIA ) {
    case 'mp4':
      RedBlue.fileTypePreferences = [
        {
          'video/mp4': {
            'video': ['avc1.42E01E'],
            'audio': ['mp4a.40.2'],
          }
        }
      ];
    break;

    case 'webm':
      RedBlue.fileTypePreferences = [
        {
          'video/webm': {
            'video': ['vp9', 'vp8'],
            'audio': ['vorbis']
          }
        }
      ];
    break;
  }
})();

RedBlue.XHR = {
  "GET": function( url, type, callback ) {
    console.log( '--XHR.GET()--' );

    var xhr = new XMLHttpRequest();
    xhr.open( 'GET', url, true );
    xhr.responseType = 'arraybuffer';
    xhr.send();

    xhr.onload = function ( event ) {
      if ( xhr.status !== 200 ) {
        console.log( "Unexpected status code " + xhr.status + " for " + url );
        return false;
      }
      callback( new Uint8Array( xhr.response ) );
    };
  }
};

RedBlue.XLink = {
  "get": function( node ) {
    //console.log( 'XLink.get called on', node );
    return node.getAttributeNS( RedBlue.XML.ns.xlink, 'href' );
  },

  "getQuery": function( node ) {
    return RedBlue.XPointer.parse( RedBlue.XLink.get( node ) );
  },

  "getNodes": function ( refNode ) {
    return RedBlue.XML.getNodes( RedBlue.XLink.getQuery( refNode ) );
  }
}; // XLink

RedBlue.XPointer = {
  "parse": function( xlinkHref ) {
    // Hack: use a real XPointer parser; this is limited to XPath-only expressions (though probably serves majority of use cases)
    xlinkHref = xlinkHref.replace( /#xpointer\((.*)\)/gi, '$1' );

    xlinkHref = xlinkHref.replace( /#([a-zA-Z_\-]+)$/gi, '//*[@xml:id="$1"]' );

    return xlinkHref;
  }
}; // XPointer

RedBlue.OVML = {
  "getMime": function( fileElement ) {
    var returnVal = RedBlue.XML.getNodes( 'container/mime', fileElement ).iterateNext();

    if ( returnVal ) {
      return returnVal.textContent;
    }

    // for images etc. with no container format
    returnVal = RedBlue.XML.getNodes( 'codec/mime', fileElement ).iterateNext();

    if ( returnVal ) {
      return returnVal.textContent;
    }

    return returnVal;
  },

  "parse": {
    "playlist": function( XPathResult ) {
      var playlistElement = XPathResult.iterateNext();
      var playlistType = playlistElement.getAttribute( 'type' );

      switch ( playlistType ) {
        case 'linear':
        break;

        case 'nonlinear':
          RedBlue.OVML.parse.nonlinearPlaylistItems( playlistElement );
        break;

        default:
      }
    },

    "mediaElement": function( playlistItem ) {
      var containers = [];
      var container;
      var fileElement;
      var i;
      var mediaFile;
      var plGrandchild;
      var query;
      var obj;

      query = RedBlue.XLink.getQuery( playlistItem );

      mediaFile = RedBlue.XML.getNodes( query ); // This will return both webm and mp4

      fileElement = mediaFile.iterateNext();

      console.log( RedBlue.fileTypePreferences );

      // @todo: canPlayType
      while ( fileElement ) {
        for ( i = RedBlue.fileTypePreferences.length - 1; i >= 0; --i ) {
          for ( var mime in RedBlue.fileTypePreferences[i] ) {
            container = RedBlue.XML.getNodes( 'container[./mime[text() = "' + mime + '"]]', fileElement ).iterateNext();
            
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
          'path': RedBlue.XLink.get( containers[0]['node'].parentElement )
        };

        RedBlue.mediaQueue.push( obj );
        RedBlue.mediaQueueHistory.push( obj );
      }

      if ( playlistItem.children.length > 0 ) {
        for ( i = playlistItem.children.length - 1; i >= 0; --i) {
          plGrandchild = playlistItem.children[i];

          switch( plGrandchild.localName ) {
            case 'goto':
              query = RedBlue.XLink.getQuery( plGrandchild );

              if ( query ) {
                RedBlue.OVML.parse.nonlinearPlaylistItems( RedBlue.XML.getNodes( query ).iterateNext() );
              }
            break;
          }
        }
      } else {
        RedBlue.MSE.endOfStream = true;
        RedBlue.Player.playNextWhenReady();
      }
    },

    "choicesElement": function( playlistItem ) {
      var choicesBg = RedBlue.XML.getNodes( 'media', playlistItem ).iterateNext();
      var choices = RedBlue.XML.getNodes( 'choice', playlistItem );
      var choicesName = RedBlue.XML.getNodes( 'name', playlistItem ).iterateNext().textContent;
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

      console.log('encountered a choice');

      ++RedBlue.Player.choicesContainerCounter;

      // static bg - use poster frame?
      // http://stackoverflow.com/a/19457115/214325

      while ( choice ) {
        playlistActionElements = RedBlue.XML.getNodes( 'playlistAction', choice );
        playlistActionElement = playlistActionElements.iterateNext();

        while ( playlistActionElement ) {
          var playlistActionMethod = playlistActionElement.getAttribute( 'method' );
          
          if ( playlistActionMethod ) {
            playlistActions.push( playlistActionMethod );
          } else {
            playlistActions.push( choice.getAttributeNS( RedBlue.XML.ns.xml, 'id' ) );
          }

          playlistActionElement = playlistActionElements.iterateNext();
        }

        gotoElement = RedBlue.XML.getNodes( 'goto', choice ).iterateNext();

        //console.log( 'gotoElement', gotoElement );

        xlinkHref = RedBlue.XLink.get( gotoElement );
        query = RedBlue.XPointer.parse( xlinkHref );
        timeline = gotoElement.getAttribute( 'timeline' );

        mediaElement = RedBlue.XML.getNodes( query ).iterateNext();

        query = RedBlue.XLink.getQuery( mediaElement );
        fileElement = RedBlue.XML.getNodes( query ).iterateNext(); // @todo: filter by filetype/etc.
        fileMime = RedBlue.OVML.getMime( fileElement );

        choiceLetter = String.fromCharCode( 64 + choicesCounter ).toLowerCase();
        
        // @todo: Instead of storing in the DOM, just keep track of the damn things (right?)
        choicesHTML += [
          '<li>',
            '<a id="choice-', RedBlue.Player.choicesContainerCounter, choiceLetter, '"',
              ' class="choice choice-', choiceLetter, '"',
              ' href="javascript:void(0);"',
              ' data-actions="[\'', playlistActions.join("','"), '\']"',
              ' data-goto="', xlinkHref, '"',
              ' data-play="', RedBlue.XLink.get( fileElement ), '"',
              ' data-type="', fileMime, '"',
              ( timeline ? ' data-timeline="' + timeline + '"' : '' ),
              '>', RedBlue.XML.getNodes( 'name', choice ).iterateNext().textContent,
            '</a>',
          '</li>'
        ].join('');

        choice = choices.iterateNext();
        ++choicesCounter;
      }
      choicesHTML += '</ul>';

      RedBlue.Player.choicesContainer.innerHTML += '<nav id="choice-' + RedBlue.Player.choicesContainerCounter + '" class="choices" hidden="hidden"><div class="container"><h2>' + choicesName + '</h2>' + choicesHTML + '</div></nav>';

      RedBlue.Player.choiceContainer = document.getElementById( 'choice-' + RedBlue.Player.choicesContainerCounter );

      // if bg
      fileElement = RedBlue.XLink.getNodes( choicesBg ).iterateNext();
      fileMime = RedBlue.OVML.getMime( fileElement );
      file = RedBlue.XLink.get( fileElement );

      switch ( fileMime ) {
        case 'image/jpeg':
        case 'image/png':
        case 'image/gif':
        case 'image/webp':
          RedBlue.Player.choiceContainer.style.backgroundImage = 'url(' + file + ')';
          RedBlue.Player.choiceContainer.style.backgroundRepeat = 'no-repeat';
          RedBlue.Player.choiceContainer.style.backgroundSize = 'contain';
        break;

        default:
          console.log('Choice background image file type "' + fileMime + '" not supported.');
      }
    }, // parse.choicesElement

    "nonlinearPlaylistItems": function( playlistItems ) {
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
          RedBlue.OVML.parse.mediaElement( playlistItem );
        break;

        case 'choices':
          RedBlue.OVML.parse.choicesElement( playlistItem );
        break;
      }
    } // nonlinearPlaylistItems
  } // parse
}; // OVML

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

RedBlue.__Player = {
  "choiceContainer": null,
  
  "choices": document.querySelectorAll( '.choice' ),
  "choicesCounter": 0,
  "choicesContainer": document.getElementById( 'choices-container' ),
  "choicesContainerCounter": 0,
  
  "firstChoiceSelected": false,

  "video": document.getElementById( 'v' ),

  "firstSegmentAppended": false,
  "lastSegmentAppended": false,

  "Events": {
    "choiceClicked": function( event ) {
      console.log( '--Player.Events.choiceClicked()--' );
      event.preventDefault();

      var link = event.target;
      var id = link.id;

      //console.log( 'clicked choice:', link );

      RedBlue.Player.choiceContainer.setAttribute('hidden', 'hidden');
      RedBlue.Player.choiceContainer.hidden = true;
      RedBlue.Player.firstChoiceSelected = true;
      RedBlue.Player.lastSegmentAppended = true;

      var replaceTimeline = ( link.getAttribute( 'data-timeline' ) === 'replace' );

      if ( replaceTimeline ) {
        console.log ( '--Replacing stream--' );

        // this mostly works but for some reason double-append of intro at the beginning
        //initVars();

        RedBlue.XML.xmlLoaded = true;

        RedBlue.Player.init();
      }

      RedBlue.OVML.parse.nonlinearPlaylistItems(
        RedBlue.XML.getNodes(
          RedBlue.XPointer.parse(
            link.getAttribute( 'data-goto' )
          ) // XPointer.parse
        ) // XML.getNodes
        .iterateNext()
      ); // OVML.parse.nonlinearPlaylistItems
      
      console.log( '--Player.getAndPlay()--' );
      RedBlue.Player.getAndPlay();
    },

    "presentChoice": function( event ) {
      // toFixed works around a Firefox bug but makes it slightly less accurate
      // @todo: Maybe detect Firefox and implement this conditionally? But then inconsistent playback experience.
      // Imprecision may not matter if it's going to be an overlay onto bg video.
      var videoPlayer = event.target; // this
      var currentTime = +videoPlayer.currentTime.toFixed(0);
      var currentDuration = +videoPlayer.duration.toFixed(0);

      if ( currentTime === currentDuration ) {

        console.log( 'choice presented' );

        RedBlue.Player.choiceContainer.removeAttribute( 'hidden' );
        RedBlue.Player.choiceContainer.hidden = false;

        //console.log( RedBlue.Player.choiceContainer );

        // @todo: This could stay here if there were a reliable way to dynamically re-attach (not saying there isn't; just not sure why it's not already happpening)
        //this.removeEventListener( 'timeupdate', presentChoice );
      }
    }
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
    if ( !RedBlue.Player.firstSegmentAppended ) {
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
  },

  "getAndPlay": function () {
    if ( RedBlue.mediaQueue.length === 0 ) {
      return false;
    }

    RedBlue.Player.video.src = RedBlue.mediaQueue[0].path;

    //RedBlue.XHR.GET( RedBlue.mediaQueue[0].path, RedBlue.mediaQueue[0].type, RedBlue.Reader.init );

    return true;
  },

  "checkStatusInterval": function() {
    RedBlue.Player.getAndPlay();
  },

  "playNextWhenReady": function() {
    console.log( '--Player.playNextWhenReady()--' );

    RedBlue.Player.checkStatusInterval();
  }
});

RedBlue.Reader = {
  "onload": function( event ) {
    console.log( '--reader.onload--');
    RedBlue.MSE.mediaSegment = new Uint8Array( event.target.result );
    RedBlue.Player.appendBufferWhenReady();
  },

  "init": function( uInt8Array ) {
    console.log( '--GET callback--');
    var buffer = 0;
    var type = RedBlue.mediaQueue[0].type || RedBlue.DEBUG_BUFFER_TYPE; //'video/webm',

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
    reader.onload = RedBlue.Reader.onload;

    reader.readAsArrayBuffer( file );
  }
};

RedBlue.XML = {
  "xmlDoc": null,
  "xmlLoaded": false,
  "evaluator": new XPathEvaluator(),
  "nsResolver": null,
  "ns": {
    "xml": "http://www.w3.org/XML/1998/namespace"
  },

  "getNodes": function( xpath, refNode, xpathType ) {
    refNode = refNode || RedBlue.XML.xmlDoc;
    xpathType = xpathType || XPathResult.ORDERED_NODE_ITERATOR_TYPE;

    return RedBlue.XML.evaluator.evaluate(
      xpath,
      refNode,
      RedBlue.XML.nsResolver,
      //ns.ovml,g
      //null,
      xpathType,
      null
    );
  }, // getNodes

  "read": function() {
    var result;
    var element;

    RedBlue.XML.ns.defaultNS = RedBlue.XML.xmlDoc.documentElement.getAttribute( 'xmlns' );
    RedBlue.XML.ns.ovml = RedBlue.XML.xmlDoc.documentElement.getAttribute( 'xmlns:ovml' );
    RedBlue.XML.ns.xlink = RedBlue.XML.xmlDoc.documentElement.getAttribute( 'xmlns:xlink' );
    //ns.xml = 'http://www.w3.org/XML/1998/namespace';

    RedBlue.XML.nsResolver = RedBlue.XML.evaluator.createNSResolver( RedBlue.XML.xmlDoc.documentElement );

    result = RedBlue.XML.getNodes( '/ovml/video/presentation/playlist' );

    if ( result ) {
      RedBlue.OVML.parse.playlist( result );
    }
  }, // read

  "import": function( xmlFile ) {
    console.log( '--XML.import()--' );
    var xhr = new XMLHttpRequest();

    xhr.open( 'GET', xmlFile, true );
    xhr.setRequestHeader( 'Content-Type', 'text/xml' ); // application/ovml+xml
    xhr.onload = function xhrOnLoad( event ) {
      switch ( xhr.status ) {
        case 200:
          RedBlue.XML.xmlDoc = xhr.responseXML;
          RedBlue.XML.read();

          //console.log( 'RedBlue.mediaQueue', RedBlue.mediaQueue );

          for ( var i = RedBlue.mediaQueue.length - 1; i >= 0; --i ) {
            RedBlue.XHR.GET( RedBlue.mediaQueue[i].path, RedBlue.mediaQueue[i].type, RedBlue.Player.readPlaylistItem );
          }

          console.log( '--import()--');
          RedBlue.Player.getAndPlay();
        break;

        default:
      }
    };
    xhr.send( '' );
  } // import
}; // XML

// if ( RedBlue.MSE.supported() ) {
//   RedBlue.Player = RedBlue.MSEPlayer;
// } else {
  RedBlue.Player = RedBlue.LegacyPlayer;
// }

RedBlue.Player.init();
//})();