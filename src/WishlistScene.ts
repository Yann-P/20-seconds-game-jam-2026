import Phaser from "phaser";
import { pickWishlist } from "./items";
import { ItemImage } from "./ItemImage";
import { Button } from "./Button";
import { findNpc } from "./npcs";
import { addOrderSheet, addOrderSheetSectionLabel } from "./OrderSheet";

export class WishlistScene extends Phaser.Scene {
  constructor() {
    super("wishlist");
  }

  private startGame() {
    this.requestFullscreenOnMobile();
    this.scene.start("auction");
  }

  private requestFullscreenOnMobile() {
    if (this.sys.game.device.os.desktop) return;
    if (!this.scale.fullscreen.available || this.scale.isFullscreen) return;
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

    addOrderSheet(
      this,
      findNpc(this, this.registry.get("npcid")),
      "REQUEST:\nBuy these 3 items for me at the auction\nBUDGET:\n$1000",
    );
    addOrderSheetSectionLabel(this, 430, "Order details:");

    const size = 230;
    const gap = 120;
    const startX = width / 2 - ((wishlist.length - 1) * (size + gap)) / 2;
    wishlist.forEach((item, i) => {
      const image = new ItemImage(
        this,
        startX + i * (size + gap),
        600,
        item,
        size,
      );

      this.tweens.add({
        targets: [image],
        y: image.y + 30,
        angle: [-2, 2],
        duration: 2000 + i * 1000,
        yoyo: true,
        repeat: -1,
      });
    });

    new Button(
      this,
      this.scale.width / 2,
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
