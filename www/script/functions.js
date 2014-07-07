// http://www.w3.org/TR/media-source/#examples
// https://github.com/jbochi/media-source-playground/blob/master/test.html
var buffers = [],
    totalVideos,
    duration = 0,
    bufferLoading = false;

function onSourceOpen(videoTag, e) {
  var mediaSource = e.target;

  if (mediaSource.sourceBuffers.length > 0)
      return;

  var sourceBuffer = mediaSource.addSourceBuffer('video/webm; codecs="vorbis,vp8"');

  //videoTag.addEventListener('seeking', onSeeking.bind(videoTag, mediaSource));
  //videoTag.addEventListener('progress', onProgress.bind(videoTag, mediaSource));

  var initSegment = GetNextMediaSegment();

  if (initSegment === null) {
    // Error fetching the initialization segment. Signal end of stream with an error.
    console.log("Error fetching the initialization segment.");
    mediaSource.endOfStream("network");
    return;
  }

  // Append the initialization segment.
  var firstAppendHandler = function(e) {
    console.log('--firstAppendHandler--');
    var sourceBuffer = e.target;
    sourceBuffer.removeEventListener('updateend', firstAppendHandler);

    // Append some initial media data.
    appendNextMediaSegment(mediaSource);
  };
  sourceBuffer.addEventListener('updateend', firstAppendHandler);
  sourceBuffer.appendBuffer(initSegment);
}

function appendNextMediaSegment(mediaSource) {
  console.log('--appendNextMediaSegment--');
  
  // Make sure the previous append is not still pending.
  if (mediaSource.sourceBuffers[0].updating) {
    return;
  }

  if (mediaSource.readyState !== "open") {
    return;
  }

  if ( mediaSource.sourceBuffers[0].mode == "PARSING_MEDIA_SEGMENT" ) {
    return;
  }

  // If we have run out of stream data, then signal end of stream.
  // This should come after the updating check.
  if (!HaveMoreMediaSegments()) {
    console.log(mediaSource.readyState);
    console.log("There are no more media segments");
    mediaSource.endOfStream();
    return;
  }

  if (bufferLoading) {
    return;
  }

  var mediaSegment = GetNextMediaSegment();

  if (!mediaSegment) {
    // Error fetching the next media segment.
    console.log("Error fetching the next media segment.");
    mediaSource.endOfStream("network");
    return;
  }

  // NOTE: If mediaSource.readyState == “ended”, this appendBuffer() call will
  // cause mediaSource.readyState to transition to "open". The web application
  // should be prepared to handle multiple “sourceopen” events.

  duration = mediaSource.duration;
  console.log('Duration: ' + duration);
  mediaSource.sourceBuffers[0].timestampOffset = duration;
  mediaSource.sourceBuffers[0].appendBuffer(mediaSegment);
}

function onSeeking(mediaSource, e) {
  console.log('--onSeeking--');
  var video = e.target;

  if (mediaSource.readyState == "open") {
    // Abort current segment append.
    mediaSource.sourceBuffers[0].abort();
  }

  // Notify the media segment loading code to start fetching data at the
  // new playback position.
  //SeekToMediaSegmentAt(video.currentTime);
  //console.log(video.currentTime);

  // Append a media segment from the new playback position.
  appendNextMediaSegment(mediaSource);
}

function onProgress(mediaSource, e) {
  console.log('--onProgress--');
  appendNextMediaSegment(mediaSource);
}

function readPlaylistItem(uInt8Array) {
  var file = new Blob([uInt8Array], {type: 'video/webm'});
  var reader = new FileReader();

  reader.onloadstart = function (e) {
    bufferLoading = true;
  };

  reader.onload = function (e) {
    buffers.push(new Uint8Array(e.target.result));
    bufferLoading = false;
    //console.log(buffers);
  };

  console.log(file);
  reader.readAsArrayBuffer(file);
}

function GetNextMediaSegment() { // GetInitializationSegment
  console.log('--GetNextMediaSegment--');
  var buffer = buffers[0];
  buffers = buffers.slice(1);
  console.log('Got video #' + ( totalVideos - buffers.length ) + ' of ' + totalVideos);
  return buffer;
}

function HaveMoreMediaSegments() {
  console.log('--HaveMoreMediaSegments--');
  var bool = buffers.length > 0;
  console.log(bool + ', remaining buffers: ' + buffers.length);
  return bool;
}

//var GetNextMediaSegment = GetInitializationSegment;

function GET(url, callback) {
  var xhr = new XMLHttpRequest();
  xhr.open('GET', url, true);
  xhr.responseType = 'arraybuffer';
  xhr.send();

  xhr.onload = function(e) {
    if (xhr.status !== 200) {
      alert("Unexpected status code " + xhr.status + " for " + url);
      return false;
    }
    callback(new Uint8Array(xhr.response));
  };
}

function load_playlist(url, callback) {
  var xhr = new XMLHttpRequest();
  xhr.addEventListener('load', function(e) {

    if ( xhr.status !== 200 ) {
      alert("Unexpected status code " + xhr.status + " for " + url);
      return false;
    }

    var regex = /^[^#].*$/mg;
    var urls = [];
    var result;

    while ((result = regex.exec(xhr.response))) {
      urls.push(result[0]);
    }

    console.log(urls);
    console.log('Playlist loaded');
    totalVideos = urls.length;
    callback(urls);
  });

  xhr.addEventListener('error', function() {
    console.log('Playlist load error');
  });

  xhr.open("GET", url);
  xhr.send();
}

load_playlist('clips/fog-playlist.m3u', function callback(playlist_urls) {
  for (var i = 0; i < playlist_urls.length; i++) {
    GET(playlist_urls[i], readPlaylistItem);
  }
  //console.log(buffers);
});