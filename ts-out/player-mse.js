'use strict';
const MSEPlayer = (RedBlueVideo) => {
    return class RedBlueMSEPlayer extends RedBlueVideo {
        constructor() {
            super();
            if (RedBlueVideo.MSEsupported()) {
                this.MSE = {
                    mediaSource: new window.MediaSource(),
                    endOfStream: false,
                    onSourceOpen: () => {
                        this.log('onSourceOpen');
                        this.MSE.sourceBuffer = this.MSE.mediaSource.addSourceBuffer(this.mediaQueue[0].mime);
                    },
                    onSourceEnded: (event) => {
                        console.log('onSourceEnded');
                        this.MSE.mediaSource = event.target;
                        console.log('mediaSource readyState: ' + this.MSE.mediaSource.readyState);
                    },
                    isReady: () => {
                        console.log('this.MSE.mediaSource.sourceBuffers.length', this.MSE.mediaSource.sourceBuffers.length);
                        if (!this.MSE.mediaSource.sourceBuffers[0]) {
                            console.log('NOT READY: !mediaSource.sourceBuffers[0]');
                            return false;
                        }
                        if (this.MSE.mediaSource.sourceBuffers[0].updating) {
                            console.log('NOT READY: mediaSource.sourceBuffers[0].updating');
                            return false;
                        }
                        if (this.MSE.mediaSource.readyState !== "open") {
                            console.log('NOT READY: mediaSource.readyState !== "open"', this.MSE.mediaSource.readyState);
                            return false;
                        }
                        if (this.mediaQueue.length === 0) {
                            console.log('NOT READY: RedBlue.mediaQueue.length === 0');
                            return false;
                        }
                        console.log('READY');
                        return true;
                    },
                    registerEvents: () => {
                        this.MSE.mediaSource.addEventListener('sourceopen', this.MSE.onSourceOpen, false);
                        this.MSE.mediaSource.addEventListener('sourceended', this.MSE.onSourceEnded, false);
                    },
                    apply: () => {
                        this.$.localMedia.src = window.URL.createObjectURL(this.MSE.mediaSource);
                    },
                    init: () => {
                        this.MSE.mediaSource = new window.MediaSource();
                        this.MSE.registerEvents();
                        this.MSE.apply();
                    },
                };
                this.MSE.registerEvents();
            }
        }
        connectedCallback() {
            super.connectedCallback();
            this.MSE?.apply();
        }
        get hasMSEPlayer() {
            return true;
        }
        fetchMedia(mediaQueueObject) {
            const xhr = fetch(mediaQueueObject.path, {
                method: "GET",
                cache: "force-cache",
            });
            if (/^video\/.*/i.test(mediaQueueObject.mime)) {
                xhr
                    .then(response => response.arrayBuffer())
                    .then((arrayBuffer) => {
                    this.log('MSE Player fetched as arrayBuffer:', arrayBuffer);
                    let appendBufferWhenReady;
                    const appendBufferWhenReadyTimeout = setTimeout(() => {
                        clearInterval(appendBufferWhenReady);
                        console.error('appendBufferWhenReady timed out');
                    }, 10000);
                    appendBufferWhenReady = window.setInterval(() => {
                        if (this.MSE?.isReady()) {
                            this.MSE.sourceBuffer.timestampOffset = (this.MSE.mediaSource.duration || 0);
                            this.MSE.sourceBuffer.appendBuffer(new Uint8Array(arrayBuffer));
                            this.$.localMedia.play()
                                .then(() => console.log('Played!'))
                                .catch(error => console.error(error.message));
                            clearInterval(appendBufferWhenReady);
                            clearTimeout(appendBufferWhenReadyTimeout);
                            this.mediaQueue = this.mediaQueue.slice(1);
                            console.log('this.mediaQueue', this.mediaQueue);
                        }
                    }, 1000);
                });
            }
            xhr.catch((error) => {
                console.error(error);
            });
        }
    };
};
export default MSEPlayer;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGxheWVyLW1zZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9wbGF5ZXItbXNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFlBQVksQ0FBQztBQWlCYixNQUFNLFNBQVMsR0FBRyxDQUFFLFlBQXNDLEVBQUcsRUFBRTtJQUM3RCxPQUFPLE1BQU0sZ0JBQWlCLFNBQVEsWUFBWTtRQUdoRDtZQUNFLEtBQUssRUFBRSxDQUFDO1lBR1IsSUFBSyxZQUFZLENBQUMsWUFBWSxFQUFFLEVBQUcsQ0FBQztnQkFDbEMsSUFBSSxDQUFDLEdBQUcsR0FBRztvQkFDVCxXQUFXLEVBQUUsSUFBSSxNQUFNLENBQUMsV0FBVyxFQUFFO29CQUVyQyxXQUFXLEVBQUUsS0FBSztvQkFFbEIsWUFBWSxFQUFFLEdBQUcsRUFBRTt3QkFDakIsSUFBSSxDQUFDLEdBQUcsQ0FBRSxjQUFjLENBQUUsQ0FBQzt3QkFFM0IsSUFBSSxDQUFDLEdBQUksQ0FBQyxZQUFZLEdBQUcsSUFBSSxDQUFDLEdBQUksQ0FBQyxXQUFXLENBQUMsZUFBZSxDQUk1RCxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FDeEIsQ0FBQztvQkFFSixDQUFDO29CQUVELGFBQWEsRUFBRSxDQUFFLEtBQUssRUFBRyxFQUFFO3dCQUN6QixPQUFPLENBQUMsR0FBRyxDQUFFLGVBQWUsQ0FBRSxDQUFDO3dCQUUvQixJQUFJLENBQUMsR0FBSSxDQUFDLFdBQVcsR0FBRyxLQUFLLENBQUMsTUFBcUIsQ0FBQzt3QkFFcEQsT0FBTyxDQUFDLEdBQUcsQ0FBRSwwQkFBMEIsR0FBRyxJQUFJLENBQUMsR0FBSSxDQUFDLFdBQVcsQ0FBQyxVQUFVLENBQUUsQ0FBQztvQkFDL0UsQ0FBQztvQkFFRCxPQUFPLEVBQUUsR0FBRyxFQUFFO3dCQUlaLE9BQU8sQ0FBQyxHQUFHLENBQUUsMkNBQTJDLEVBQUUsSUFBSSxDQUFDLEdBQUksQ0FBQyxXQUFXLENBQUMsYUFBYSxDQUFD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