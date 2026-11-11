import Phaser from "phaser";
import { pickWishlist } from "./items";
import { PlaceholderItem } from "./PlaceholderItem";

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
      .text(width / 2, 120, "Shopping list", {
        fontSize: "40px",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    const size = 96;
    const gap = 32;
    const startX = width / 2 - ((wishlist.length - 1) * (size + gap)) / 2;
    wishlist.forEach((item, i) => {
      new PlaceholderItem(this, startX + i * (size + gap), 280, item, size);
    });

    this.input.keyboard?.on(`keydown-X`, () => this.startGame());

    this.add
      .text(400, 500, "Go to auction [X]", {
        fontSize: "32px",
        color: "#ffffff",
      })
      .setOrigin(0.5)
      .setInteractive()
      .on("pointerdown", () => this.startGame());
  }
}
