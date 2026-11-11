import Phaser from "phaser";
import type { Item } from "./items";
import { PlaceholderItem } from "./PlaceholderItem";

export class ResultsScene extends Phaser.Scene {
  constructor() {
    super("results");
  }

  create() {
    const { width } = this.scale;
    const wishlist: Item[] = this.registry.get("wishlist") ?? [];
    const purchased: Item[] = this.registry.get("purchased") ?? [];

    const size = 96;
    const gap = 32;
    const startX = width / 2 - ((wishlist.length - 1) * (size + gap)) / 2;
    let bought = 0;
    wishlist.forEach((item, i) => {
      const x = startX + i * (size + gap);
      const got = purchased.includes(item);
      if (got) bought++;
      new PlaceholderItem(this, x, 200, item, size);
      this.add
        .text(x, 290, got ? "yes" : "no", {
          fontSize: "28px",
          color: "#ffffff",
        })
        .setOrigin(0.5);
    });

    this.add
      .text(width / 2, 380, `${bought} objects / ${wishlist.length}`, {
        fontSize: "32px",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    this.add
      .text(400, 500, "Back to wishlist", {
        fontSize: "32px",
        color: "#ffffff",
      })
      .setOrigin(0.5)
      .setInteractive()
      .on("pointerdown", () => this.scene.start("wishlist"));
  }
}
