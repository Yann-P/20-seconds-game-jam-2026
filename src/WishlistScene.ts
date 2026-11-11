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
    this.scene.start("auction");
  }

  create() {
    const { width } = this.scale;
    const wishlist = pickWishlist();
    this.registry.set("wishlist", wishlist);

    this.add
      .text(width / 2, 120, "Buy this at auction!", {
        ...TEXT_STYLE,
        fontSize: "40px",
      })
      .setOrigin(0.5);

    const size = 150;
    const gap = 32;
    const startX = width / 2 - ((wishlist.length - 1) * (size + gap)) / 2;
    wishlist.forEach((item, i) => {
      const image = new ItemImage(
        this,
        startX + i * (size + gap),
        280,
        item,
        size,
      );

      this.tweens.add({
        targets: [image],
        y: image.y + 20,
        angle: [-2, 2],
        duration: 2000 + i * 1000,
        yoyo: true,
        repeat: -1,
      });
    });

    new Button(this, 1000 / 2, 500, "Go to auction [X]", () => this.startGame(), {
      key: "X",
      width: 280,
      fireOn: "up",
    });
  }
}
