import Phaser from 'phaser';

export class WishlistScene extends Phaser.Scene {
  constructor() {
    super('wishlist');
  }

  create() {
    this.add
      .text(400, 500, 'Go to auction', { fontSize: '32px', color: '#ffffff' })
      .setOrigin(0.5)
      .setInteractive()
      .on('pointerdown', () => this.scene.start('auction'));
  }
}
