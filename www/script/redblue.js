/*jshint laxcomma:true, smarttabs:true, globalstrict: true */
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

var DEBUG_MODE = true;
//var DEBUG_MEDIA = 'mp4';
var DEBUG_MEDIA = 'webm';

//var POLLING_INTERVAL = 1000; // 1 second
//var POLLING_INTERVAL = 41.66666666667; // 1/24 second
//var POLLING_INTERVAL = 33.33333333333; // 1/30 second
//var POLLING_INTERVAL = 20.83333333333; // 1/48 second
var POLLING_INTERVAL = 16.66666666667; // 1/60 second

// Past this point, errors: second video gets appended twice, third not at all, because shit is not ready
//var POLLING_INTERVAL = 8.33333333333; // 1/120 second
//var POLLING_INTERVAL = 1; // 1/1000 second

if ( !DEBUG_MODE ) {
  console.log = function () {};
}

var bufferTypes = {
  'webm': 'video/webm; codecs="vorbis,vp8"',
  'mp4': 'video/mp4; codecs="avc1.42E01E,mp4a.40.2"'
};

var mimeTypes = {
  'webm': 'video/webm',
  'mp4': 'video/mp4'
};

var xmlDoc;
var xmlLoaded = false;
var evaluator = new XPathEvaluator();
var nsResolver;
var ns = {
  "xml": "http://www.w3.org/XML/1998/namespace"
};
var fileTypePreferences = [];

if ( DEBUG_MEDIA === 'mp4' ) {
  fileTypePreferences = [
    {
      'video/mp4': {
        'video': ['avc1.42E01E'],
        'audio': ['mp4a.40.2'],
      }
    }
  ];
} else if ( DEBUG_MEDIA === 'webm' ) {
  fileTypePreferences = [
    {
      'video/webm': {
        'video': ['vp9', 'vp8'],
        'audio': ['vorbis']
      }
    }
  ];
}

var DEBUG_BUFFER_TYPE = bufferTypes[DEBUG_MEDIA];
var DEBUG_MIME_TYPE = mimeTypes[DEBUG_MEDIA];

var mediaQueue = [];
var choicesContainer = document.getElementById( 'choices-container' );
var choicesCounter = 0;

// http://www.w3.org/TR/media-source/#examples
// https://github.com/jbochi/media-source-playground/blob/master/test.html
var buffers = [];
var totalVideos;
var duration = 0;
var bufferLoading = false;
var video = document.getElementById( 'v' );
//var duration;
var mediaSource; //= new MediaSource();
var mediaSegment;
var mediaQueueHistory = [];
var checkStatus;
var checkStatusBuffer; // Do we really need 2?
var choiceContainer;
var choicesContainerCounter = 0;
var choices = document.querySelectorAll( '.choice' );
var choicesName;
var firstChoiceSelected = false;
var firstSegmentAppended = false;
var lastSegmentAppended = false;
var sourceBuffer;
var gotoElement;
var fileMime;
var obj;
var endOfStream = false;
//var replacing = false;

function initVars() {
  //mediaQueue = [];
  choicesContainer = document.getElementById( 'choices-container' );
  choicesCounter = 0;

  // http://www.w3.org/TR/media-source/#examples
  // https://github.com/jbochi/media-source-playground/blob/master/test.html
  buffers = [];
  totalVideos = null;
  duration = 0;
  bufferLoading = false;
  video = document.getElementById( 'v' );
  //duration;
  //mediaSource = new MediaSource();
  mediaSegment = null;
  //mediaQueueHistory = [];
  checkStatus = null;
  checkStatusBuffer = null; // Do we really need 2?
  choiceContainer = null;
  choicesContainerCounter = 0;
  choices = document.querySelectorAll( '.choice' );
  choicesName = null;
  firstChoiceSelected = false;
  firstSegmentAppended = false;
  lastSegmentAppended = false;
  sourceBuffer = null;
  gotoElement = null;
  fileMime = null;
  obj = null;
  endOfStream = false;
  //replacing = false;
  xmlLoaded = false;
}

function readPlaylistItem( uInt8Array, type ) {
  type = type || DEBUG_MIME_TYPE; //'video/webm';
  
  var file = new Blob(
    [uInt8Array],
    {
      type: type
    }
  );

  var reader = new FileReader();

  reader.onloadstart = function ( event ) {
    bufferLoading = true;
  };

  reader.onload = function ( event ) {
    buffers.push( new Uint8Array( event.target.result ) );
    bufferLoading = false;
    //console.log(buffers);
  };

  console.log( file );
  reader.readAsArrayBuffer( file );
}

function GET( url, type, callback ) {
  console.log( '--GET()--' );
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

function getNodes( xpath, refNode, xpathType ) {
  refNode = refNode || xmlDoc;
  xpathType = xpathType || XPathResult.ORDERED_NODE_ITERATOR_TYPE;

  return evaluator.evaluate(
    xpath,
    refNode,
    nsResolver,
    //ns.ovml,g
    //null,
    xpathType,
    null
  );
}

function getMime( fileElement ) {
  var returnVal = getNodes( 'container/mime', fileElement ).iterateNext();

  if ( returnVal ) {
    return returnVal.textContent;
  }

  // for images etc. with no container format
  returnVal = getNodes( 'codec/mime', fileElement ).iterateNext();

  if ( returnVal ) {
    return returnVal.textContent;
  }

  return returnVal;
}

function getNodesFromXLink( refNode ) {
  return getNodes( getQueryFromXLink( refNode ) );
}

// function nsResolver( prefix ) {
//   prefix = prefix || 'ovml';

//   var ns = {
//     'ovml': 'http://vocab.nospoon.tv/ovml#',
//     'xlink': 'http://www.w3.org/1999/xlink'
//   };

//   //if ( ns.hasOwnProperty( prefix ) ) {
//     return ns[prefix];
//   //}

//   //return null;
// }

function readXML() {
  var result;
  var element;

  ns.defaultNS = xmlDoc.documentElement.getAttribute( 'xmlns' );
  ns.ovml = xmlDoc.documentElement.getAttribute( 'xmlns:ovml' );
  ns.xlink = xmlDoc.documentElement.getAttribute( 'xmlns:xlink' );
  //ns.xml = 'http://www.w3.org/XML/1998/namespace';

  // WTFXML? The hackiest bullshit I have ever seen.
  // if ( ns.defaultNS ) {
  //   xmlDoc.documentElement.removeAttribute( 'xmlns' );
  //   xmlDoc.documentElement.namespaceURI = null;
  //   console.log( xmlDoc.documentElement );
  // }

  nsResolver = evaluator.createNSResolver( xmlDoc.documentElement );

  //console.log( xmlDoc.documentElement );
  //console.log( nsResolver );

  result = getNodes( '/ovml/video/presentation/playlist' );

  //console.log(result);

  if ( result ) {
    parsePlaylist( result );
  }
}

function getXLink( node ) {
  console.log( 'getXLink called on', node );
  return node.getAttributeNS( ns.xlink, 'href' );
}

function getQueryFromXLink( node ) {
  return parseXPointer( getXLink( node ) );
}

function parsePlaylist( XPathResult ) {
  var playlistElement = XPathResult.iterateNext();
  var playlistType = playlistElement.getAttribute( 'type' );

  switch ( playlistType ) {
    case 'linear':
    break;

    case 'nonlinear':
      parseNonlinearPlaylistItems( playlistElement );
    break;

    default:
  }
}

function parseXPointer( xlinkHref ) {
  // Hack: use a real XPointer parser; this is limited to XPath-only expressions (though probably serves majority of use cases)
  // if ( xlinkHref.indexOf( '#xpointer(' ) !== -1 ) {
  //   return xlinkHref.substring( xlinkHref.indexOf( '#xpointer(' ) + 1, xlinkHref.indexOf( ')' ) );
  // }

  // if ( xlinkHref.indexOf( '#' ) === 0 ) {
  //   return xlinkHref.replace( '#', 'id' );
  // }

  xlinkHref = xlinkHref.replace( /#xpointer\((.*)\)/gi, '$1' );

  xlinkHref = xlinkHref.replace( /#([a-zA-Z_\-]+)$/gi, '//*[@xml:id="$1"]' );

  return xlinkHref;
}

function parseNonlinearPlaylistItems( playlistItems ) {
  console.log( '--parseNonlinearPlaylistItems()--' );
  console.log( 'playlistItems', playlistItems );
  // console.log( playlistItems );
  // console.log( playlistItems.localName );
  // console.log( playlistItems.children );
  // console.log( playlistItems.children.length );

  var playlistItem;

  // hasOwnProperty('children') does not work in Firefox
  if ( ( playlistItems.localName === 'playlist' ) && playlistItems.children && playlistItems.children.length > 0 ) {
    playlistItem = playlistItems.children[0];
    console.log( 'playlistItem', playlistItem );
  } else {
    playlistItem = playlistItems;
    console.log( 'playlistItem', playlistItem );
  }

  var i;
  var containers = [];
  var plGrandchild;
  var xlinkHref;
  var mediaFile;
  var mediaElement;
  var file;
  var fileElement;
  var container;
  var query;
  var choicesBg;
  var choices;
  var choice;
  var choicesHTML = '<ul>';
  var playlistActions = [];
  var playlistActionElements;
  var playlistActionElement;

  //console.log( playlistItem.getAttribute('xml:id') );
  
  switch ( playlistItem.localName ) {
    case 'media':
      query = getQueryFromXLink( playlistItem );

      mediaFile = getNodes( query ); // This will return both webm and mp4

      fileElement = mediaFile.iterateNext();

      // @todo: canPlayType
      while ( fileElement ) {
        for ( i = fileTypePreferences.length - 1; i >= 0; --i ) {
          for ( var mime in fileTypePreferences[i] ) {
            container = getNodes( 'container[./mime[text() = "' + mime + '"]]', fileElement ).iterateNext();
            
            if ( container ) {
              containers.push( { 'mime': mime, 'node': container} );
              //break;
            }
            //console.log( getNodes( 'codec/mime[text() = "' +  + '"]', fileElement ).iterateNext() );
          }

          // if ( container ) {
          //   break;
          // }
        }

        // if ( container ) {
        //   break;
        // }

        fileElement = mediaFile.iterateNext();
      }

      if ( containers.length > 0 ) {
        obj = {
          //'type': 'media',
          'mime': containers[0]['mime'],
          'path': getXLink( containers[0]['node'].parentElement ),
          'line': 440
        };

        mediaQueue.push( obj );
        mediaQueueHistory.push( obj );
      }

      //console.log( playlistItem.children.length );

      if ( playlistItem.children.length > 0 ) {
        for ( i = playlistItem.children.length - 1; i >= 0; --i) {
          plGrandchild = playlistItem.children[i];

          switch( plGrandchild.localName ) {
            case 'goto':
              query = getQueryFromXLink( plGrandchild );

              if ( query ) {
                parseNonlinearPlaylistItems( getNodes( query ).iterateNext() );
              }
            break;
          }
        }
        //console.log( 'had some grandchildren' );
      } else {
        // fileElement = getNodesFromXLink( playlistItem ).iterateNext();
        // var filePath = getXLink( fileElement );

        // obj = {
        //   'path': filePath,
        //   'type': getMime( fileElement ),
        //   'line': 471
        // };

        // mediaQueue.push( obj );
        // mediaQueueHistory.push( obj );

        // console.log( mediaQueue );
        endOfStream = true;
        playNextWhenReady(529);
      }
    break;

    case 'choices':
      console.log('encountered a choice');
      //console.log( playlistItem );
      //parseNonlinearPlaylistItems( playlistItem );

      choicesBg = getNodes( 'media', playlistItem ).iterateNext();
      choices = getNodes( 'choice', playlistItem );
      choice = choices.iterateNext();
      choicesName = getNodes( 'name', playlistItem ).iterateNext().textContent;
      choicesCounter = 1;
      ++choicesContainerCounter;

      // static bg - use poster frame?
      // http://stackoverflow.com/a/19457115/214325

      while ( choice ) {
        playlistActionElements = getNodes( 'playlistAction', choice );
        playlistActionElement = playlistActionElements.iterateNext();

        while ( playlistActionElement ) {
          var playlistActionMethod = playlistActionElement.getAttribute( 'method' );
          
          if ( playlistActionMethod ) {
            playlistActions.push( playlistActionMethod );
          } else {
            playlistActions.push( choice.getAttributeNS( ns.xml, 'id' ) );
          }

          playlistActionElement = playlistActionElements.iterateNext();
        }

        gotoElement = getNodes( 'goto', choice ).iterateNext();

        console.log( 'gotoElement', gotoElement );

        xlinkHref = getXLink( gotoElement );
        query = parseXPointer( xlinkHref );
        var timeline = gotoElement.getAttribute( 'timeline' );

        mediaElement = getNodes( query ).iterateNext();

        query = getQueryFromXLink( mediaElement );
        fileElement = getNodes( query ).iterateNext(); // @todo: filter by filetype/etc.
        fileMime = getMime( fileElement );

        var choiceLetter = String.fromCharCode( 64 + choicesCounter ).toLowerCase();
        
        // @todo: Instead of storing in the DOM, just keep track of the damn things (right?)
        choicesHTML += [
          '<li>',
            '<a id="choice-', choicesContainerCounter, choiceLetter, '"',
              ' class="choice choice-', choiceLetter, '"',
              ' href="javascript:void(0);"',
              ' data-actions="[\'', playlistActions.join("','"), '\']"',
              ' data-goto="', xlinkHref, '"',
              ' data-play="', getXLink( fileElement ), '"',
              ' data-type="', fileMime, '"',
              ( timeline ? ' data-timeline="' + timeline + '"' : '' ),
              '>', getNodes( 'name', choice ).iterateNext().textContent,
            '</a>',
          '</li>'
        ].join('');

        choice = choices.iterateNext();
        ++choicesCounter;
      }
      choicesHTML += '</ul>';

      choicesContainer.innerHTML += '<nav id="choice-' + choicesContainerCounter + '" class="choices" hidden="hidden"><div class="container"><h2>' + choicesName + '</h2>' + choicesHTML + '</div></nav>';

      choiceContainer = document.getElementById( 'choice-' + choicesContainerCounter );

      // if bg
      fileElement = getNodesFromXLink( choicesBg ).iterateNext();
      fileMime = getMime( fileElement );
      file = getXLink( fileElement );

      // console.log( fileElement.localName + ' + ' + fileMime );
      // console.log(fileMime);

      switch ( fileMime ) {
        case 'image/jpeg':
        case 'image/png':
        case 'image/gif':
        case 'image/webp':
          //console.log(choicesContainer);
          choiceContainer.style.backgroundImage = 'url(' + file + ')';
          choiceContainer.style.backgroundRepeat = 'no-repeat';
          choiceContainer.style.backgroundSize = 'contain';
          //console.log(choicesContainer.style.backgroundImage);
          //console.log('happened');
        break;

        default:
          console.log('Choice background image file type "' + fileMime + '" not supported.');
      }
    break;
  }
}

function mediaSourceOnSourceOpen( event ) {
  console.log( '--mediaSourceOnSourceOpen()--' );
  //var sourceBuffer = mediaSource.addSourceBuffer('video/webm; codecs="vorbis,vp8"');

  // Why would sourceopen even fire again after the first time???
  if ( !endOfStream ) {
    // 'video/webm; codecs="vorbis,vp8"'
    // 
    sourceBuffer = mediaSource.addSourceBuffer( DEBUG_BUFFER_TYPE );
  } else {
    return false;
  }

  if ( !xmlLoaded ) {
    // Load playlist
    importXML( 'db/redblue.ovml.xml' );
  } else {
    console.log( '--XML already loaded--' );
    GET( mediaQueue[0].path, mediaQueue[0].type, GET_MediaQueueCallback );
    //parseNonlinearPlaylistItems(  );
  }
}

function isMediaSourceReady() {
  if ( !mediaSource.sourceBuffers[0] ) {
    console.log( 'NOT READY: !mediaSource.sourceBuffers[0]' );
    return false;
  }

  if ( mediaSource.sourceBuffers[0].updating ) {
    console.log('NOT READY: mediaSource.sourceBuffers[0].updating');
    return false;
  }

  if ( mediaSource.readyState !== "open" ) {
    console.log( 'NOT READY: mediaSource.readyState !== "open"', mediaSource.readyState );
    return false;
  }

  if ( mediaSource.sourceBuffers[0].mode == "PARSING_MEDIA_SEGMENT" ) {
    console.log( 'NOT READY: mediaSource.sourceBuffers[0].mode == PARSING_MEDIA_SEGMENT' );
    return false;
  }

  if ( mediaQueue.length === 0 ) {
    console.log( 'NOT READY: mediaQueue.length === 0' );
    return false;
  }

  console.log( 'READY' );
  return true;
}

function checkStatusInterval() {
  console.log( '--getAndPlay() l:578--' );
  var appended = getAndPlay();

  if ( appended ) {
    clearInterval( checkStatus );

    // if ( endOfStream ) {
    //   mediaSource.endOfStream();
    // }
  }
}

function playNextWhenReady(line) {
  console.log( '--playNextWhenReady() l:' + line + '--' );

  clearInterval( checkStatus );

  checkStatus = setInterval( checkStatusInterval, POLLING_INTERVAL );
}

function checkStatusBufferInterval() {
  var ready = isMediaSourceReady();
  var firstSegmentDuration;

  console.log( 'isMediaSourceReady', ready );

  if ( ready ) {
    clearInterval( checkStatusBuffer );

    duration = mediaSource.duration || 0;

    console.log('Duration: ' + duration);

    sourceBuffer.timestampOffset = duration;
    //mediaSource.sourceBuffers[0].appendBuffer(mediaSegment);

    sourceBuffer.appendBuffer( mediaSegment );

    if ( !firstSegmentAppended ) {
      firstSegmentDuration = duration;

      //console.log( video.duration );
      //console.log( mediaSegment );
      //console.log( sourceBuffer );

      video.addEventListener( 'timeupdate', presentChoice );

      firstSegmentAppended = true;
    }

    if ( video.paused ) {
      video.play(); // Start playing after 1st chunk is appended.
    }
    
    mediaQueue = mediaQueue.slice( 1 );

    if ( mediaQueue.length > 0 ) {
      playNextWhenReady(744);
    }
  }
}

function appendBufferWhenReady() {
  console.log( '--appendBufferWhenReady()--' );
  clearInterval( checkStatusBuffer );

  checkStatusBuffer = setInterval( checkStatusBufferInterval, POLLING_INTERVAL );
}

function mediaSourceOnSourceEnded( event ) {
  var mediaSource = event.target;
  console.log('mediaSource readyState: ' + mediaSource.readyState);
}

function mediaSourceAvailable() {
  window.MediaSource = window.MediaSource || window.WebKitMediaSource;
  
  if ( !!!window.MediaSource ) {
    alert( 'MediaSource API is not available.' );
    return false;
  }

  return true;
}

function initLibrary( skipEventListeners ) {
  console.log( '--initLibrary()--' );
  // https://html5-demos.appspot.com/static/media-source.html
  
  mediaSource = new MediaSource();
  video.src = window.URL.createObjectURL( mediaSource );
  video.pause();

  choicesContainer.innerHTML = '';
  choicesContainer.removeEventListener( 'click', choiceClicked, false );
  choicesContainerCounter = 0;
  choicesCounter = 0;

  //if ( !skipEventListeners ) {
    choicesContainer.addEventListener( 'click', choiceClicked, false );

    mediaSource.addEventListener( 'sourceopen', mediaSourceOnSourceOpen, false );

    mediaSource.addEventListener( 'sourceended', mediaSourceOnSourceEnded, false );
  //}
}

function importXML( xmlFile ) {
  console.log( '--importXML()--' );
  var xhr = new XMLHttpRequest();

  xhr.open( 'GET', xmlFile, true );
  xhr.setRequestHeader( 'Content-Type', 'text/xml' ); // application/ovml+xml
  xhr.onload = function xhrOnLoad( event ) {
    switch ( xhr.status ) {
      case 200:
        xmlDoc = xhr.responseXML;
        readXML();

        //console.log(buffers);
        console.log( 'mediaQueue', mediaQueue );

        for ( var i = mediaQueue.length - 1; i >= 0; --i ) {
          GET( mediaQueue[i].path, mediaQueue[i].type, readPlaylistItem );
        }

        console.log( '--getAndPlay() l:696--');
        getAndPlay();

        // video.addEventListener('progress', function ( event ) {
        // });
      break;

      default:
    }
  };
  xhr.send( '' );
}

function presentChoice( event ) {
  //var choiceContainer = document.getElementById( 'choice-' + choicesContainerCounter );
  //console.log(this.duration);

  //console.log( +this.currentTime.toFixed(0), +this.duration.toFixed(0) );

  // toFixed works around a Firefox bug but makes it slightly less accurate
  // @todo: Maybe detect Firefox and implement this conditionally? But then inconsistent playback experience.
  // Imprecision may not matter if it's going to be an overlay onto bg video.
  var videoPlayer = event.target; // this
  var currentTime = +videoPlayer.currentTime.toFixed(0);
  var currentDuration = +videoPlayer.duration.toFixed(0);

  if ( currentTime === currentDuration ) {
  //if ( this.currentTime === this.duration ) {
    // console.log( choicesContainerCounter );

    // console.log( 'currentTime', currentTime );
    // console.log( 'duration', currentDuration );

    console.log( 'choice presented' );

    // console.log( choiceContainer );
    // console.log( 'choiceContainer[@hidden]', choiceContainer.getAttribute('hidden') );
    // console.log( 'choiceContainer.hidden', choiceContainer.hidden );

    choiceContainer.removeAttribute( 'hidden' );
    choiceContainer.hidden = false;

    console.log( choiceContainer );
    // console.log( 'choiceContainer[@hidden]', choiceContainer.getAttribute('hidden') );
    // console.log( 'choiceContainer.hidden', choiceContainer.hidden );

    // @todo: This could stay here if there were a reliable way to dynamically re-attach (not saying there isn't; just not sure why it's not already happpening)
    //this.removeEventListener( 'timeupdate', presentChoice );
  }
  
  // if ( this.currentTime === lastSegmentDuration ) {
  //   mediaSource.endOfStream();
  // }

  // for (var i = segments.length - 1; i >= 0; i--) {
  //   segments[i].duration;
  // }
}

function choiceClicked( event ) {
  console.log( '--choiceClicked()--' );
  event.preventDefault();

  var link = event.target;
  var id = link.id;

  console.log( 'clicked choice:', link );

  //if ( !firstChoiceSelected ) {
    choiceContainer.setAttribute('hidden', 'hidden');
    choiceContainer.hidden = true;
    firstChoiceSelected = true;
    lastSegmentAppended = true;

    // obj = {
    //   'path': link.getAttribute('data-play'),
    //   'mime': link.getAttribute('data-type'),
    //   'line': 651
    // };

    // mediaQueue.push( obj );
    // mediaQueueHistory.push( obj );

    // if data-goto

    console.log(
      //eval( link.getAttribute( 'data-actions' ) )
      //JSON.parse( link.getAttribute( 'data-actions' ) )
    );

    var replaceTimeline = ( link.getAttribute( 'data-timeline' ) === 'replace' );

    if ( replaceTimeline ) {
      console.log ( '--Replacing stream--' );
      //window.mediaSource.endOfStream();

      // this mostly works but for some reason double-append of intro at the beginning
      //initVars();

      xmlLoaded = true;

      initLibrary();
    }

    parseNonlinearPlaylistItems(
      getNodes(
        parseXPointer(
          link.getAttribute( 'data-goto' )
        ) // parseXPointer
      ) // getNodes
      .iterateNext()
    ); // parseNonlinearPlaylistItems
    
    console.log( '--getAndPlay() l:809--' );
    getAndPlay();
}

// Testing post-receive hook--again and again
function readerOnload( event ) {
  console.log( '--reader.onload--');
  mediaSegment = new Uint8Array( event.target.result );
  appendBufferWhenReady();
}

function GET_MediaQueueCallback( uInt8Array ) {
  console.log( '--GET callback--');
  var buffer = 0;
  var type = mediaQueue[0].type || DEBUG_BUFFER_TYPE; //'video/webm';

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
  reader.onload = readerOnload;

  reader.readAsArrayBuffer( file );
}

function getAndPlay() {
  //console.log( '--getAndPlay()--' );
  // Make sure the previous append is not still pending.
  var ready = isMediaSourceReady();
  //console.log( 'ready', ready );

  if ( !ready ) {
    return false;
  }

  console.log( 'mediaQueue.length', mediaQueue.length );

  // This is already checked in isMediaSourceReady. Am I going insane?
  if ( mediaQueue.length === 0 ) {
    return false;
  }

  GET( mediaQueue[0].path, mediaQueue[0].type, GET_MediaQueueCallback );

  return true;
}

if ( mediaSourceAvailable() ) {
  initLibrary();
}
//})();