'use strict';

const RedBlueXMLParser = ( superClass ) => {
  return class extends superClass {
    constructor() {
      super();
    }

    get hasXMLParser() {
      return true;
    }

    getCSSNamespacePrefixFromXML() {
      for ( let i = 0; i < this.hvml.attributes.length; i++ ) {
        let attribute = this.hvml.attributes[i].nodeName;
        let namespaceAttribute = attribute.match( /^xmlns:([^=]+)/i );

        if (
          namespaceAttribute
          && ( this.hvml.getAttribute( attribute ).match( /https?:\/\/(www\.)?w3\.org\/TR\/CSS\/?/i ) )
        ) {
          return namespaceAttribute[1];
        }
      }

      return null;
    }

    getEmbedUriFromXML() {
      /*
        <showing scope="release" type="internet" admission="private">
          <venue type="site">
            <entity site="https://www.youtube.com/">YouTube</entity>
            <uri>https://www.youtube.com/watch?v=nWdWq3hMwao</uri>
            <title>Overnight Dance Party at the Museum of Fine Arts Boston | Hugh’s Vlog | #mfaNOW #mfaLateNites</title>
          </venue>
        </showing>
      */
      // https://www.youtube.com/embed/nWdWq3hMwao?rel=0&amp;showinfo=0&amp;start=517&amp;end=527&amp;enablejsapi=1&amp;controls=0&amp;modestbranding=1
      try {
        let youtubeUrl = this.findInXML( `.//showing[@scope="release"]/venue[@type="site"]/uri[contains(., '//www.youtube.com/watch?v=')]/text()` ).snapshotItem(0);

        if ( youtubeUrl ) {
          return youtubeUrl.textContent.replace( /https?:\/\/www\.youtube\.com\/watch\?v=([^&?]+)/i, `//www.youtube.com/embed/$1${this.embedParameters}` );
        }

        throw 'No YouTube URL found';
      } catch ( error ) {
        console.error( error );
      }
    }

    getAnnotationsFromXML() {
      const annotations = [];
      const $presentation = this.findInXML( `.//presentation[1]` ).snapshotItem(0);

      for ( let i = 0, length = $presentation.children.length; i < length; i++ ) {
        let child = $presentation.children[i];
        let nodeName = child.nodeName.toLowerCase();

        switch ( nodeName ) {
          case 'choice':
            let choice = {};

            for ( let i = 0; i < child.children.length; i++ ) {
              let grandchild = child.children[i];
              let nodeName = grandchild.nodeName.toLowerCase();

              switch ( nodeName ) {
                case 'name':
                  choice[nodeName] = ( grandchild.nodeValue || grandchild.innerHTML );
                break;

                case 'goto':
                  choice[nodeName] = this.nodeAttributesToJSON( grandchild.attributes );

                  choice[nodeName].animations = Array.from( grandchild.children ).filter( ( gotoChild ) => {
                    const nodeName = gotoChild.nodeName.toLowerCase();

                    switch ( nodeName ) {
                      case 'animate':
                        return true;
                    }
                  } ).map( ( animateElement ) => {
                    return this.nodeAttributesToJSON( animateElement.attributes );
                  } );
                break;
              }
            }

            choice.type = nodeName;

            console.log( 'choice', choice );
            annotations.push( choice );
          break;

          /*
            <goto
              xlink:actuate="onRequest"
              on="duration | durationStart | durationEnd"
              start="517"
              end="527"
              xlink:href="http://hugh.today/2016-09-17/live"
            />
          */
          case 'goto':
          // break;
          case 'playlistAction':
          // break;
          case 'choices':
          // break;
          case 'media':
          // break;
          default:
            console.log( 'not `choice`', nodeName );
        }
      }

      return annotations;
    }

    findInXML( xpathExpression ) {
      return document.evaluate(
        xpathExpression,
        this.hvml, // contextNode
        function ( prefix ) {
          const ns = {
            "hvml": "https://hypervideo.tech/hvml#",
            "html": "http://www.w3.org/1999/xhtml"
          };

          return ( ns[prefix] || ns.html );
        }, // namespaceResolver
        // XPathResult.ANY_TYPE, // resultType
        XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
        null // result
      )
    }
  }
};

export default RedBlueXMLParser;
