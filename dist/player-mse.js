'use strict';
const RedBlueMSEPlayer = (RedBlueVideo) => {
    return class RedBlueMSEPlayer extends RedBlueVideo {
        constructor() {
            super();
            if (RedBlueVideo.MSEsupported()) {
                this.MSE = {
                    "mediaSource": new window.MediaSource(),
                    "endOfStream": false,
                    "onSourceOpen": () => {
                        this.log('onSourceOpen');
                        this.MSE.sourceBuffer = this.MSE.mediaSource.addSourceBuffer(this.mediaQueue[0].mime);
                    },
                    "onSourceEnded": (event) => {
                        console.log('onSourceEnded');
                        this.MSE.mediaSource = event.target;
                        console.log('mediaSource readyState: ' + this.MSE.mediaSource.readyState);
                    },
                    "isReady": () => {
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
                    "registerEvents": () => {
                        this.MSE.mediaSource.addEventListener('sourceopen', this.MSE.onSourceOpen, false);
                        this.MSE.mediaSource.addEventListener('sourceended', this.MSE.onSourceEnded, false);
                    },
                    "apply": () => {
                        this.$.localMedia.src = window.URL.createObjectURL(this.MSE.mediaSource);
                    },
                    "init": () => {
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
            this.MSE.apply();
        }
        get hasMSEPlayer() {
            return true;
        }
        fetchMedia(mediaQueueObject) {
            const xhr = fetch(mediaQueueObject.path, {
                "method": "GET",
                "cache": "force-cache",
            });
            if (/^video\/.*/i.test(mediaQueueObject.mime)) {
                xhr
                    .then(response => response.arrayBuffer())
                    .then((arrayBuffer) => {
                    this.log('MSE Player fetched as arrayBuffer:', arrayBuffer);
                    const appendBufferWhenReadyTimeout = setTimeout(() => {
                        clearInterval(appendBufferWhenReady);
                        console.error('appendBufferWhenReady timed out');
                    }, 10000);
                    const appendBufferWhenReady = setInterval(() => {
                        if (this.MSE.isReady()) {
                            this.MSE.sourceBuffer.timestampOffset = (this.MSE.mediaSource.duration || 0);
                            this.MSE.sourceBuffer.appendBuffer(new Uint8Array(arrayBuffer));
                            this.$.localMedia.play()
                                .then(_ => console.log('Played!'))
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
export default RedBlueMSEPlayer;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGxheWVyLW1zZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9wbGF5ZXItbXNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFlBQVksQ0FBQztBQWlCYixNQUFNLGdCQUFnQixHQUFHLENBQUUsWUFBc0MsRUFBRyxFQUFFO0lBQ3BFLE9BQU8sTUFBTSxnQkFBaUIsU0FBUSxZQUFZO1FBR2hEO1lBQ0UsS0FBSyxFQUFFLENBQUM7WUFHUixJQUFLLFlBQVksQ0FBQyxZQUFZLEVBQUUsRUFBRyxDQUFDO2dCQUNsQyxJQUFJLENBQUMsR0FBRyxHQUFHO29CQUNULGFBQWEsRUFBRSxJQUFJLE1BQU0sQ0FBQyxXQUFXLEVBQUU7b0JBRXZDLGFBQWEsRUFBRSxLQUFLO29CQUVwQixjQUFjLEVBQUUsR0FBRyxFQUFFO3dCQUNuQixJQUFJLENBQUMsR0FBRyxDQUFFLGNBQWMsQ0FBRSxDQUFDO3dCQUUzQixJQUFJLENBQUMsR0FBRyxDQUFDLFlBQVksR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLFdBQVcsQ0FBQyxlQUFlLENBSTFELElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUN4QixDQUFDO29CQUVKLENBQUM7b0JBRUQsZUFBZSxFQUFFLENBQUUsS0FBSyxFQUFHLEVBQUU7d0JBQzNCLE9BQU8sQ0FBQyxHQUFHLENBQUUsZUFBZSxDQUFFLENBQUM7d0JBRS9CLElBQUksQ0FBQyxHQUFHLENBQUMsV0FBVyxHQUFHLEtBQUssQ0FBQyxNQUFxQixDQUFDO3dCQUVuRCxPQUFPLENBQUMsR0FBRyxDQUFDLDBCQUEwQixHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsV0FBVyxDQUFDLFVBQVUsQ0FBQyxDQUFDO29CQUM1RSxDQUFDO29CQUVELFNBQVMsRUFBRSxHQUFHLEVBQUU7d0JBSWQsT0FBTyxDQUFDLEdBQUcsQ0FBRSwyQ0FBMkMsRUFBRSxJQUFJLENBQUMsR0FBRyxDQUFDLFdBQVcsQ0FBQyxhQUFhLENB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