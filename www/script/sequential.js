/*jshint laxcomma: true, smarttabs: true */

// https://html5-demos.appspot.com/static/media-source.html
window.MediaSource = window.MediaSource || window.WebKitMediaSource;
if (!!!window.MediaSource) {
  alert('MediaSource API is not available');
}

var
  video = document.getElementById('v'),
  duration,
  mediaSource = new MediaSource(),
  urls,
  checkStatus,
  choiceContainer = document.getElementById('choice-1'),
  choices = document.querySelectorAll('.choice'),
  firstChoiceSelected = false,
  firstSegmentAppended = false,
  lastSegmentAppended = false,
  sourceBuffer,
  segments = [
    {
      "file": "clips/setup.webm"
    },
    {
      "file": "clips/ending-silly.webm"
    },
    {
      "file": "clips/ending-crazy.webm"
    }
  ];

function presentChoice( event ) {
  if ( this.currentTime === firstSegmentDuration ) {
    
    choiceContainer.removeAttribute('hidden');
    choiceContainer.hidden = false;
    this.removeEventListener('timeupdate', presentChoice);
  }
  
  if ( this.currentTime === lastSegmentDuration ) {
    mediaSource.endOfStream();
  }

  for (var i = segments.length - 1; i >= 0; i--) {
    segments[i].duration;
  };
}

function choiceClicked( event ) {
  event.preventDefault();

  if ( !firstChoiceSelected ) {
    var link = event.target;

    choiceContainer.setAttribute('hidden', 'hidden');
    choiceContainer.hidden = true;
    firstChoiceSelected = true;
    lastSegmentAppended = true;

    urls.push( link.href );
    get_and_play();
  }
}

function get_and_play() {
  // Make sure the previous append is not still pending.
  if ( mediaSource.sourceBuffers[0].updating ) {
    console.log('still appending');
    return false;
  }

  if (mediaSource.readyState !== "open") {
    return false;
  }

  if ( mediaSource.sourceBuffers[0].mode == "PARSING_MEDIA_SEGMENT" ) {
    return false;
  }

  if (urls.length === 0) {
    //mediaSource.endOfStream();
    return false;
  }

  console.log(urls);

  var buffer = 0;

  GET(urls[0], function(uInt8Array) {
    var
      file = new Blob( [uInt8Array], {type: 'video/webm'} ),
      reader = new FileReader();

    // Reads aren't guaranteed to finish in the same order they're started in,
    // so we need to read + append the next chunk after the previous reader
    // is done (onload is fired).
    reader.onload = function ( e ) {
      var mediaSegment = new Uint8Array( e.target.result );

      duration = mediaSource.duration || 0;

      console.log('Duration: ' + duration);

      sourceBuffer.timestampOffset = duration;
      //mediaSource.sourceBuffers[0].appendBuffer(mediaSegment);

      sourceBuffer.appendBuffer( mediaSegment );

      if ( !firstSegmentAppended ) {
        video.addEventListener('timeupdate', presentChoice);

        firstSegmentAppended = true;
      }

      if ( video.paused ) {
        video.play(); // Start playing after 1st chunk is appended.
      }
      
      urls = urls.slice( 1 );

      if ( urls.length > 0 ) {
        clearInterval( checkStatus );

        checkStatus = setInterval(function () {
          var appended = get_and_play();

          if ( appended ) {
            clearInterval( checkStatus );
          }
        }, 1000);
      }
    };

    reader.readAsArrayBuffer( file );
  });

  return true;
}

video.src = window.URL.createObjectURL( mediaSource );
video.pause();

for (var i = 0; i < choices.length; ++i) {
  choices[i].addEventListener('click', choiceClicked);
}

mediaSource.addEventListener('sourceopen', function mediaSourceOnSourceOpen( e ) {

  //var sourceBuffer = mediaSource.addSourceBuffer('video/webm; codecs="vorbis,vp8"');
  sourceBuffer = mediaSource.addSourceBuffer('video/webm; codecs="vorbis,vp8"');

  console.log( 'mediaSource readyState: ' + this.readyState );

  load_playlist('clips/fog-playlist-setup.m3u', function ( playlist_urls ) {
    urls = playlist_urls;
    get_and_play();
  });
  // var

  // video.addEventListener('progress', function(e) {
  // });
}, false);

mediaSource.addEventListener('sourceended', function( event ) {
  console.log('mediaSource readyState: ' + this.readyState);
}, false);

function load_playlist( url, callback ) {
  var xhr = new XMLHttpRequest();
  xhr.addEventListener('load', function(e) {

    if ( xhr.status !== 200 ) {
      alert("Unexpected status code " + xhr.status + " for " + url);
      return false;
    }

    var
      regex = /^[^#].*$/mg,
      urls = [],
      result;

    while ((result = regex.exec(xhr.response))) {
      urls.push(result[0]);
    }

    console.log('Playlist loaded');
    callback(urls);
  });

  xhr.addEventListener('error', function() {
    console.log('Playlist load error');
  });

  xhr.open("GET", url);
  xhr.send();
}

function GET(url, callback) {
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