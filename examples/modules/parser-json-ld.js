'use strict';

// Dummy clone of XPathResult
class JSONXPathResult {
  constructor( properties = {} ) {
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

  get booleanValue() { return this._booleanValue; }
  get invalidIteratorState() { return this._invalidIteratorState; }
  get numberValue() { return this._numberValue; }
  get resultType() { return this._resultType; }
  get singleNodeValue() { return this._singleNodeValue; }
  get snapshotLength() { return this._snapshotLength; }
  get stringValue() { return this._stringValue; }

  snapshotItem( index ) {
    return this._snapshotItems[index];
  }

  iterateNext() {
    return this._snapshotItems.shift();
  }
}

const RedBlueJSONLDParser = ( superClass ) => {
  let _customJSONSearchUtility = null;

  return class extends superClass {
    constructor() {
      super();

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

      if ( !this.hvml['@context'] || !this.hvml['@context'].length ) {
        console.warn( `JSON-LD Context is blank or missing.\n` + USING_DEFAULT_CSS_PREFIX );
        return defaultPrefix;
      }

      let context = this.hvml['@context'];
      // const fetchURIregex = /^(((https?|ftps?|about|blob|data|file|filesystem):)|\.\.?\/)(.*)\.json(ld)?$/i;

      if ( typeof context === 'string' ) {
        let request = new Request( context );

        context = await fetch( request )
          .then( ( response ) => {
            if ( !response.ok ) {
              throw `JSON-LD Context interpreted as URL but unresolvable: \`${this.hvml['@context']}\`.\n` + USING_DEFAULT_CSS_PREFIX;
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
        for ( let property in context ) {
          if ( context[property].match( /https?:\/\/www\.w3\.org\/TR\/CSS\/?/i ) ) {
            return property;
          }
        }
      }

      return defaultPrefix;
    }

    getEmbedUriFromJSONLD() {

      // https://www.youtube.com/embed/nWdWq3hMwao?rel=0&amp;showinfo=0&amp;start=517&amp;end=527&amp;enablejsapi=1&amp;controls=0&amp;modestbranding=1
    }

    getAnnotationsFromJSONLD() {}

    /*
      Note: In order to minimize dependencies, this does not currently process
      arbitrary XPath expressions; only a subset covering the most common cases.
      If you would like to use a full-fledged JSON Search utility,
      prior to calling `customElements.define`, you can set the static property
      `RedBlueJSONLDParser.customJSONSearchUtility` to a wrapper function
      that takes the same arguments as `document.evaluate`, all of which
      are optional except the first, `xpathExpression`.
    */
    findInJSONLD( xpathExpression, contextNode = this.hvml, namespaceResolver = null, resultType = XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, result = null ) {
      if ( RedBlueJSONLDParser.customJSONSearchUtility ) {
        return RedBlueJSONLDParser.customJSONSearchUtility( xpathExpression, contextNode, namespaceResolver, resultType, result );
      }

      const atoms = [];
      let asksForRootDescendants = false;
      let asksForLocalDescendants = false;

      // Regular Expressions
      const xpathRegex__contains = /([^\[\]]+\[contains\(\s*[^,]+,\s*(?:['"]).*\1\s*\)\])/i;
      const xpathRegex__rootDescendants = /^\/\//i;
      const xpathRegex__localDescendants = /\.\/\//i;
      const xpathRegex__withAttribute = /[^\[\]]+\[@[^=]+=(['"]).*\1\]/i;
      const xpathRegex__text = /text()/i;
      const xpathRegex__brackets = /[\[\]]/i;

      if ( xpathRegex__rootDescendants.test( xpathExpression ) ) {
        asksForRootDescendants = true;
        xpathExpression = xpathExpression.replace( xpathRegex__rootDescendants, '' );
      } else if ( xpathRegex__localDescendants.test( xpathExpression ) ) {
        asksForLocalDescendants = true;
        xpathExpression = xpathExpression.replace( xpathRegex__localDescendants, '' );
      }

      const xpathParts = xpathExpression.split( xpathRegex__contains );

      for ( let i = 0; i < xpathParts.length; i++ ) {
        let xpathPart = xpathParts[i];

        if ( !xpathRegex__contains.test( xpathPart ) ) {
          let splitted = xpathPart.split( '/' );

          for ( let i = 0; i < splitted.length; i++ ) {
            if ( splitted[i] !== '' ) {
              atoms.push( splitted[i] );
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
      let atom, lastAtom = null, datum, lastDatum = null;
      while ( atoms.length > 0 ) {
        atom = atoms.shift();

        if ( xpathRegex__withAttribute.test( atom ) ) {
          let subatomicParticles = atom.split( xpathRegex__brackets );
              subatomicParticles.pop();

          if ( lastDatum ) {
            datum = lastDatum[subatomicParticles[0]];
          } else {
            datum = this.hvml[subatomicParticles[0]];
          }

          if ( !datum ) {
            return new JSONXPathResult();
          }

          subatomicParticles[1] = subatomicParticles[1].replace( /@([^=]+)=(['"])(.*)\2/i, '$1=$3' ).split( '=' );

          if ( datum[subatomicParticles[1][0]] !== subatomicParticles[1][1] ) {
            return new JSONXPathResult();
          }

          lastAtom = subatomicParticles[0];
        } else if ( xpathRegex__contains.test( atom ) ) {
          // uri[contains(., '//www.youtube.com/watch?v=')]
          let subatomicParticles = atom.split( xpathRegex__brackets );
              subatomicParticles.pop();

          if ( lastDatum ) {
            datum = lastDatum[subatomicParticles[0]];
          } else {
            datum = this.hvml[subatomicParticles[0]];
          }

          if ( !datum ) {
            return new JSONXPathResult;
          }

          // contains(., '//www.youtube.com/watch?v=')
          let containsTest = subatomicParticles[1].replace( /contains\(\s*[^,]+,\s*(["'])(.*)\1\)/i, '$2' );
          if ( datum.indexOf( containsTest ) === -1 ) {
            return new JSONXPathResult();
          }
        } else if ( xpathRegex__text.test( atom ) ) {
          datum = lastDatum;
        } else {
          datum = this.hvml[atom];

          if ( !datum ) {
            return new JSONXPathResult();
          }
        }

        if ( atoms.length > 0 ) {
          lastAtom = atom;
          lastDatum = datum;
        } else {
          return new JSONXPathResult( {
            "snapshotItems": [ {
              "textContent": lastDatum.toString()
            } ],
            "snapshotLength": 1
          } );
        }
      }

      // return document.evaluate(
      //   xpathExpression,
      //   this.hvml, // contextNode
      //   function ( prefix ) {
      //     const ns = {
      //       "hvml": "https://hypervideo.tech/hvml#",
      //       "html": "http://www.w3.org/1999/xhtml"
      //     };
      //
      //     return ( ns[prefix] || ns.html );
      //   }, // namespaceResolver
      //   // XPathResult.ANY_TYPE, // resultType
      //   XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
      //   null // result
      // )
    }
  }
};

export default RedBlueJSONLDParser;
