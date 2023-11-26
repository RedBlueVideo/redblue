'use strict';

import RedBlueVideo, { $Element, $HTMLorXMLElement, Animation, Annotation, Choice, ChoicePrompt, Goto, Media } from "./redblue-video.js";
import { MixinConstructor } from "./util.js";

export function XMLParser<BaseType extends MixinConstructor>( Base: BaseType ) {
  return class RedBlueXMLParser extends Base {
    XML: {
      xmlDoc: Document | null;
      xmlLoaded: boolean;
      evaluator: XPathEvaluator;
      // TODO: Fix type
      nsResolver: null;
      // nsResolver: XPathNSResolver;
      ns: Record<string, string>;
      read: () => unknown;
      import: ( xmlFile: string ) => void;
    };

    constructor( ...args: any[] ) {
      super( ...args );

      this.XML = {
        xmlDoc: null,
        xmlLoaded: false,
        evaluator: new XPathEvaluator(),
        nsResolver: null,
        ns: {
          xml: "http://www.w3.org/XML/1998/namespace",
        },

        /**
         * @deprecated
         */
        read: () => {
        // let element;

          this.log( 'reading XHR result' );

          const result = this.find( '//video/presentation/playlist' );

          if ( result ) {
          // this.OVML.parse.playlist( result );
          }
        }, // read

        /**
         * @deprecated
         */
        import: ( xmlFile: string ) => {
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
                  this.XHR.GET(
                    this.mediaQueue[i].path,
                    this.mediaQueue[i].mime,
                    // this.readPlaylistItem,
                    ( binary, type ) => this.log( `readPlaylistItem( binary, type )`, binary, type ),
                  );
                }

                this.log( '--import()--' );
                // this.play();
                this.log( 'this.play();' );
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
      for ( let i = 0; i < ( this.hvml.xml as $HTMLorXMLElement ).attributes.length; i++ ) {
        const attribute = this.hvml.xml!.attributes[i].nodeName;
        const namespaceAttribute = attribute.match( /^xmlns:([^=]+)/i );
        const attributeValue = this.hvml.xml!.getAttribute( attribute )!;

        if ( namespaceAttribute && ( attributeValue.match( /https?:\/\/(www\.)?w3\.org\/TR\/CSS\/?/i ) ) ) {
          return namespaceAttribute[1];
        }
      }

      return defaultPrefix;
    }

    getAnnotationFromChoiceElement( $child: $Element ) {
      // @ts-ignore - Init
      const choice: Choice = {};

      if ( this.hasAttributeAnyNS( $child, 'xml:id' ) ) {
        choice['xml:id'] = this.getAttributeAnyNS( $child, 'xml:id' )!;
      }
      choice.id = $child.id;

      for ( let i = 0; i < $child.children.length; i++ ) {
        const $grandchild = $child.children[i];
        const nodeName = $grandchild.nodeName.toLowerCase();

        switch ( nodeName ) {
          case 'name':
            choice[nodeName] = ( $grandchild.nodeValue || $grandchild.innerHTML );
            break;

            // case 'playlistAction':
            // break;

          case 'goto':
            choice.goto = this.nodeAttributesToJSON<Goto>( $grandchild.attributes );
            choice.goto.animate = (
              Array.isArray( $grandchild.children )
                ? $grandchild.children
                : Array.from( $grandchild.children )
            )
              .filter( ( $gotoChild ) => {
                const currentNodeName = $gotoChild.nodeName.toLowerCase();

                switch ( currentNodeName ) {
                  case 'animate':
                    return true;

                  default:
                    return false;
                }
              } )
              .map<Animation>( ( animateElement ) => this.nodeAttributesToJSON( animateElement.attributes ) );
            break;

          default:
        }
      }

      choice.type = $child.nodeName.toLowerCase() as 'choice';

      return choice;
    }

    getAnnotationsFromXML<Cast extends Annotation[] = Annotation[]>( xpath = `.//presentation[1]`, contextNode?: $Element ) {
      let annotations: Annotation[] = [];

      const presentationFindResult = this.find( xpath, contextNode );

      if ( presentationFindResult.snapshotLength ) {
        const $element = presentationFindResult.snapshotItem( 0 )!;

        for ( let i = 0, { "length": childrenLength } = $element.children; i < childrenLength; i++ ) {
          const $child = $element.children[i];
          const nodeName = $child.nodeName.toLowerCase();

          switch ( nodeName ) {
            case 'choiceprompt': {
              // @ts-ignore - Init
              const choicePrompt: ChoicePrompt = {
                type: "choicePrompt",
              };

              for ( let j = 0, { "length": grandchildrenLength } = $child.children; j < grandchildrenLength; j++ ) {
                const $grandchild = $child.children[j];
                const grandchildNodeName = $grandchild.nodeName.toLowerCase();

                if ( this.hasAttributeAnyNS( $grandchild, 'xml:id' ) ) {
                  choicePrompt['xml:id'] = this.getAttributeAnyNS( $grandchild, 'xml:id' )!;
                }
                choicePrompt.id = $grandchild.id;

                switch ( grandchildNodeName ) {
                  case 'name':
                    choicePrompt.name = $grandchild.textContent;
                    break;

                  case 'media':
                    choicePrompt.media = this.nodeAttributesToJSON<Media>( $grandchild.attributes );
                    break;

                  default:
                }
              }

              choicePrompt.choices = this.getAnnotationsFromXML<Choice[]>( `.`, $child );

              annotations.push( choicePrompt );
              break;
            }

            case 'choice':
              annotations.push( this.getAnnotationFromChoiceElement( $child ) );
              break;

              // case 'media':
              // break;

            case 'playlist':
              if ( $child.getAttribute( 'type' ) === 'nonlinear' ) {
                annotations = annotations.concat(
                  this.getAnnotationsFromXML( `.`, $child ),
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
      }

      return annotations as Cast;
    }

    findInXML( xpathExpression: string, $contextNode?: $Element ) {
      if ( !$contextNode ) {
        $contextNode = this.hvml.xml!;
      }

      return document.evaluate(
        xpathExpression,
        $contextNode as $HTMLorXMLElement,
        ( prefix ) => ( prefix ? RedBlueVideo.NS[prefix] : RedBlueVideo.NS.html ), // namespaceResolver
        // XPathResult.ANY_TYPE, // resultType
        XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
        null, // result
      );
    }
  };
}
