// @jsx h

import React from 'react';
import { storiesOf } from '@storybook/react';
import val from '@skatejs/val';

import RedBlueVideo from '../src/parser-omni.js';
import youtubeEmbed from '../guide/youtube-embed.hvml';

const h = val( React.createElement ); // eslint-disable-line no-unused-vars

if ( !customElements.get( 'redblue-video' ) ) {
  customElements.define( 'redblue-video', RedBlueVideo );
}

storiesOf( 'RedBlueVideo', module )
  .add( 'with no light DOM', () => <RedBlueVideo aspect-ratio="16:9" /> )
  .add( 'with a light DOM', () => <RedBlueVideo aspect-ratio="16:9" dangerouslySetInnerHTML={ { "__html": youtubeEmbed } }></RedBlueVideo> );
