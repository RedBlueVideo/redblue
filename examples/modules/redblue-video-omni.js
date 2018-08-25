'use strict';

import RedBlueVideo from './redblue-video.js';
import RedBlueXMLParser from './parser-xml.js';
import RedBlueJSONLDParser from './parser-json-ld.js';

const RedBlueVideoOmni =
  RedBlueJSONLDParser(
    RedBlueXMLParser(
      RedBlueVideo
    )
  )
;

export default RedBlueVideoOmni;
