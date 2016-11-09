// http://www.w3.org/TR/media-source/#examples
// https://github.com/jbochi/media-source-playground/blob/master/test.html

var buffers = [
  'clips/setup.webm',
  'clips/ending-crazy.webm'
];

function GetInitializationSegment() {
  console.log('init: ' + buffers.length);
  var buffer = buffers[0];
  buffers = buffers.slice(1);
  return buffer;
}

function HaveMoreMediaSegments() {
  return buffers.length > 0;
}

function onSourceOpen(videoTag, e) {
  var mediaSource = e.target;

  if (mediaSource.sourceBuffers.length > 0)
      return;

  var sourceBuffer = mediaSource.addSourceBuffer('video/webm; codecs="vorbis,vp8"');

  videoTag.addEventListener('seeking', onSeeking.bind(videoTag, mediaSource));
  videoTag.addEventListener('progress', onProgress.bind(videoTag, mediaSource));

  var initSegment = GetInitializationSegment();

  console.log(initSegment);

  if (initSegment === null) {
    // Error fetching the initialization segment. Signal end of stream with an error.
    mediaSource.endOfStream("network");
    return;
  }

  // Append the initialization segment.
  var firstAppendHandler = function(e) {
    var sourceBuffer = e.target;
    sourceBuffer.removeEventListener('updateend', firstAppendHandler);

    // Append some initial media data.
    appendNextMediaSegment(mediaSource);
  };
  sourceBuffer.addEventListener('updateend', firstAppendHandler);
  sourceBuffer.appendBuffer(initSegment);
}

function appendNextMediaSegment(mediaSource) {
  if (mediaSource.readyState == "closed")
    return;

  // If we have run out of stream data, then signal end of stream.
  if (!HaveMoreMediaSegments()) {
    mediaSource.endOfStream();
    return;
  }

  // Make sure the previous append is not still pending.
  if (mediaSource.sourceBuffers[0].updating)
      return;

  var mediaSegment = GetNextMediaSegment();

  if (!mediaSegment) {
    // Error fetching the next media segment.
    mediaSource.endOfStream("network");
    return;
  }

  // NOTE: If mediaSource.readyState == “ended”, this appendBuffer() call will
  // cause mediaSource.readyState to transition to "open". The web application
  // should be prepared to handle multiple “sourceopen” events.
  mediaSource.sourceBuffers[0].appendBuffer(mediaSegment);
}

function onSeeking(mediaSource, e) {
  var video = e.target;

  if (mediaSource.readyState == "open") {
    // Abort current segment append.
    mediaSource.sourceBuffers[0].abort();
  }

  // Notify the media segment loading code to start fetching data at the
  // new playback position.
  SeekToMediaSegmentAt(video.currentTime);

  // Append a media segment from the new playback position.
  appendNextMediaSegment(mediaSource);
}

function onProgress(mediaSource, e) {
  appendNextMediaSegment(mediaSource);
}

var video = document.getElementById('v');
var mediaSource = new MediaSource();
mediaSource.addEventListener('sourceopen', onSourceOpen.bind(this, video));
video.src = window.URL.createObjectURL(mediaSource);