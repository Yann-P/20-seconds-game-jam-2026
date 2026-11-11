import Phaser from "phaser";

/**
 * Animations the scene can trigger with `auctioner.play(name)`.
 * To add one: add its name here and its implementation in `animations` below.
 */
export type AuctionerAnimation = "present" | "sold";

/** The auctioner: a container of body parts, positioned relative to the container. */
export class Auctioner extends Phaser.GameObjects.Container {
  private torso!: Phaser.GameObjects.Image;
  private head!: Phaser.GameObjects.Image;

  private armL!: Phaser.GameObjects.Image;
  private forearmL!: Phaser.GameObjects.Image;

  private armLContainer!: Phaser.GameObjects.Container;
  private forearmLContainer!: Phaser.GameObjects.Container;

  private torsoContainer!: Phaser.GameObjects.Container;

  private armR!: Phaser.GameObjects.Image;
  private armRContainer!: Phaser.GameObjects.Container;

  private forearmR!: Phaser.GameObjects.Image;
  private forearmRContainer!: Phaser.GameObjects.Container;

  // Placeholder animations: replace with the real ones.
  private animations: Record<AuctionerAnimation, () => void> = {
    present: () => this.presentObject(),
    sold: () => this.coupDeMarteau(),
  };

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);

    this.torso = this.part(0, 0, "character_torso").setOrigin(0.5, 0.8);

    this.armR = this.part(0, 0, "character_arm_R").setOrigin(0.5, -0.1);
    this.forearmR = this.part(0, 0, "character_forearm_R").setOrigin(0.1, 0.5);
    this.forearmRContainer = this.scene.add.container(
      0,
      this.armR.height + 40,
      [this.forearmR],
    );

    this.armRContainer = this.scene.add.container(-160, -250, [
      this.armR,
      this.forearmRContainer,
    ]);

    this.forearmRContainer.setAngle(-30);

    this.armL = this.part(0, 0, "character_arm_L").setOrigin(0.5, 0.1);
    this.forearmL = this.part(0, 0, "character_forearm_L").setOrigin(0.1, 1);
    this.forearmLContainer = this.scene.add.container(50, 240, [this.forearmL]); // elbow = end of upper sprite
    this.armLContainer = this.scene.add.container(210, -240, [
      this.armL,
      this.forearmLContainer,
    ]);

    this.armLContainer.sendToBack(this.forearmLContainer);

    this.head = this.part(-10, -420, "character_head");
    //head.setZ(0);

    this.torsoContainer = this.scene.add.container(200, 200, [
      this.torso,
      this.head,
      this.armRContainer,
      this.armLContainer,
    ]);

    this.torsoContainer.sendToBack(this.head);
    this.torsoContainer.sendToBack(this.armLContainer);
    this.torsoContainer.setScale(0.72);
    this.torsoContainer.setX(x).setY(y);

    this.scene.tweens.add({
      targets: [this.torsoContainer],
      angle: [0, 3],
      duration: 3000,
      repeat: -1,
      yoyo: true,
    });

    this.scene.tweens.add({
      targets: [this.head],
      angle: [-10, 5],
      duration: 10000,
      repeat: -1,
      yoyo: true,
    });

    // this.scene.tweens.add({
    //   targets: [this.armLContainer],
    //   angle: -30,
    //   duration: 5000,
    //   repeat: -1,
    //   yoyo: true,
    // });

    // this.scene.tweens.add({
    //   targets: [this.forearmLContainer],
    //   angle: [-10, 10],
    //   duration: 2000,
    //   repeat: -1,
    //   yoyo: true,
    // });

    scene.add.existing(this);
  }

  private presentObject() {
    this.scene.tweens.killTweensOf(this.armLContainer);
    this.scene.tweens.killTweensOf(this.forearmLContainer);

    const delay = 200;

    // pointe du bras
    this.scene.tweens.add({
      targets: [this.armLContainer],
      angle: -10,
      duration: delay,
    });

    this.scene.tweens.add({
      targets: [this.forearmLContainer],
      angle: 30,
      duration: delay,
    });

    // remonte le bras
    this.scene.tweens.add({
      targets: [this.armLContainer],
      angle: 0,
      duration: 400,
      ease: "Quad.easeOut",
      delay: delay + 300,
    });

    this.scene.tweens.add({
      targets: [this.forearmLContainer],
      angle: 0,
      duration: 400,
      ease: "Quad.easeOut",
      delay: delay + 270,
    });
  }

  play(animation: AuctionerAnimation) {
    this.animations[animation]();
  }

  private part(x: number, y: number, texture: string) {
    const image = new Phaser.GameObjects.Image(this.scene, x, y, texture);
    this.add(image);
    return image;
  }

  private coupDeMarteau() {
    this.scene.tweens.killTweensOf(this.armRContainer);
    this.scene.tweens.killTweensOf(this.forearmRContainer);
    this.scene.tweens.killTweensOf(this.torsoContainer);

    const delay = 70;

    this.scene.time.delayedCall(100, () =>
      this.scene.cameras.main.shake(200, 0.01),
    );

    // marteau qui tombe
    this.scene.tweens.add({
      targets: [this.armRContainer],
      angle: 10,
      duration: delay,
    });

    this.scene.tweens.add({
      targets: [this.forearmRContainer],
      angle: -10,
      duration: delay,
    });

    this.scene.tweens.add({
      targets: [this.torsoContainer],
      y: this.torsoContainer.y + 9,
      duration: 70,
      yoyo: true,
    });

    this.scene.tweens.add({
      targets: [this.head],
      angle: 5,
      duration: 70,
      yoyo: true,
    });

    // marteau qui remonte

    this.scene.tweens.add({
      targets: [this.armRContainer],
      angle: 0,
      duration: 300,
      delay: delay + 200,
    });

    this.scene.tweens.add({
      targets: [this.forearmRContainer],
      angle: -30,
      duration: 300,
      delay: delay + 200,
    });

    // this.scene.tweens.killTweensOf(target);
    // target.setAngle(0);
    // this.scene.tweens.add({
    //   targets: target,
    //   angle,
    //   duration,
    //   ease: "Quad.easeOut",
    //   yoyo: true,
    // });
  }
}
