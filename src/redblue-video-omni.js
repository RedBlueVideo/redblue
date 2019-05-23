'use strict';

import RedBlueVideo from './redblue-video.js';
import RedBlueXMLParser from './parser-xml.js';
import RedBlueJSONLDParser from './parser-json-ld.js';
import RedBlueMSEPlayer from './player-mse.js';

const RedBlueVideoOmni =
  RedBlueMSEPlayer(
    RedBlueJSONLDParser(
      RedBlueXMLParser(
        RedBlueVideo
      )
    )
  )
;

export default RedBlueVideoOmni;
