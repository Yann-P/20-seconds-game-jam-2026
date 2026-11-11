import Phaser from "phaser";
import { ITEMS } from "./items";

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
    this.load.font("whitrabt", "whitrabt.ttf", "truetype");

    this.load.image("character_torso", "character_torso.png");
    this.load.image("character_head", "character_head.png");
    this.load.image("character_arm_L", "character_arm_L.png");
    this.load.image("character_arm_R", "character_arm_R.png");
    this.load.image("character_forearm_L", "character_forearm_L.png");
    this.load.image("character_forearm_R", "character_forearm_R.png");
    this.load.image("spectator", "spectator.png");
    this.load.image("yes", "yes.png");
    this.load.image("no", "no.png");
    this.load.image("star", "star.png");
    this.load.image("pupitre", "pupitre.png");
    this.load.image("table2", "table2.png");
    for (const item of ITEMS) {
      this.load.image(item.texture, `${item.texture}.png`);
    }
  }

  create() {
    this.scene.start("wishlist");
    // this.scene.start('auction');
  }
}
