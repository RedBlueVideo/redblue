/*jshint laxcomma:true, smarttabs:true */
//(function () {
//"use strict";
var xmlDoc;
var xmlLoaded = false;
var evaluator = new XPathEvaluator();
var nsResolver;
var ns = {};
var fileTypePreferences = [
  {
    'video/webm': {
      'video': ['vp9', 'vp8'],
      'audio': ['vorbis']
    }
  },
  {
    'video/mp4': {
      'video': ['avc1.6400xx'],
      'audio': ['aac']
    }
  }
];
var finalPlaylist = [];
var choicesContainer = document.getElementById( 'choices-container' );
var choicesCounter = 0;

// http://www.w3.org/TR/media-source/#examples
// https://github.com/jbochi/media-source-playground/blob/master/test.html
var buffers = [];
var totalVideos;
var duration = 0;
var bufferLoading = false;
var video = document.getElementById( 'v' );
var duration;
var mediaSource = new MediaSource();
//var finalPlaylist;
var checkStatus;
var choiceContainer;
var choicesContainerCounter = 0;
var choices = document.querySelectorAll( '.choice' );
var choicesName;
var firstChoiceSelected = false;
var firstSegmentAppended = false;
var lastSegmentAppended = false;
var sourceBuffer;

function onSourceOpen( videoTag, event ) {
  var mediaSource = event.target;

  if ( mediaSource.sourceBuffers.length > 0 ) {
    return;
  }

  var sourceBuffer = mediaSource.addSourceBuffer( 'video/webm; codecs="vorbis,vp8"' );

  //videoTag.addEventListener('seeking', onSeeking.bind(videoTag, mediaSource));
  //videoTag.addEventListener('progress', onProgress.bind(videoTag, mediaSource));

  var initSegment = GetNextMediaSegment();

  if ( initSegment === null ) {
    // Error fetching the initialization segment. Signal end of stream with an error.
    console.log( "Error fetching the initialization segment." );
    mediaSource.endOfStream( "network" );
    return;
  }

  // Append the initialization segment.
  var firstAppendHandler = function ( event ) {
    console.log('--firstAppendHandler--');

    var sourceBuffer = event.target;
    sourceBuffer.removeEventListener('updateend', firstAppendHandler);

    // Append some initial media data.
    appendNextMediaSegment(mediaSource);
  };

  sourceBuffer.addEventListener('updateend', firstAppendHandler);
  sourceBuffer.appendBuffer(initSegment);
}

function appendNextMediaSegment(mediaSource) {
  console.log('--appendNextMediaSegment--');
  
  // Make sure the previous append is not still pending.
  if ( mediaSource.sourceBuffers[0].updating ) {
    return;
  }

  if ( mediaSource.readyState !== "open" ) {
    return;
  }

  if ( mediaSource.sourceBuffers[0].mode == "PARSING_MEDIA_SEGMENT" ) {
    return;
  }

  // If we have run out of stream data, then signal end of stream.
  // This should come after the updating check.
  if ( !HaveMoreMediaSegments() ) {
    console.log( mediaSource.readyState );
    console.log( "There are no more media segments" );
    mediaSource.endOfStream();
    return;
  }

  if (bufferLoading) {
    return;
  }

  var mediaSegment = GetNextMediaSegment();

  if (!mediaSegment) {
    // Error fetching the next media segment.
    console.log("Error fetching the next media segment.");
    mediaSource.endOfStream("network");
    return;
  }

  // NOTE: If mediaSource.readyState == “ended”, this appendBuffer() call will
  // cause mediaSource.readyState to transition to "open". The web application
  // should be prepared to handle multiple “sourceopen” events.

  duration = mediaSource.duration;
  console.log('Duration: ' + duration);
  mediaSource.sourceBuffers[0].timestampOffset = duration;
  mediaSource.sourceBuffers[0].appendBuffer(mediaSegment);
}

function onSeeking(mediaSource, e) {
  console.log('--onSeeking--');
  var video = e.target;

  if (mediaSource.readyState == "open") {
    // Abort current segment append.
    mediaSource.sourceBuffers[0].abort();
  }

  // Notify the media segment loading code to start fetching data at the
  // new playback position.
  //SeekToMediaSegmentAt(video.currentTime);
  //console.log(video.currentTime);

  // Append a media segment from the new playback position.
  appendNextMediaSegment(mediaSource);
}

function onProgress( mediaSource, e ) {
  console.log('--onProgress--');
  appendNextMediaSegment(mediaSource);
}

function readPlaylistItem( uInt8Array, type ) {
  type = type || 'video/webm';
  
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

function GetNextMediaSegment() { // GetInitializationSegment
  console.log('--GetNextMediaSegment--');
  var buffer = buffers[0];
  buffers = buffers.slice(1);
  console.log('Got video #' + ( totalVideos - buffers.length ) + ' of ' + totalVideos);
  return buffer;
}

function HaveMoreMediaSegments() {
  console.log('--HaveMoreMediaSegments--');
  var bool = buffers.length > 0;
  console.log(bool + ', remaining buffers: ' + buffers.length);
  return bool;
}

//var GetNextMediaSegment = GetInitializationSegment;

function GET( url, type, callback ) {
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

// function loadM3Uplaylist( url, callback ) {
//   var xhr = new XMLHttpRequest();
//   xhr.addEventListener('load', function(e) {

//     if ( xhr.status !== 200 ) {
//       console.log( "Unexpected status code " + xhr.status + " for " + url );
//       return false;
//     }

//     var regex = /^[^#].*$/mg;
//     var urls = [];
//     var result;

//     while ((result = regex.exec(xhr.response))) {
//       urls.push(result[0]);
//     }

//     console.log(urls);
//     console.log('Playlist loaded');
//     totalVideos = urls.length;
//     callback(urls);
//   });

//   xhr.addEventListener('error', function() {
//     console.log('Playlist load error');
//   });

//   xhr.open("GET", url);
//   xhr.send();
// }

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
  ns.xml = 'http://www.w3.org/XML/1998/namespace';

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
  console.log( playlistItems.localName );

  var playlistItem;

  if (
    ( playlistItems.localName === 'playlist' ) && //|| playlistItems.localName === 'choices' )
    playlistItems.hasOwnProperty( 'children' ) && playlistItems.children.length > 0 ) {
    
    playlistItem = playlistItems.children[0];
  } else {
    playlistItem = playlistItems;
  }

  var i;
  var containers = [];
  var plGrandchild;
  var xlinkHref;
  var mediaFile;
  var mediaElement;
  var fileElement;
  var container;
  var query;
  var choicesBg;
  var choices;
  var choice;
  var choicesHTML = '<ul>';
  
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
        finalPlaylist.push({
          //'type': 'media',
          'mime': containers[0]['mime'],
          'path': getXLink( containers[0]['node'].parentElement )
        });
      }

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
      }
    break;

    case 'choices':
      console.log('encountered a choice');
      console.log( playlistItem );
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
        var gotoElement = getNodes( 'goto', choice ).iterateNext();
        xlinkHref = getXLink( gotoElement );
        query = parseXPointer( xlinkHref );
        mediaElement = getNodes( query ).iterateNext();

        query = getQueryFromXLink( mediaElement );
        fileElement = getNodes( query ).iterateNext(); // @todo: filter by filetype/etc.
        var fileMime = getNodes( 'container/mime', fileElement ).iterateNext().textContent;
        console.log( fileMime );

        var choiceLetter = String.fromCharCode( 64 + choicesCounter ).toLowerCase();
        
        choicesHTML += '<li>' +
          '<a id="' + choicesContainerCounter + choiceLetter + '" class="choice choice-' + choiceLetter + '" href="' + xlinkHref + '" data-play="' + getXLink( fileElement ) + '" data-type="' + fileMime + '">' +
            getNodes( 'name', choice ).iterateNext().textContent +
          '</a>' +
        '</li>';

        choice = choices.iterateNext();
        ++choicesCounter;
      }
      choicesHTML += '</ul>';

      choicesContainer.innerHTML += '<nav id="choice-' + choicesContainerCounter + '" class="choices" hidden="hidden"><div class="container"><h2>' + choicesName + '</h2>' + choicesHTML + '</div></nav>';

      choiceContainer = document.getElementById( 'choice-' + choicesContainerCounter );
    break;
  }
}

function mediaSourceOnSourceOpen( event ) {
  //var sourceBuffer = mediaSource.addSourceBuffer('video/webm; codecs="vorbis,vp8"');
  sourceBuffer = mediaSource.addSourceBuffer( 'video/webm; codecs="vorbis,vp8"' );

  console.log( 'mediaSource readyState: ' + this.readyState );

  // Load playlist
  importXML( 'db/redblue.ovml.xml' );

  //console.log(buffers);
  console.log( finalPlaylist );

  for ( var i = finalPlaylist.length - 1; i >= 0; --i ) {
    GET( finalPlaylist[i].path, finalPlaylist[i].type, readPlaylistItem );
  }

  get_and_play();

  // video.addEventListener('progress', function(e) {
  // });
}

function mediaSourceOnSourceEnded( event ) {
  console.log('mediaSource readyState: ' + this.readyState);
}

function initLibrary() {
  // https://html5-demos.appspot.com/static/media-source.html
  window.MediaSource = window.MediaSource || window.WebKitMediaSource;
  if (!!!window.MediaSource) {
    alert('MediaSource API is not available');
  }

  video.src = window.URL.createObjectURL( mediaSource );
  video.pause();

  choicesContainer.addEventListener('click', choiceClicked, false);

  mediaSource.addEventListener('sourceopen', mediaSourceOnSourceOpen, false);

  mediaSource.addEventListener('sourceended', mediaSourceOnSourceEnded, false);
}

function importXML( xmlFile ) {
  var xhr;

  try {
    xhr = new XMLHttpRequest();
    xhr.open( 'GET', xmlFile, false );
  } catch ( Exception ) {
    xmlDoc = document.implementation.createDocument( 'http://vocab.nospoon.tv/ovml#', 'ovml', null );
    xmlDoc.onload = readXML;
    xmlDoc.load( xmlFile );
    xmlLoaded = true;
  }

  if ( !xmlLoaded ) {
    xhr.setRequestHeader( 'Content-Type', 'text/xml' );
    xhr.send( '' );
    xmlDoc = xhr.responseXML;
    readXML();
    xmlLoaded = true;
  }
}

function presentChoice( event ) {
  //console.log(this.duration);
  if ( this.currentTime === this.duration ) {
    
    choiceContainer.removeAttribute('hidden');
    choiceContainer.hidden = false;
    this.removeEventListener('timeupdate', presentChoice);
  }
  
  // if ( this.currentTime === lastSegmentDuration ) {
  //   mediaSource.endOfStream();
  // }

  // for (var i = segments.length - 1; i >= 0; i--) {
  //   segments[i].duration;
  // }
}

function choiceClicked( event ) {
  event.preventDefault();

  var id = event.target.id;



  if ( !firstChoiceSelected ) {
    var link = event.target;

    choiceContainer.setAttribute('hidden', 'hidden');
    choiceContainer.hidden = true;
    firstChoiceSelected = true;
    lastSegmentAppended = true;

    finalPlaylist.push({
      'path': link.getAttribute('data-play'),
      'type': link.getAttribute('data-type')
    });

    get_and_play();
  }
}

function get_and_play() {
  // Make sure the previous append is not still pending.
  if ( mediaSource.sourceBuffers[0].updating ) {
    console.log('still appending');
    return false;
  }

  if ( mediaSource.readyState !== "open" ) {
    return false;
  }

  if ( mediaSource.sourceBuffers[0].mode == "PARSING_MEDIA_SEGMENT" ) {
    return false;
  }

  if ( finalPlaylist.length === 0 ) {
    //mediaSource.endOfStream();
    return false;
  }

  var buffer = 0;

  GET( finalPlaylist[0].path, finalPlaylist[0].type, function ( uInt8Array ) {
    type = finalPlaylist[0].type || 'video/webm';

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
    reader.onload = function ( e ) {
      var mediaSegment = new Uint8Array( e.target.result );

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
      
      finalPlaylist = finalPlaylist.slice( 1 );

      if ( finalPlaylist.length > 0 ) {
        clearInterval( checkStatus );

        checkStatus = setInterval(function () {
          var appended = get_and_play();

          if ( appended ) {
            clearInterval( checkStatus );
          }
        }, 1000);
      }
    };

    reader.readAsArrayBuffer( file );
  });

  return true;
}

initLibrary();
//})();