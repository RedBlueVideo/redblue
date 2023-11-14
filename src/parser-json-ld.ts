/* eslint-disable max-classes-per-file */
'use strict';

// declare global {
//   interface HTMLElement {
//       connectedCallback(): void;
//   }
// }

import { MixinConstructor } from "./util";

export interface JSONChildNode extends ChildNode {};

/**
 * FIXME:
 * 
 * It may be that we don’t want to try and create a cross-compatible
 * DOM interface for JSON results. For instance, real DOM nodes provide:
 * 
 * 1.) Deeply nested properties, even if the property in question is effectively blank.
 * E.g. a `#text` node will still have a `.childNodes` property, which is just a `NodeList`
 * with nothing in it. And the `NodeList` will in turn have `.item(0)` which returns `null`.
 * 
 * 2.) Non-WebIDL classes that are difficult to replicate, such as `NodeList` which cannot be
 * instantiated with `new NodeList()`.
 * 
 * But if this approach is abandoned, then every single `.find` call will have to be replaced
 * with an if-else branch (`if ( this._hvmlParser === 'xml' ) {} else () {}`) which makes the code
 * a bit unruly.
 * 
 * Alternatively, we could just drop support for JSON-LD parsing, since the forced serialization to
 * XML/HTML allows us to use broswers’ native XPath searching without doing all of this extra work.
 * For those with JSON-LD sources (it’s likely that these won’t materialize if we don’t even allow the option)
 * we can provide a syntax converter.
 */
export type JSONElement = (
  Record<string, any> & {
    nodeType: Element['nodeType'];
    nodeName: Element['nodeName'];
    getAttribute: Element['getAttribute'];
    getAttributeNS: Element['getAttributeNS'];
    // childNodes: JSONChildNode[];
    childNodes: JSONElement[];
  }
);

// export JSONElement

// Dummy clone of XPathResult
export class JSONXPathResult /*extends XPathResult*/ {
  _booleanValue: XPathResult['booleanValue'];
  _invalidIteratorState: XPathResult['invalidIteratorState'];
  _numberValue: XPathResult['numberValue'];
  _resultType: XPathResult['resultType'];
  _singleNodeValue: XPathResult['singleNodeValue'];
  _snapshotLength: XPathResult['snapshotLength'];
  _stringValue: XPathResult['stringValue'];
  _snapshotItems: JSONElement[];

  constructor( properties: Partial<XPathResult> & { snapshotItems?: JSONElement[] } = {} ) {
    // super();

    if ( properties.booleanValue ) {
      this._booleanValue = properties.booleanValue;
    }

    if ( properties.invalidIteratorState ) {
      this._invalidIteratorState = properties.invalidIteratorState;
    } else {
      this._invalidIteratorState = false;
    }

    if ( properties.numberValue ) {
      this._numberValue = properties.numberValue;
    }

    if ( properties.resultType ) {
      this._resultType = properties.resultType;
    } else {
      this._resultType = XPathResult.ORDERED_NODE_SNAPSHOT_TYPE;
    }

    if ( properties.singleNodeValue ) {
      this._singleNodeValue = properties.singleNodeValue;
    }

    if ( properties.snapshotLength ) {
      this._snapshotLength = properties.snapshotLength;
    } else {
      this._snapshotLength = 0;
    }

    if ( properties.stringValue ) {
      this._stringValue = properties.stringValue;
    } else {
      this._stringValue = '';
    }

    if ( properties.snapshotItems ) {
      this._snapshotItems = properties.snapshotItems;
    } else {
      this._snapshotItems = [];
    }
  }

  get booleanValue() {
    return this._booleanValue;
  }

  get invalidIteratorState() {
    return this._invalidIteratorState;
  }

  get numberValue() {
    return this._numberValue;
  }

  get resultType() {
    return this._resultType;
  }

  get singleNodeValue() {
    return this._singleNodeValue;
  }

  get snapshotLength() {
    return this._snapshotLength;
  }

  get stringValue() {
    return this._stringValue;
  }

  snapshotItem( index: number ) {
    return this._snapshotItems[index];
  }

  iterateNext() {
    return this._snapshotItems.shift();
  }
}

export function JSONLDParser<BaseType extends MixinConstructor>( Base: BaseType ) {
  return class RedBlueJSONLDParser extends Base {
    MISSING_JSONLD_CONTEXT_ERROR: string;

    static customJSONSearchUtility: RedBlueJSONLDParser['findInJSONLD'];

    constructor( ...args: any[] ) {
      super( ...args );

      this.MISSING_JSONLD_CONTEXT_ERROR = 'Can’t process; missing `@context` root-level property in JSON-LD';
    }

    connectedCallback() {
      super.connectedCallback();
    }

    get hasJSONLDParser() {
      return true;
    }

    async resolveCSSNamespacePrefixFromJSONLD( defaultPrefix = 'css' ) {
      const USING_DEFAULT_CSS_PREFIX = `Default CSS namespace prefix of \`${defaultPrefix}\` will be used to look up hotspot styling.`;

      if ( !this.hvml.jsonLD ) {
        console.warn( `JSON-LD HVML data is not yet loaded.\n${USING_DEFAULT_CSS_PREFIX}` );
        return defaultPrefix;
      }

      if ( !this.hvml.jsonLD['@context'] || !this.hvml.jsonLD['@context'].length ) {
        console.warn( `JSON-LD Context is blank or missing.\n${USING_DEFAULT_CSS_PREFIX}` );
        return defaultPrefix;
      }

      let context = this.hvml.jsonLD['@context'];
      // const fetchURIregex = /^(((https?|ftps?|about|blob|data|file|filesystem):)|\.\.?\/)(.*)\.json(ld)?$/i;

      if ( typeof context === 'string' ) {
        const request = new Request( context );

        context = await fetch( request )
          .then( ( response ) => {
            if ( !response.ok ) {
              throw new Error( `JSON-LD Context interpreted as URL but unresolvable: \`${this.hvml.jsonLD!['@context']}\`.\n${USING_DEFAULT_CSS_PREFIX}` );
            }

            return response.json();
          } )
          .then( ( response ) => response['@context'] )
          .catch( ( notOK ) => {
            console.warn( notOK );
          } )
        ;
      }

      if ( context ) {
        for ( const property in context ) {
          if ( context[property].match( /https?:\/\/www\.w3\.org\/TR\/CSS\/?/i ) ) {
            return property;
          }
        }
      }

      return defaultPrefix;
    }

    getAnnotationsFromJSONLD() {
      const annotations = [];
      const $presentation = this.findInJSONLD( `.//presentation[1]` ).snapshotItem( 0 );

      for ( const nodeName in $presentation ) {
        switch ( nodeName ) {
          case 'choice':
            for ( const grandchildNodeName in $presentation[nodeName] ) {
              switch ( grandchildNodeName ) {
                case 'name':
                  $presentation[nodeName][grandchildNodeName] = $presentation[nodeName][grandchildNodeName].reduce(
                    ( previous: string | Record<string, any>, current: string | Record<string, any> ) => {
                      switch ( typeof current ) {
                        case 'string':
                          return previous + current;

                        case 'object':
                          return `${previous}<${current['@type']} style="${current.style}">${current.textContent}</${current['@type']}>`;

                        default:
                          throw new TypeError( `Cannot get annotation: node must be a String or an Object; got ${typeof current}` );
                      }
                    },
                  );
                  break;

                default:
              }
            }

            $presentation[nodeName].type = 'choice';
            annotations.push( $presentation[nodeName] );
            break;

          default:
        }
      }

      return annotations;
    }

    /* eslint-disable camelcase */
    /**
     * Note: In order to minimize dependencies, this does not currently process
     * arbitrary XPath expressions; only a subset covering the most common cases.
     * If you would like to use a full-fledged JSON Search utility,
     * prior to calling `customElements.define`, you can set the static property
     * `RedBlueJSONLDParser.customJSONSearchUtility` to a wrapper function
     * that takes the same arguments as `document.evaluate`, all of which
     * are optional except the first, `xpathExpression`.
     */
    findInJSONLD(
      xpathExpression: string,
      contextNode = this.hvml.jsonLD,
      namespaceResolver: Record<string, string> | null = null,
      resultType: number = XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
      result: any = null, // TODO: type for real,
    ): JSONXPathResult {
      if ( RedBlueJSONLDParser.customJSONSearchUtility ) {
        return RedBlueJSONLDParser.customJSONSearchUtility( xpathExpression, contextNode, namespaceResolver, resultType, result );
      }

      if ( !contextNode ) {
        throw new ReferenceError( `Missing \`contextNode\` parameter.` );
      }

      const xpathAtoms: string[] = [];
      // let asksForRootDescendants = false;
      // let asksForLocalDescendants = false;

      // Regular Expressions
      const xpathRegex__contains = /([^[\]]+\[contains\(\s*[^,]+,\s*(['"]).*\2\s*\)\])/i;
      const xpathRegex__rootDescendants = /^\/\//i;
      const xpathRegex__localDescendants = /\.\/\//i;
      const xpathRegex__withAttribute = /[^[\]]+\[@[^=]+=(['"]).*\1\]/i;
      const xpathRegex__withIndex = /[^[\]]+\[[0-9]+\]/i;
      const xpathRegex__text = /text\(\)/i;
      const xpathRegex__brackets = /[[\]]/i;

      if ( xpathRegex__rootDescendants.test( xpathExpression ) ) {
        // asksForRootDescendants = true;
        xpathExpression = xpathExpression.replace( xpathRegex__rootDescendants, '' );
      } else if ( xpathRegex__localDescendants.test( xpathExpression ) ) {
        // asksForLocalDescendants = true;
        xpathExpression = xpathExpression.replace( xpathRegex__localDescendants, '' );
      }

      const xpathParts = xpathExpression.split( xpathRegex__contains );

      for ( let i = 0; i < xpathParts.length; i++ ) {
        const xpathPart = xpathParts[i];

        if ( !xpathRegex__contains.test( xpathPart ) ) {
          const split = xpathPart.split( '/' );

          for ( let j = 0; j < split.length; j++ ) {
            if ( split[j] !== '' ) {
              xpathAtoms.push( split[j] );
            }
          }
        } else {
          xpathAtoms.push( xpathPart.replace( /\//i, '' ) );
        }
      }

      /*
        "showing": {
          "scope": "release",
          "type": "internet",
          "admission": "private",
          "venue": {
            "type": "site",
            "entity": [
              {
                "site": "https://www.youtube.com/"
              },
              "YouTube"
            ],
            "uri": "https://www.youtube.com/watch?v=nWdWq3hMwao",
            "title": "Overnight Dance Party at the Museum of Fine Arts Boston | Hugh’s Vlog | #mfaNOW #mfaLateNites"
          }
        },
      */
      let xpathAtom: string;
      // let lastAtom = null;
      let node: JSONElement | null;
      let lastNode: JSONElement | null = null;

      while ( xpathAtoms.length > 0 ) {
        xpathAtom = xpathAtoms.shift() as string;

        if ( xpathRegex__withIndex.test( xpathAtom ) ) {
          const xpathSubatomicParticles = xpathAtom.split( xpathRegex__brackets );
          xpathSubatomicParticles.pop();

          const nodeIndex = Number( xpathSubatomicParticles[1] ) - 1;

          if ( ( nodeIndex === 0 ) && this.HVML_SOLO_ELEMENTS.indexOf( xpathSubatomicParticles[0] ) !== -1 ) {
            if ( lastNode ) {
              this.log( `lastNode[${xpathSubatomicParticles[0]}]`, lastNode[xpathSubatomicParticles[0]] );
              node = lastNode[xpathSubatomicParticles[0]];
            } else {
              this.log( `contextNode[${xpathSubatomicParticles[0]}];`, contextNode[xpathSubatomicParticles[0]] );
              node = contextNode[xpathSubatomicParticles[0]];
            }
          } else {
            if ( lastNode ) {
              // this.log( `lastNode[${xpathSubatomicParticles[0]}][${xpathSubatomicParticles[1]}];` );
              node = lastNode[xpathSubatomicParticles[0]][xpathSubatomicParticles[1]];
            } else {
              // this.log( 'contextNode', contextNode );
              // this.log( `contextNode[${xpathSubatomicParticles[0]}][${xpathSubatomicParticles[1]}];` );
              node = contextNode[xpathSubatomicParticles[0]][xpathSubatomicParticles[1]];
            }
          }

          if ( !node ) {
            return new JSONXPathResult();
          }
        } else if ( xpathRegex__withAttribute.test( xpathAtom ) ) {
          const xpathSubatomicParticles = xpathAtom.split( xpathRegex__brackets );
          xpathSubatomicParticles.pop();

          if ( lastNode ) {
            node = lastNode[xpathSubatomicParticles[0]];
          } else {
            node = contextNode[xpathSubatomicParticles[0]];
          }

          if ( !node ) {
            return new JSONXPathResult();
          }

          const [attributeSelectorName, attributeSelectorValue] = xpathSubatomicParticles[1].replace( /@([^=]+)=(['"])(.*)\2/i, '$1=$3' ).split( '=' );

          if ( node[attributeSelectorName] !== attributeSelectorValue ) {
            return new JSONXPathResult();
          }

          // [lastAtom] = xpathSubatomicParticles;
        } else if ( xpathRegex__contains.test( xpathAtom ) ) {
          // uri[contains(., '//www.youtube.com/watch?v=')]
          const xpathSubatomicParticles = xpathAtom.split( xpathRegex__brackets );
          xpathSubatomicParticles.pop();

          if ( lastNode ) {
            node = lastNode[xpathSubatomicParticles[0]];
          } else {
            node = contextNode[xpathSubatomicParticles[0]];
          }

          if ( !node ) {
            return new JSONXPathResult();
          }

          // contains(., '//www.youtube.com/watch?v=')
          const containsTest = xpathSubatomicParticles[1].replace( /contains\(\s*[^,]+,\s*(["'])(.*)\1\)/i, '$2' );
          if ( node.indexOf( containsTest ) === -1 ) {
            return new JSONXPathResult();
          }
        } else if ( xpathRegex__text.test( xpathAtom ) ) {
          node = lastNode;
        } else {
          node = contextNode[xpathAtom];

          if ( !node ) {
            return new JSONXPathResult();
          }
        }

        if ( xpathAtoms.length > 0 ) {
          lastNode = node;
        } else {
          if ( lastNode === null ) {
            if ( !node ) {
              return new JSONXPathResult();
            }

            lastNode = node;
          }

          let snapshotItem: JSONElement;

          switch ( typeof lastNode ) {
            case 'string':
              snapshotItem = {
                nodeType: Node.TEXT_NODE,
                nodeName: '#text',
                getAttribute: () => null,
                getAttributeNS: () => null,
                textContent: lastNode,
                childNodes: [],
              };
              break;

            case 'object':
            default:
              snapshotItem = {
                ...lastNode,
                nodeType: Node.ELEMENT_NODE,
                nodeName: lastNode['@type'],
                // textContent: JSON.stringify( lastNode );
                textContent: null,
              };
          }

          return new JSONXPathResult( {
            "snapshotItems": [snapshotItem],
            "snapshotLength": 1,
          } );
        }
      }

      return new JSONXPathResult();
    }
  /* eslint-enable camelcase */
  };
};