import Phaser from "phaser";
import type { Item } from "./items";

/** An item's picture, scaled to fit in a `size` x `size` box. */
export class ItemImage extends Phaser.GameObjects.Image {
  private boxSize: number;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    item: Item,
    size = 115,
  ) {
    super(scene, x, y, item.texture);
    this.boxSize = size;
    this.fit();
    scene.add.existing(this);
  }

  setItem(item: Item): this {
    this.setTexture(item.texture);
    this.fit();
    return this;
  }

  /** The scale at which the picture fits its box (the resting scale for animations). */
  get fitScale() {
    return this.boxSize / Math.max(this.width, this.height);
  }

  private fit() {
    this.setScale(this.fitScale);
  }
}
