import {
  html,
  fixture,
  expect,
} from '../node_modules/@open-wc/testing/index.js';
// import * as chai from '../node_modules/chai/index.js';
// import { expect } from '../node_modules/chai/lib/chai/interface/expect.js';
// import 'chai/register-expect';
import RedBlueVideo from '/src/parser-omni.js';

// customElements.define( 'redblue-video', RedBlueVideo );

describe( '<redblue-video />', () => {
  it( 'embeds YouTube videos', async () => {
    const el = await fixture( html`<redblue-video></redblue-video>` );
    expect( el ).dom.to.equal( `<redblue-video class="redblue-video" role="application"></redblue-video>` );
    // expect( true ).to.be.equal( true );
  } );
} );
