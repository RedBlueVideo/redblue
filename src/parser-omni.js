'use strict';

import RedBlueVideo from './redblue-video.ts';
import RedBlueXMLParser from './parser-xml.js';
import RedBlueJSONLDParser from './parser-json-ld.ts';

const RedBlueOmniParser = RedBlueJSONLDParser(
  RedBlueXMLParser( RedBlueVideo ),
);

export default RedBlueOmniParser;

// ----

// const RedBlueOmniParser = RedBlueVideo( [RedBlueXMLParser, RedBlueJSONLDParser] );