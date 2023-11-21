'use strict';

import RedBlueVideo from './redblue-video.js';
import { XMLParser } from './parser-xml.js';
import { JSONLDParser } from './parser-json-ld.js';

const RedBlueOmniParser = JSONLDParser(
  XMLParser( RedBlueVideo ),
);

export default RedBlueOmniParser;

// ----

// const RedBlueOmniParser = RedBlueVideo( [RedBlueXMLParser, RedBlueJSONLDParser] );