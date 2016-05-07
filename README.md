# redblue
Open-Source Interactive Video Framework

## Uses
- “Choose Your Own Story” video experiences
- Hotspots within the video window that trigger an action such as jumping to a chapter marker, learning more about a topic, buying a product/service, etc.

## Support
This framework utilizes the developing HTML5 [Media Source Extensions API](http://w3c.github.io/media-source/), which means all current implementations are experimental.

So far, it has the best support in Blink-based browsers such as Google Chrome, which is being used as the reference implementation for this project.

Gecko-based browsers such as Mozilla Firefox have limited support (behind an `about:config` flag), but work is being done to [catch up](https://bugzilla.mozilla.org/show_bug.cgi?id=778617) to Blink.

Internet Explorer introduces support in version 11 on Windows 8, but for MP4 videos only, which are of secondary concern to WebM in this project and not currently supported.
