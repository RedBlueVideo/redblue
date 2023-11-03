/* eslint-disable max-classes-per-file */
'use strict';

// declare global {
//   interface HTMLElement {
//       connectedCallback(): void;
//   }
// }

import RedBlueVideo, { $Element } from "./redblue-video";
import { MixinConstructor } from "./util";

type JSONNode = Record<string, any> & {
  nodeType: Node['nodeType'];
}

// Dummy clone of XPathResult
export class JSONXPathResult /*extends XPathResult*/ {
  _booleanValue: XPathResult['booleanValue'];
  _invalidIteratorState: XPathResult['invalidIteratorState'];
  _numberValue: XPathResult['numberValue'];
  _resultType: XPathResult['resultType'];
  _singleNodeValue: XPathResult['singleNodeValue'];
  _snapshotLength: XPathResult['snapshotLength'];
  _stringValue: XPathResult['stringValue'];
  _snapshotItems: JSONNode[];

  constructor( properties: Partial<XPathResult> & { snapshotItems?: JSONNode[] } = {} ) {
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
              throw new Error( `JSON-LD Context interpreted as URL but unresolvable: \`${this.hvml.jsonLD['@context']}\`.\n${USING_DEFAULT_CSS_PREFIX}` );
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

      const atoms = [];
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
          const splitted = xpathPart.split( '/' );

          for ( let j = 0; j < splitted.length; j++ ) {
            if ( splitted[j] !== '' ) {
              atoms.push( splitted[j] );
            }
          }
        } else {
          atoms.push( xpathPart.replace( /\//i, '' ) );
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
      let atom;
      // let lastAtom = null;
      let datum;
      let lastDatum = null;

      while ( atoms.length > 0 ) {
        atom = atoms.shift();

        if ( xpathRegex__withIndex.test( atom ) ) {
          const subatomicParticles = atom.split( xpathRegex__brackets );
          subatomicParticles.pop();

          const secondSubatomicParticle: number = Number( subatomicParticles[1] ) - 1;

          if ( ( secondSubatomicParticle === 0 ) && this.HVML_SOLO_ELEMENTS.indexOf( subatomicParticles[0] ) !== -1 ) {
            if ( lastDatum ) {
              this.log( `lastDatum[${subatomicParticles[0]}]`, lastDatum[subatomicParticles[0]] );
              datum = lastDatum[subatomicParticles[0]];
            } else {
              this.log( `contextNode[${subatomicParticles[0]}];`, contextNode[subatomicParticles[0]] );
              datum = contextNode[subatomicParticles[0]];
            }
          } else {
            if ( lastDatum ) {
              // this.log( `lastDatum[${subatomicParticles[0]}][${subatomicParticles[1]}];` );
              datum = lastDatum[subatomicParticles[0]][subatomicParticles[1]];
            } else {
              // this.log( 'contextNode', contextNode );
              // this.log( `contextNode[${subatomicParticles[0]}][${subatomicParticles[1]}];` );
              datum = contextNode[subatomicParticles[0]][subatomicParticles[1]];
            }
          }

          if ( !datum ) {
            return new JSONXPathResult();
          }
        } else if ( xpathRegex__withAttribute.test( atom ) ) {
          const subatomicParticles: ( string | string[] )[] = atom.split( xpathRegex__brackets );
          subatomicParticles.pop();

          if ( lastDatum ) {
            datum = lastDatum[subatomicParticles[0] as string];
          } else {
            datum = contextNode[subatomicParticles[0] as string];
          }

          if ( !datum ) {
            return new JSONXPathResult();
          }

          subatomicParticles[1] = ( subatomicParticles[1] as string ).replace( /@([^=]+)=(['"])(.*)\2/i, '$1=$3' ).split( '=' );

          if ( datum[subatomicParticles[1][0]] !== subatomicParticles[1][1] ) {
            return new JSONXPathResult();
          }

          // [lastAtom] = subatomicParticles;
        } else if ( xpathRegex__contains.test( atom ) ) {
          // uri[contains(., '//www.youtube.com/watch?v=')]
          const subatomicParticles = atom.split( xpathRegex__brackets );
          subatomicParticles.pop();

          if ( lastDatum ) {
            datum = lastDatum[subatomicParticles[0]];
          } else {
            datum = contextNode[subatomicParticles[0]];
          }

          if ( !datum ) {
            return new JSONXPathResult();
          }

          // contains(., '//www.youtube.com/watch?v=')
          const containsTest = subatomicParticles[1].replace( /contains\(\s*[^,]+,\s*(["'])(.*)\1\)/i, '$2' );
          if ( datum.indexOf( containsTest ) === -1 ) {
            return new JSONXPathResult();
          }
        } else if ( xpathRegex__text.test( atom ) ) {
          datum = lastDatum;
        } else {
          datum = contextNode[atom];

          if ( !datum ) {
            return new JSONXPathResult();
          }
        }

        if ( atoms.length > 0 ) {
          // lastAtom = atom;
          lastDatum = datum;
        } else {
          if ( lastDatum === null ) {
            lastDatum = datum;
          }

          let snapshotItem: JSONNode;

          switch ( typeof lastDatum ) {
            case 'string':
              snapshotItem = { nodeType: 1 };
              snapshotItem.textContent = lastDatum;
              break;

            case 'object':
            default:
              snapshotItem = { ...lastDatum };
              // snapshotItem.textContent = JSON.stringify( lastDatum );
              snapshotItem.textContent = null;
          }

          return new JSONXPathResult( {
            "snapshotItems": [snapshotItem],
            "snapshotLength": 1,
          } );
        }
      }
    }
  /* eslint-enable camelcase */
  };
};