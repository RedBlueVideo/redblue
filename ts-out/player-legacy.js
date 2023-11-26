'use strict';
const _RedBlueLegacyPlayer = (RedBlueVideo) => {
    return class RedBlueLegacyPlayer extends RedBlueVideo {
        constructor() {
            super();
            this.Legacy = {
                init: () => {
                    for (let index = 0; index < this.mediaQueue.length; index++) {
                        const mediaQueueItem = this.mediaQueue[index];
                        if (this.$.localMedia.canPlayType(mediaQueueItem.mime)) {
                            this.$.localMedia.src = mediaQueueItem.path;
                            break;
                        }
                    }
                },
            };
        }
        connectedCallback() {
            super.connectedCallback();
            this.Legacy.init();
        }
        get hasLegacyPlayer() {
            return true;
        }
        fetchMedia(mediaQueueObject) {
            if (/^video\/.*/i.test(mediaQueueObject.mime)) {
                if (this.$.localMedia.canPlayType(mediaQueueObject.mime)) {
                    this.$.localMedia.src = mediaQueueObject.path;
                    this.$.localMedia.addEventListener('canplay', () => {
                        this.$.localMedia.play()
                            .then(() => console.log('Played!'))
                            .catch((error) => console.error(error.message));
                    });
                }
            }
        }
    };
};
export default _RedBlueLegacyPlayer;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGxheWVyLWxlZ2FjeS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9wbGF5ZXItbGVnYWN5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFlBQVksQ0FBQztBQWNiLE1BQU0sb0JBQW9CLEdBQUcsQ0FBRSxZQUFzQyxFQUFHLEVBQUU7SUFDeEUsT0FBTyxNQUFNLG1CQUFvQixTQUFRLFlBQVk7UUFLbkQ7WUFDRSxLQUFLLEVBQUUsQ0FBQztZQUVSLElBQUksQ0FBQyxNQUFNLEdBQUc7Z0JBQ1osSUFBSSxFQUFFLEdBQUcsRUFBRTtvQkFDVCxLQUFNLElBQUksS0FBSyxHQUFHLENBQUMsRUFBRSxLQUFLLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxNQUFNLEVBQUUsS0FBSyxFQUFFLEVBQUcsQ0FBQzt3QkFDOUQsTUFBTSxjQUFjLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsQ0FBQzt3QkFFOUMsSUFBSyxJQUFJLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxXQUFXLENBQUUsY0FBYyxDQUFDLElBQUksQ0FBRSxFQUFHLENBQUM7NEJBQzNELElBQUksQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLEdBQUcsR0FBRyxjQUFjLENBQUMsSUFBSSxDQUFDOzRCQUM1QyxNQUFNO3dCQUNSLENBQUM7b0JBQ0gsQ0FBQztnQkFDSCxDQUFDO2FBQ0YsQ0FBQztRQUNKLENBQUM7UUFFRCxpQkFBaUI7WUFDZixLQUFLLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztZQUUxQixJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxDQUFDO1FBQ3JCLENBQUM7UUFFRCxJQUFJLGVBQWU7WUFDakIsT0FBTyxJQUFJLENBQUM7UUFDZCxDQUFDO1FBRUQsVUFBVSxDQUFFLGdCQUFrQztZQU01QyxJQUFLLGFBQWEsQ0FBQyxJQUFJLENBQUUsZ0JBQWdCLENBQUMsSUFBSSxDQUFFLEVBQUcsQ0FBQztnQkFDbEQsSUFBSyxJQUFJLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxXQUFXLENBQUUsZ0JBQWdCLENBQUMsSUFBSSxDQUFFLEVBQUcsQ0FBQztvQkFDN0QsSUFBSSxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsR0FBRyxHQUFHLGdCQUFnQixDQUFDLElBQUksQ0FBQztvQkFDOUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsZ0JBQWdCLENBQUUsU0FBUyxFQUFFLEdBQUcsRUFBRTt3QkFDbEQsSUFBSSxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsSUFBSSxFQUFFOzZCQUNyQixJQUFJLENBQUUsR0FBRyxFQUFFLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBRSxTQUFTLENBQUUsQ0FBRTs2QkFDdEMsS0FBSyxDQUFFLENBQUUsS0FBSyxFQUFHLEVBQUUsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFFLEtBQUssQ0FBQyxPQUFPLENBQUUsQ0FBRSxDQUN0RDtvQkFDSCxDQUFDLENBQUUsQ0FBQztnQkFDTixDQUFDO1lBQ0gsQ0FBQztRQUNILENBQUM7S0FDRixDQUFDO0FBQ0osQ0FBQyxDQUFDO0FBRUYsZUFBZSxvQkFBb0IsQ0FBQyJ9