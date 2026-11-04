import Phaser from 'phaser';

export class ResultsScene extends Phaser.Scene {
  constructor() {
    super('results');
  }

  create() {
    this.add
      .text(400, 500, 'Back to wishlist', { fontSize: '32px', color: '#ffffff' })
      .setOrigin(0.5)
      .setInteractive()
      .on('pointerdown', () => this.scene.start('wishlist'));
  }
}
