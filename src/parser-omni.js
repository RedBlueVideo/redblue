'use strict';

import RedBlueVideo from './redblue-video.js';
import RedBlueXMLParser from './parser-xml.js';
import RedBlueJSONLDParser from './parser-json-ld.js';

const RedBlueOmniParser = RedBlueJSONLDParser(
  RedBlueXMLParser( RedBlueVideo )
);

export default RedBlueOmniParser;
