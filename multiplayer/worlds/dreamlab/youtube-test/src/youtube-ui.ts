import { Behavior, Click, Clickable, UIPanel } from "@dreamlab/engine";
import { element } from "@dreamlab/ui";

// important for `typeof YT` !!
import type {} from "npm:@types/youtube";

export default class YoutubeUIBehavior extends Behavior {
  onInitialize(): void {
    if (!this.game.isClient()) return;

    (async () => {
      // @ts-expect-error pulling poorly-typed vars out of global scope
      if (!(globalThis.YT && globalThis.YT.Player && globalThis.YT.loaded === 1)) {
        const youtubeScript = element("script", { src: "https://www.youtube.com/iframe_api" });
        document.body.append(youtubeScript);

        await new Promise<void>(resolve => {
          (globalThis as any).onYouTubeIframeAPIReady = () => {
            resolve();
          };
        });
      }

      const yt: typeof YT = (globalThis as any).YT;

      const video = element("div");
      this.entity.cast(UIPanel).element.append(video);

      const player = new yt.Player(video, { videoId: "dQw4w9WgXcQ" });
      player.addEventListener("onReady", () => {
        player.playVideo();
      });

      this.game.world._.SkipTo1Minute.cast(Clickable).on(Click, () => {
        player.seekTo(60, true);
        player.playVideo();
      });
    })();
  }
}
