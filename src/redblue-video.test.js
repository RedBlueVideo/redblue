import { html, fixture, expect } from '@open-wc/testing';
import RedBlueVideo from './parser-omni.js';

customElements.define( 'redblue-video', RedBlueVideo );

describe( '<redblue-video />', () => {
  it( 'embeds YouTube videos', async () => {
    const el = await fixture( html`<redblue-video></redblue-video>` );
    expect( el ).dom.to.equal( `<redblue-video class="redblue-video" role="application"></redblue-video>` );
  } );
} );
