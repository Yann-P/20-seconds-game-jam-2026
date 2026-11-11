import Phaser from "phaser";

export class LoadingScene extends Phaser.Scene {
  constructor() {
    super("loading");
  }

  preload() {
    const { width, height } = this.scale;
    const bar = this.add.rectangle(width / 2, height / 2, 0, 30, 0xffffff);
    this.load.on("progress", (value: number) => {
      bar.width = width * 0.6 * value;
    });

    this.load.setPath("assets");
    this.load.image("auctioner", "auctioner.png");
    this.load.image("spectator", "spectator.png");
    this.load.image("yes", "yes.png");
    this.load.image("no", "no.png");
    this.load.image("table", "table.png");
  }

  create() {
    this.scene.start("wishlist");
    // this.scene.start('auction');
  }
}
