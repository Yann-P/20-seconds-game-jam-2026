import Phaser from 'phaser';

const DURATION = 20000;
const SPECTATOR_COUNT = 7;

export class AuctionScene extends Phaser.Scene {
  private timer!: Phaser.Time.TimerEvent;
  private bar!: Phaser.GameObjects.Rectangle;
  private label!: Phaser.GameObjects.Text;
  private spectators: Phaser.GameObjects.Image[] = [];
  private auctioner!: Phaser.GameObjects.Image;

  constructor() {
    super('auction');
  }

  create() {
    const { width, height } = this.scale;
    this.bar = this.add.rectangle(0, 0, width, 30, 0xffffff).setOrigin(0, 0);
    this.label = this.add.text(8, 15, '', { fontSize: '20px', color: '#000000' }).setOrigin(0, 0.5);
    this.timer = this.time.delayedCall(DURATION, () => this.scene.start('results'));

    


    this.auctioner = this.add.image(170, 180, 'auctioner');
    this.auctioner.setScale(.2);

    this.tweens.add({
        targets: this.auctioner,
        angle: this.auctioner.angle - 5,
        duration: Phaser.Math.Between(1800, 5600),
        ease: 'Sine.easeInOut',
        yoyo: true,
        repeat: -1,
      });

    const table = this.add.image(200, 400, 'table');
    table.setScale(.35);

    const rect2 = new Phaser.Geom.Rectangle(0, height - 70 - 70, width, 70);
    const graphics2 = this.add.graphics({ fillStyle: { color: 0xffffff } });
    graphics2.fillRectShape(rect2);

    this.spectators = [];
    const spacing = width / (SPECTATOR_COUNT + 1);
    for (let i = 0; i < SPECTATOR_COUNT; i++) {
      const spectator = this.add
        .image(spacing * (i + 1), height, 'spectator')
        .setOrigin(0.5, 1)
        .setScale(0.15);
      spectator.y -= 50;
      this.tweens.add({
        targets: spectator,
        y: spectator.y - 12,
        duration: Phaser.Math.Between(800, 3600),
        ease: 'Sine.easeInOut',
        yoyo: true,
        repeat: -1,
        delay: Phaser.Math.Between(0, 1600),
      });
      this.spectators.push(spectator);
      
    }
    
    const rect = new Phaser.Geom.Rectangle(0, height - 70, width, 70);
    const graphics = this.add.graphics({ fillStyle: { color: 0xffffff } });
    graphics.fillRectShape(rect);

    this.add.image(width * 1 / 4, height - 30, "yes").setScale(.2)
    this.add.image(width * 3 / 4, height - 30, "no").setScale(.2)
  }

  update() {
    const remaining = this.timer.getRemaining();
    this.bar.width = this.scale.width * (remaining / DURATION);
    this.label.setText(Math.ceil(remaining / 1000).toString());
  }
}
