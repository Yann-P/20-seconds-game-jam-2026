import Phaser from "phaser";
import type { Item } from "./items";
import { ItemImage } from "./ItemImage";
import { TEXT_STYLE } from "./consts";
import { Button } from "./Button";

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
      new ItemImage(this, x, 200, item, size);
      this.add
        .text(x, 290, got ? "yes" : "no", {
          ...TEXT_STYLE,
          fontSize: "28px",
        })
        .setOrigin(0.5);
    });

    this.add
      .text(width / 2, 380, `${bought} objects / ${wishlist.length}`, {
        ...TEXT_STYLE,
        fontSize: "32px",
      })
      .setOrigin(0.5);

    new Button(this, 500, 500, "Back to wishlist [X]", () => this.replay(), {
      key: "X",
      width: 300,
      fireOn: "up",
    });
  }

  private replay() {
    this.scene.start("wishlist");
  }
}
