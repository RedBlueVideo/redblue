<p align="center">
  <br />
  <img src="https://raw.githubusercontent.com/RedBlueVideo/redblue-site/master/img/redblue-logo--no-spacing.svg?sanitize=true" width="113" alt="logo" />
</p>
<h1 align="center">redblue</h1>
<p align="center">Open-Source Hypervideo Framework</p>
<p align="center">
  <a href="https://travis-ci.com/RedBlueVideo/redblue">
    <img src="https://api.travis-ci.com/RedBlueVideo/redblue.svg?branch=master" alt="Build Status" />
  </a> <a href="https://codecov.io/gh/RedBlueVideo/redblue/">
    <img src="https://img.shields.io/codecov/c/github/RedBlueVideo/redblue/master.svg" alt="Code Coverage">
  </a> <a href="https://www.npmjs.com/package/redblue">
    <img src="https://img.shields.io/npm/dm/redblue.svg" alt="Downloads per month (NPM)">
  </a>
</p>

----


## Stability
⚠️ The `master` branch currently represents an alpha pre-release. Features and syntax are subject to change at any time, so please don’t use it in production. Unless you’re some kind of daredevil.

## About
<dfn>Hypervideo</dfn>: online video annotated with time-based links and other widgets.

Hypervideo opens up a world of immersive storytelling, such as choose-your-own-story films, which boast high audience engagement, and video hotspots which trigger an action, such as jumping to a chapter marker, learning more about a topic, or buying a product/service.

Most hypervideo offerings are proprietary, requiring recurring payments and vendor lock-in to use. This hinders cash-strapped visual artists, and silos metadata that could be useful in search and beyond. RedBlue enables more people to produce hypervideo by democratizing the technology behind it. We author an open specification, [<dfn>HVML</dfn> (Hypervideo Markup Language)](https://hypervideo.tech/), which aims to be the HTML of video.

In conjunction, we develop this, the RedBlue JavaScript player, which brings the immersive features of HVML to any website—conveniently implemented as a [Web Component](https://www.webcomponents.org/introduction) (i.e. Custom Element).

## Support

### “Choose Your Own Story” video experiences
Choice-based narratives are implemented using the developing HTML5 [Media Source Extensions API](http://w3c.github.io/media-source/), which means all current implementations are experimental.

So far, it has the best support in Blink-based browsers such as Google Chrome, which is being used as the reference implementation for this project.

Gecko-based browsers such as Mozilla Firefox have limited support (behind an `about:config` flag), but work is being done to [catch up](https://bugzilla.mozilla.org/show_bug.cgi?id=778617) to Blink.

Internet Explorer introduces support in version 11 on Windows 8, but for MP4 videos only, which are of secondary concern to WebM in this project and not currently supported.

This is not yet integrated into the Custom Element, but a [prototype](https://redbluevideo.github.io/redblue/www/) demoing this functionality is available for Chrome Desktop.

### Hotspots
A preliminary version of hotspots are implemented for YouTube embeds. See the [Developer Guide](https://redblue.video/guide/third-party-embeds.html?utm_source=readme&utm_medium=github&utm_content=hotspots).

## Installation
- `yarn add redblue` or
- `npm install redblue`

Note that RedBlue is not yet feature-complete, so only an alpha version has been published to NPM.

## Usage
Import the RedBlue video player Custom Element. (This requires ES6 support to work directly in the browser; otherwise the source code can be transpiled to ES5.)
```html
<script type="module">
  import RedBlueVideo from './guide/modules/redblue-video-omni.js';
  customElements.define( RedBlueVideo.is, RedBlueVideo );
</script>
```

Include an <abbr>HVML</abbr> code block as a child of `<redblue-video>`. <abbr>HVML</abbr> can be represented as either <abbr>XML</abbr> or <abbr>JSON-LD</abbr>. When using the <abbr>XML</abbr> serialization, set the boolean `hidden` attribute to true to prevent the browser from rendering the metadata.
```xml
<redblue-video>
  <hvml xmlns="https://hypervideo.tech/hvml#" hidden="hidden"></hvml>
</redblue-video>
```

Populate the <abbr>HVML</abbr> data. RedBlue will render the appropriate video embed code and user interface. For an explanation of what this code does, see the [Developer Guide](https://redblue.video/guide/third-party-embeds.html?utm_source=readme&utm_medium=github&utm_content=usage).
```xml
<redblue-video id="redblue-youtube-xml" aspect-ratio="16:9" debug="debug">
  <hvml xmlns="https://hypervideo.tech/hvml#" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:css="https://www.w3.org/TR/CSS/" xml:lang="en-US" hidden="hidden">
    <video type="personal" xml:id="ep-23">
      <title>Overnight Dance Party at the Museum of Fine Arts Boston</title>
      <episode>23</episode>
      <recorded>2016-09-17</recorded>
      <description type="xhtml">
        <div xmlns="http://www.w3.org/1999/xhtml">
          <p>Full Facebook Live stream: http://hugh.today/2016-09-17/live</p>
          <p>#mfaNOW #mfaLateNites</p>
        </div>
      </description>
      <showing scope="release" type="internet" admission="private">
        <venue type="site">
          <entity site="https://www.youtube.com/">YouTube</entity>
          <uri>https://www.youtube.com/watch?v=nWdWq3hMwao</uri>
          <title>Overnight Dance Party at the Museum of Fine Arts Boston | Hugh’s Vlog | #mfaNOW #mfaLateNites</title>
        </venue>
      </showing>
      <presentation>
        <choice xml:id="full-stream">
          <name>Go to: <code style="font-family: inherit; font-weight: bold;">hugh.today/2016-09-17/live</code> for the full stream</name>
          <goto on="duration" xlink:actuate="onRequest" xlink:href="http://hugh.today/2016-09-17/live" width="70%" height="13%" css:font-size="calc(384 / 150 * 1vw)" css:font-family="'Noto Sans CJK JP', 'Noto Sans CJK', 'Noto Sans', sans-serif" css:white-space="nowrap" css:overflow="hidden">
            <animate starttime="517.292107" endtime="518.872131" startx="14.9%" starty="-15%" endx="15%" endy="10%"></animate>
            <animate starttime="523.373882" endtime="524.873404" startx="14.9%" starty="10%" endx="15%" endy="-15%"></animate>
          </goto>
        </choice>
      </presentation>
    </video>
  </hvml>
</redblue-video>
```

## Contributing
As this is alpha software, we are not currently accepting Pull Requests, but you are welcome to test it out and offer feedback by posting it to Issues, or by tweeting [@RedBlueVideo](https://twitter.com/RedBlueVideo).

## Known Issues
- Limited browser support
- Choice-based narratives not in `master`
- Hotspot animations do not respond to pauses or timeline seeking within their trigger range

## Team
RedBlue Video is a small-time operation headed by Hugh Guiney, a senior UX developer (Twitter: [@LordPancreas](https://twitter.com/LordPancreas) & [@HughxDev](https://twitter.com/HughxDev), GitHub: [@HughxDev](https://github.com/HughxDev)), with help from his brother Austin, a CS undergrad (Twitter: [@SenorKoffey](https://twitter.com/SenorKoffey), GitHub: [@pyreking](https://github.com/pyreking)).
