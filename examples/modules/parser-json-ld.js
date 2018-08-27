'use strict';

const RedBlueJSONLDParser = ( superClass ) => {
  return class extends superClass {
    constructor() {
      super();

      this.MISSING_JSONLD_CONTEXT_ERROR = 'Can’t process; missing `@context` root-level property in JSON-LD';
    }

    // connectedCallback() {
    //   super.connectedCallback();
    // }

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

    getEmbedUriFromJSONLD() {}

    getAnnotationsFromJSONLD() {}
  }
};

export default RedBlueJSONLDParser;
