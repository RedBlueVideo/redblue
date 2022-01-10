'use strict';

const RedBlueXMLParser = ( RedBlueVideo ) => class extends RedBlueVideo {
  constructor() {
    super();

    this.XML = {
      "xmlDoc": null,
      "xmlLoaded": false,
      "evaluator": new XPathEvaluator(),
      "nsResolver": null,
      "ns": {
        "xml": "http://www.w3.org/XML/1998/namespace",
      },

      "read": () => {
        // let element;

        this.log( 'reading XHR result' );

        const result = this.find( '//video/presentation/playlist' );

        if ( result ) {
          // this.OVML.parse.playlist( result );
        }
      }, // read

      "import": ( xmlFile ) => {
        this.log( '--XML.import()--' );
        const xhr = new XMLHttpRequest();

        xhr.open( 'GET', xmlFile, true );
        xhr.setRequestHeader( 'Content-Type', 'text/xml' ); // application/ovml+xml
        xhr.onload = () => {
          switch ( xhr.status ) {
            case 200:
              this.XML.xmlDoc = xhr.responseXML;
              this.XML.read();

              // this.log( 'this.mediaQueue', this.mediaQueue );

              for ( let i = this.mediaQueue.length - 1; i >= 0; --i ) {
                this.XHR.GET( this.mediaQueue[i].path, this.mediaQueue[i].type, this.readPlaylistItem );
              }

              this.log( '--import()--' );
              this.play();
              break;

            default:
          }
        };
        xhr.send( '' );
      }, // import
    }; // XML
  }

  get hasXMLParser() {
    return true;
  }

  resolveCSSNamespacePrefixFromXML( defaultPrefix = 'css' ) {
    for ( let i = 0; i < this.hvml.attributes.length; i++ ) {
      const attribute = this.hvml.attributes[i].nodeName;
      const namespaceAttribute = attribute.match( /^xmlns:([^=]+)/i );

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
    const choice = {};

    choice['xml:id'] = this.getAttributeAnyNS( child, 'xml:id' );
    choice.id = child.id;

    for ( let i = 0; i < child.children.length; i++ ) {
      const grandchild = child.children[i];
      const nodeName = grandchild.nodeName.toLowerCase();

      switch ( nodeName ) {
        case 'name':
          choice[nodeName] = ( grandchild.nodeValue || grandchild.innerHTML );
          break;

          // case 'playlistAction':
          // break;

        case 'goto':
          choice[nodeName] = this.nodeAttributesToJSON( grandchild.attributes );

          choice[nodeName].animate = Array.from( grandchild.children ).filter( ( gotoChild ) => {
            const currentNodeName = gotoChild.nodeName.toLowerCase();

            switch ( currentNodeName ) {
              case 'animate':
                return true;

              default:
                return false;
            }
          } ).map( ( animateElement ) => this.nodeAttributesToJSON( animateElement.attributes ) );
          break;

        default:
      }
    }

    choice.type = child.nodeName.toLowerCase();

    return choice;
  }

  getAnnotationsFromXML( xpath = `.//presentation[1]`, contextNode = null ) {
    let annotations = [];
    const $element = this.find( xpath, contextNode ).snapshotItem( 0 );

    for ( let i = 0, { "length": childrenLength } = $element.children; i < childrenLength; i++ ) {
      const child = $element.children[i];
      const nodeName = child.nodeName.toLowerCase();

      switch ( nodeName ) {
        case 'choiceprompt': {
          const choicePrompt = {
            "type": "choicePrompt",
          };

          for ( let j = 0, { "length": grandchildrenLength } = child.children; j < grandchildrenLength; j++ ) {
            const grandchild = child.children[j];
            const grandchildNodeName = grandchild.nodeName.toLowerCase();

            choicePrompt['xml:id'] = this.getAttributeAnyNS( grandchild, 'xml:id' );
            choicePrompt.id = grandchild.id;

            switch ( grandchildNodeName ) {
              case 'name':
                choicePrompt.name = grandchild.textContent;
                break;

              case 'media':
                choicePrompt.media = this.nodeAttributesToJSON( grandchild.attributes );
                break;

              default:
            }
          }

          choicePrompt.choices = this.getAnnotationsFromXML( `.`, child );

          annotations.push( choicePrompt );
          break;
        }

        case 'choice':
          annotations.push( this.getAnnotationFromChoiceElement( child ) );
          break;

          // case 'media':
          // break;

        case 'playlist':
          if ( child.getAttribute( 'type' ) === 'nonlinear' ) {
            annotations = annotations.concat(
              this.getAnnotationsFromXML( `.`, child ),
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
            // this.log( 'not `choice`', nodeName );
      }
    }

    return annotations;
  }

  findInXML( xpathExpression, contextNode ) {
    if ( !contextNode ) {
      contextNode = this.hvml;
    }

    return document.evaluate(
      xpathExpression,
      contextNode,
      ( prefix ) => ( RedBlueVideo.NS[prefix] || RedBlueVideo.NS.html ), // namespaceResolver
      // XPathResult.ANY_TYPE, // resultType
      XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
      null, // result
    );
  }
};

export default RedBlueXMLParser;
