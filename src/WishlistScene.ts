import Phaser from "phaser";
import { pickWishlist } from "./items";
import { ItemImage } from "./ItemImage";
import { TEXT_STYLE } from "./consts";

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

    const size = 128;
    const gap = 32;
    const startX = width / 2 - ((wishlist.length - 1) * (size + gap)) / 2;
    wishlist.forEach((item, i) => {
      new ItemImage(this, startX + i * (size + gap), 280, item, size);
    });

    this.input.keyboard?.on(`keydown-X`, () => this.startGame());

    this.add
      .text(1000 / 2, 500, "Go to auction [X]", {
        ...TEXT_STYLE,
        fontSize: "32px",
      })
      .setOrigin(0.5)
      .setInteractive()
      .on("pointerdown", () => this.startGame());
  }
}
