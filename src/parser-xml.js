'use strict';

const RedBlueXMLParser = ( superClass ) => {
  return class extends superClass {
    constructor() {
      super();

      this.XML = {
        "xmlDoc": null,
        "xmlLoaded": false,
        "evaluator": new XPathEvaluator(),
        "nsResolver": null,
        "ns": {
          "xml": "http://www.w3.org/XML/1998/namespace"
        },
      
        "read": () => {
          var result;
          var element;

          this.log( 'reading XHR result' );
          
          result = this.find( '//video/presentation/playlist' );
      
          if ( result ) {
            // this.OVML.parse.playlist( result );
          }
        }, // read
      
        "import": ( xmlFile ) => {
          this.log( '--XML.import()--' );
          var xhr = new XMLHttpRequest();
      
          xhr.open( 'GET', xmlFile, true );
          xhr.setRequestHeader( 'Content-Type', 'text/xml' ); // application/ovml+xml
          xhr.onload = ( event ) => {
            switch ( xhr.status ) {
              case 200:
                this.XML.xmlDoc = xhr.responseXML;
                this.XML.read();
      
                //this.log( 'this.mediaQueue', this.mediaQueue );
      
                for ( var i = this.mediaQueue.length - 1; i >= 0; --i ) {
                  this.XHR.GET( this.mediaQueue[i].path, this.mediaQueue[i].type, this.readPlaylistItem );
                }
      
                this.log( '--import()--');
                this.play();
              break;
      
              default:
            }
          };
          xhr.send( '' );
        } // import
      }; // XML
    }

    get hasXMLParser() {
      return true;
    }

    resolveCSSNamespacePrefixFromXML( defaultPrefix = 'css' ) {
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

      return defaultPrefix;
    }

    getAnnotationFromChoiceElement( child ) {
      let choice = {};

      for ( let i = 0; i < child.children.length; i++ ) {
        let grandchild = child.children[i];
        let nodeName = grandchild.nodeName.toLowerCase();

        switch ( nodeName ) {
          case 'name':
            choice[nodeName] = ( grandchild.nodeValue || grandchild.innerHTML );
          break;

          // case 'playlistAction':
          // break;

          case 'goto':
            choice[nodeName] = this.nodeAttributesToJSON( grandchild.attributes );

            choice[nodeName].animate = Array.from( grandchild.children ).filter( ( gotoChild ) => {
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

      choice.type = child.nodeName.toLowerCase();

      return choice;
    }

    getAnnotationsFromXML( xpath = `.//presentation[1]`, contextNode = null ) {
      let annotations = [];
      const $element = this.find( xpath, contextNode ).snapshotItem(0);

      for ( let i = 0, length = $element.children.length; i < length; i++ ) {
        let child = $element.children[i];
        let nodeName = child.nodeName.toLowerCase();

        switch ( nodeName ) {
          case 'choices':
            let choices = {
              "type": "choices"
            };

            for ( let i = 0, length = child.children.length; i < length; i++ ) {
              let grandchild = child.children[i];
              let nodeName = grandchild.nodeName.toLowerCase();

              switch ( nodeName ) {
                case 'name':
                  choices.name = grandchild.textContent;
                break;

                case 'media':
                  choices.media = this.nodeAttributesToJSON( grandchild.attributes );
                break;

                default:
              }
            }
            
            choices.choices = this.getAnnotationsFromXML( `.`, child );

            annotations.push( choices );
          break;

          case 'choice':
            annotations.push( this.getAnnotationFromChoiceElement( child ) );
          break;

          // case 'media':
          // break;

          case 'playlist':
            if ( child.getAttribute( 'type' ) === 'nonlinear' ) {
              annotations = annotations.concat(
                this.getAnnotationsFromXML( `.`, child )
              );
            }
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
          // case 'goto':
          // break;
          // case 'playlistAction':
          // break;
          // case 'media':
          // break;
          default:
            // this.log( 'No match:', nodeName );
        }
      }

      return annotations;
    }

    findInXML( xpathExpression, contextNode, resultType ) {
      contextNode = ( contextNode || this.hvml );
      resultType = ( resultType || XPathResult.ORDERED_NODE_SNAPSHOT_TYPE );

      return document.evaluate(
        xpathExpression,
        contextNode,
        function ( prefix ) {
          const ns = {
            "hvml": "https://hypervideo.tech/hvml#",
            "ovml": "http://vocab.nospoon.tv/ovml#",
            "html": "http://www.w3.org/1999/xhtml",
            "xlink": "http://www.w3.org/1999/xlink",
            "css": "https://www.w3.org/TR/CSS/",
            "xml": "http://www.w3.org/XML/1998/namespace",
          };

          return ( ns[prefix] || ns.html );
        }, // namespaceResolver
        // XPathResult.ANY_TYPE, // resultType
        resultType,
        null // result
      )
    }
  }
};

export default RedBlueXMLParser;
