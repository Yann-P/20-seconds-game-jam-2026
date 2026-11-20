import Phaser from "phaser";
import { pickWishlist } from "./items";
import { ItemImage } from "./ItemImage";
import { TEXT_STYLE } from "./consts";
import { Button } from "./Button";

export class WishlistScene extends Phaser.Scene {
  constructor() {
    super("wishlist");
  }

  private startGame() {
    this.requestFullscreenOnMobile();
    this.scene.start("auction");
  }

  /** Must run from a user gesture (the start button). Not supported on iPhone Safari. */
  private requestFullscreenOnMobile() {
    if (this.sys.game.device.os.desktop) return;
    if (!this.scale.fullscreen.available || this.scale.isFullscreen) return;
    // The game is landscape: once fullscreen, rotate with it where the browser allows (Android).
    this.scale.once(Phaser.Scale.Events.ENTER_FULLSCREEN, () => {
      const orientation = screen.orientation as ScreenOrientation & {
        lock?: (orientation: string) => Promise<void>;
      };
      orientation.lock?.("landscape").catch(() => {});
    });
    this.scale.startFullscreen();
  }

  create() {
    const { width } = this.scale;
    const wishlist = pickWishlist();
    this.registry.set("wishlist", wishlist);
    this.registry.set("npcid", Phaser.Math.Between(1, 9));

    const ui = this.add.image(
      this.scale.width / 2,
      this.scale.height / 2,
      "UI_start2",
    );
    ui.setScale(1.9);

    const npc = this.add.image(500, 300, "NPC_" + this.registry.get("npcid"));
    npc.setScale(0.8);

    this.add
      .text(npc.x + 160, npc.y, "Buy this for me!", {
        ...TEXT_STYLE,
        fontSize: "90px",
      })
      .setOrigin(0, 0.5);

    const size = 270;
    const gap = 58;
    const startX = width / 2 - ((wishlist.length - 1) * (size + gap)) / 2;
    wishlist.forEach((item, i) => {
      const image = new ItemImage(
        this,
        startX + i * (size + gap),
        570,
        item,
        size,
      );

      this.tweens.add({
        targets: [image],
        y: image.y + 36,
        angle: [-2, 2],
        duration: 2000 + i * 1000,
        yoyo: true,
        repeat: -1,
      });
    });

    new Button(
      this,
      1920 - 530,
      1080 - 230,
      "OK",
      "press x",
      "green",
      () => this.startGame(),
      {
        key: "X",
        //width: 504,
        fireOn: "up",
      },
    );
  }
}
