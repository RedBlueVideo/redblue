// http://stackoverflow.com/a/18026530/214325
var video = document.querySelector('video');

window.MediaSource = window.MediaSource || window.WebKitMediaSource;
if (!!!window.MediaSource) {
  alert('MediaSource API is not available');
}

var mediaSource = new MediaSource();

video.src = window.URL.createObjectURL(mediaSource);

mediaSource.addEventListener('webkitsourceopen', function(e) {
  /* forget the sourcebuffer variable, we'll just manipulate mediaSource */
  mediaSource.addSourceBuffer('video/webm; codecs="vorbis,vp8"');

  /* it seems ok to set initial duration 0 */
  var duration = 0;
  var totalVideos = 2;

  /* use this type of loop to ensure that that a single video
   is downloaded and appended before moving on to the next video,
   mediasource seems picky about these being in order */
  var i = 0;
  (function readChunk_(i) {

    /* the GET function already returns a Uint8Array.
       the demo you linked reads it in filereader in order to manipulate it;
       you just want to immediately append it */
    GET('/clips/v1' + (i + 1) + '.webm', function(uint8Array) {

      if (i == totalVideos) {
        mediaSource.endOfStream();
      } else {

        /* assuming your videos are put together correctly
               (i.e. duration is correct), set the timestamp offset
               to the length of the total video */
        mediaSource.sourceBuffers[0].timestampOffset = duration;

        mediaSource.sourceBuffers[0].append(uint8Array);

        /* set new total length */
        duration = mediaSource.duration;

        readChunk_(++i);
      }
    });
  })(i);
}, false);

mediaSource.addEventListener('webkitsourceended', function(e) {
  logger.log('mediaSource readyState: ' + this.readyState);
}, false);

function GET(url, callback) {
  console.log(url);
  var xhr = new XMLHttpRequest();
  xhr.open('GET', url, true);
  xhr.responseType = 'arraybuffer';
  xhr.send();

  xhr.onload = function(e) {
    if (xhr.status != 200) {
      alert("Unexpected status code " + xhr.status + " for " + url);
      return false;
    }
    callback(new Uint8Array(xhr.response));
  };
}