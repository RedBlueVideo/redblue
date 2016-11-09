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
var choicesContainer = document.getElementById( 'choices' );

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



      while ( choice ) {
        console.log( getNodes( 'goto', choice ).iterateNext() );
        xlinkHref = getXLink( getNodes( 'goto', choice ).iterateNext() );
        query = parseXPointer( xlinkHref );
        mediaElement = getNodes( query ).iterateNext();

        query = getQueryFromXLink( mediaElement );
        fileElement = getNodes( query ).iterateNext(); // @todo: filter by filetype/etc.
        
        choicesHTML += '<li>' +
          '<a href="' + xlinkHref + '" data-play="' + getXLink( fileElement ) + '">' +
            getNodes( 'name', choice ).iterateNext().textContent +
          '</a>' +
        '</li>';

        choice = choices.iterateNext();
      }
      choicesHTML += '</ul>';

      choicesContainer.innerHTML = choicesHTML;
      
    break;
  }
}

function initLibrary() {
  importXML( '../examples/redblue.ovml.xml' );
  console.log( finalPlaylist );
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

initLibrary();
//})();