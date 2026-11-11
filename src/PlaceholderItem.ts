import Phaser from "phaser";
import type { Item } from "./items";

/** Stand-in for item art: a square in the collection's color with the item's letter. */
export class PlaceholderItem extends Phaser.GameObjects.Container {
  private square: Phaser.GameObjects.Rectangle;
  private letter: Phaser.GameObjects.Text;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    item: Item,
    size = 64,
  ) {
    super(scene, x, y);
    this.square = new Phaser.GameObjects.Rectangle(
      scene,
      0,
      0,
      size,
      size,
      item.collection.color,
    );
    this.square.setStrokeStyle(Math.max(2, size / 16), 0xffffff);
    this.letter = new Phaser.GameObjects.Text(scene, 0, 0, item.letter, {
      fontSize: `${Math.round(size * 0.6)}px`,
      fontStyle: "bold",
      color: "#ffffff",
      stroke: "#000000",
      strokeThickness: Math.max(3, size / 16),
    }).setOrigin(0.5);
    this.add([this.square, this.letter]);
    this.setSize(size, size);
    scene.add.existing(this);
  }

  setItem(item: Item): this {
    this.square.setFillStyle(item.collection.color);
    this.letter.setText(item.letter);
    return this;
  }
}
