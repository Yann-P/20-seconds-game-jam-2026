import Phaser from "phaser";
import { TEXT_STYLE } from "./consts";

// Vertical centre of the button's top face, in texture pixels above the image's bottom edge.
const FACE_CENTER_UP = 98;
const FACE_CENTER_DOWN = 72;

export interface ButtonOptions {
  /** Keyboard key that also presses the button (e.g. "Y"). */
  key?: string;
  /** Displayed width in pixels; the height follows the art's proportions. */
  width?: number;
  tint?: number;
  fontSize?: number;
  /** "down" fires as soon as it's pressed (default); "up" fires on release. */
  fireOn?: "down" | "up";
}

/** A labelled button that shows its pressed art while held (mouse or key). */
export class Button extends Phaser.GameObjects.Container {
  private image: Phaser.GameObjects.Image;
  private label: Phaser.GameObjects.Text;
  private artScale: number;
  private isDown = false;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    text: string,
    private action: () => void,
    private options: ButtonOptions = {},
  ) {
    super(scene, x, y);
    const { key, width = 150, tint, fontSize = 22 } = options;

    // Bottom-anchored so the up and down arts (different heights) share the same base line.
    this.image = new Phaser.GameObjects.Image(scene, 0, 0, "UI_button_up");
    this.artScale = width / this.image.width;
    this.image.setScale(this.artScale).setOrigin(0.5, 1);
    this.image.y = this.image.displayHeight / 2;
    if (tint !== undefined) this.image.setTint(tint);

    this.label = new Phaser.GameObjects.Text(scene, 0, 0, text, {
      ...TEXT_STYLE,
      fontSize: `${fontSize}px`,
    }).setOrigin(0.5);

    this.add([this.image, this.label]);
    this.release(false);

    this.image
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => this.press())
      .on("pointerup", () => this.release(true))
      .on("pointerout", () => this.release(false));

    if (key) {
      scene.input.keyboard?.on(`keydown-${key}`, (event: KeyboardEvent) => {
        if (!event.repeat) this.press();
      });
      scene.input.keyboard?.on(`keyup-${key}`, () => this.release(true));
    }

    scene.add.existing(this);
  }

  private press() {
    if (this.isDown) return;
    this.isDown = true;
    this.image.setTexture("UI_button_down");
    this.label.y = this.image.y - FACE_CENTER_DOWN * this.artScale;
    if (this.options.fireOn !== "up") this.action();
  }

  /** `activated` is false when the pointer just slid off the button. */
  private release(activated: boolean) {
    const wasDown = this.isDown;
    this.isDown = false;
    this.image.setTexture("UI_button_up");
    this.label.y = this.image.y - FACE_CENTER_UP * this.artScale;
    if (wasDown && activated && this.options.fireOn === "up") this.action();
  }
}
