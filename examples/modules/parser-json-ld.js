'use strict';

const RedBlueJSONLDParser = ( superClass ) => {
  return class extends superClass {
    constructor() {
      super();
    }

    get hasJSONLDParser() {
      return true;
    }

    getCSSNamespacePrefixFromJSONLD() {
      //
      return null;
    }

    getEmbedUriFromJSONLD() {}

    getAnnotationsFromJSONLD() {}
  }
};

export default RedBlueJSONLDParser;
