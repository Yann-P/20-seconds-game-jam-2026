import Phaser from "phaser";
import { shuffledItems, type Item } from "./items";
import { ItemImage } from "./ItemImage";
import { Auctioner } from "./Auctioner";
import { TEXT_STYLE } from "./consts";

const DURATION = 20000;
const SPECTATOR_COUNT = 8;

// Balance: 3 items to find. The budget covers 3 purchases even at the highest
// opening price, so hesitating (bids) or a wrong purchase is what makes you fall short.
const START_MONEY = 600;
const OPENING_PRICE = { min: 100, max: 200 };
const BID_INCREASE = { min: 10, max: 10 };
const BID_THRESHOLD = 800; // spectators start bidding after this
const BID_INTERVAL = { min: 500, max: 1200 };
// HUD inventory: bought items fill these slots in purchase order
const HUD_COLUMNS = 3;
const HUD_ITEM_SIZE = 64;
const HUD_SLOT_PITCH = 80;

const ITEM_LIFETIME = 5000; // someone else buys the item after this

export class AuctionScene extends Phaser.Scene {
  private money = START_MONEY;
  private price = 0;
  private currentItem!: Item;
  private purchased: Item[] = [];
  private itemDisplay!: ItemImage;
  private priceLabel!: Phaser.GameObjects.Text;
  private moneyLabel!: Phaser.GameObjects.Text;
  private bidEvent?: Phaser.Time.TimerEvent;
  private lostEvent?: Phaser.Time.TimerEvent;
  private idleTweens = new Map<Phaser.GameObjects.Image, Phaser.Tweens.Tween>();
  private jumping = new Set<Phaser.GameObjects.Image>();
  private itemRestX = 0;
  private deck: Item[] = [];
  private finished = false;
  private lastBidder?: Phaser.GameObjects.Image;
  private swipeTween?: Phaser.Tweens.Tween;
  private hudCenter = 0;
  private stopHints: (() => void)[] = [];
  private timer!: Phaser.Time.TimerEvent;
  private bar!: Phaser.GameObjects.Rectangle;
  private label!: Phaser.GameObjects.Text;
  private spectators: Phaser.GameObjects.Image[] = [];
  private auctioner!: Auctioner;
  private starsEmitter!: Phaser.GameObjects.Particles.ParticleEmitter;

  constructor() {
    super("auction");
  }

  create() {
    const { width, height } = this.scale;
    const sceneWidth = (width * 2) / 3; // left two thirds; the HUD takes the rest
    this.bar = this.add
      .rectangle(0, 0, width, 30, 0xcccccc)
      .setStrokeStyle(1, 0x0000000)
      .setOrigin(0, 0);
    this.label = this.add
      .text(8, 15, "", { ...TEXT_STYLE, fontSize: "20px", color: "black" })
      .setOrigin(0, 0.5);
    this.timer = this.time.delayedCall(DURATION, () =>
      this.scene.start("results"),
    );

    // The scene instance is reused between games: reset state here.
    this.money = START_MONEY;
    this.purchased = [];
    this.deck = shuffledItems();
    this.finished = false;
    this.idleTweens.clear();
    this.jumping.clear();
    this.registry.set("purchased", this.purchased);
    this.registry.set("money", this.money);

    this.auctioner = new Auctioner(this, 130, 280);

    const table = this.add.image(200, 380, "pupitre");
    table.setScale(0.35);

    const rect2 = new Phaser.Geom.Rectangle(
      0,
      height - 70 - 70,
      sceneWidth,
      70,
    );
    const graphics2 = this.add.graphics({ fillStyle: { color: 0xffffff } });
    graphics2.fillRectShape(rect2);

    this.spectators = [];
    const spacing = sceneWidth / (SPECTATOR_COUNT + 1);
    for (let i = 0; i < SPECTATOR_COUNT; i++) {
      const spectator = this.add
        .image(spacing * (i + 1), height, "spectator")
        .setOrigin(0.5, 1)
        .setScale(Phaser.Math.FloatBetween(0.13, 0.17));
      spectator.y -= 50;
      const idle = this.tweens.add({
        targets: spectator,
        y: spectator.y - 12,
        duration: Phaser.Math.Between(800, 3600),
        ease: "Sine.easeInOut",
        yoyo: true,
        repeat: -1,
        delay: Phaser.Math.Between(0, 1600),
      });
      this.spectators.push(spectator);
      this.idleTweens.set(spectator, idle);
    }

    const rect = new Phaser.Geom.Rectangle(0, height - 70, sceneWidth, 70);
    const graphics = this.add.graphics({
      fillStyle: { color: 0xffffff },
      lineStyle: { color: 0x000000, width: 1 },
    });
    graphics.fillRectShape(rect);
    graphics.strokeRectShape(rect);

    const yes = this.add
      .image((sceneWidth * 1) / 4, height - 30, "yes")
      .setScale(0.2)
      .setTint(0xbbffbb);
    const no = this.add
      .image((sceneWidth * 3) / 4, height - 30, "no")
      .setScale(0.2)
      .setTint(0xffbbbb);
    this.stopHints = [];
    this.bindButton(yes, "Y", () => this.buy());
    this.bindButton(no, "N", () => this.reject());

    // HUD (right third, full height below the timer): money, then the bought items
    const hudWidth = width - sceneWidth;
    const hudCenter = sceneWidth + hudWidth / 2;
    this.add
      .rectangle(sceneWidth, 30, hudWidth, height - 30, 0xffffff)
      .setStrokeStyle(1)
      .setOrigin(0, 0);
    this.moneyLabel = this.add
      .text(hudCenter, 70, "", { ...TEXT_STYLE, fontSize: "36px" })
      .setOrigin(0.5);
    this.refreshMoney();

    this.hudCenter = hudCenter;

    const itemDisplayX = 500;
    const itemDisplayY = 240;

    // Object on sale and its price, next to the auctioner
    this.priceLabel = this.add
      .text(itemDisplayX, itemDisplayY - 150, "", {
        ...TEXT_STYLE,
        fontSize: "42px",
      })
      .setOrigin(0.5);
    this.currentItem = this.deck[this.deck.length - 1]; // placeholder until presentNextItem

    this.starsEmitter = this.add.particles(0, 0, "star", {
      x: itemDisplayX,
      y: itemDisplayY,
      scale: { start: 0, end: 0.2 },
      alpha: { start: 0, end: 1 },
      lifespan: 2000,
      frequency: 400,
      emitZone: {
        type: "random",
        source: {
          getRandomPoint: (point: any) => {
            const minR = 90;
            const maxR = 110;
            const angle = Math.random() * Math.PI * 2;
            const r = Math.sqrt(
              Math.random() * (maxR * maxR - minR * minR) + minR * minR,
            );
            point.x = Math.cos(angle) * r;
            point.y = Math.sin(angle) * r;
          },
        } as any,
      },
      //blendMode: "ADD",
      //gravityY: 110,
    });

    this.itemDisplay = new ItemImage(
      this,
      itemDisplayX,
      itemDisplayY,
      this.currentItem,
      150,
    );
    this.itemRestX = itemDisplayX;

    this.tweens.add({
      targets: this.itemDisplay,
      y: this.itemDisplay.y + 20,
      duration: 2000,
      ease: "Sine.easeInOut",
      yoyo: true,
      repeat: -1,
    });

    this.presentNextItem();
  }

  /** Triggers the action on click or on the given key, with a quick zoom on the button. */
  private bindButton(
    button: Phaser.GameObjects.Image,
    key: string,
    action: () => void,
  ) {
    const baseScale = button.scale;

    // Pulse until the player presses either button for the first time.
    const hint = this.tweens.add({
      targets: button,
      scale: baseScale * 1.15,
      duration: 350,
      ease: "Sine.easeInOut",
      yoyo: true,
      repeat: -1,
    });
    this.stopHints.push(() => {
      hint.stop();
      button.setScale(baseScale);
    });

    const press = () => {
      this.stopHints.forEach((stop) => stop());
      this.stopHints = [];
      this.tweens.killTweensOf(button);
      button.setScale(baseScale);
      this.tweens.add({
        targets: button,
        scale: baseScale * 1.25,
        duration: 70,
        ease: "Quad.easeOut",
        yoyo: true,
      });
      action();
    };
    button.setInteractive({ useHandCursor: true }).on("pointerdown", press);
    this.input.keyboard?.on(`keydown-${key}`, press);
  }

  private presentNextItem() {
    this.starsEmitter.killAll();
    this.bidEvent?.remove();
    this.lostEvent?.remove();

    // Each object is auctioned only once: when none is left, the auction ends early.
    const next = this.deck.pop();
    if (!next) {
      this.finished = true;
      this.itemDisplay.setVisible(false);
      this.priceLabel.setVisible(false);
      this.time.delayedCall(700, () => this.scene.start("results"));
      return;
    }
    this.currentItem = next;
    this.itemDisplay.setItem(this.currentItem);

    // Swipe in from the left while fading in
    this.swipeTween?.stop();
    this.itemDisplay.setX(this.itemRestX - 100).setAlpha(0);
    this.swipeTween = this.tweens.add({
      targets: this.itemDisplay,
      x: this.itemRestX,
      alpha: 1,
      duration: 300,
      ease: "Quad.easeOut",
    });

    this.auctioner.play("present");
    this.setPrice(Phaser.Math.Between(OPENING_PRICE.min, OPENING_PRICE.max));

    this.bidEvent = this.time.delayedCall(BID_THRESHOLD, () =>
      this.spectatorBid(),
    );
    // Someone else buys it: no warning before it happens, on purpose.
    this.lastBidder = undefined;
    this.lostEvent = this.time.delayedCall(ITEM_LIFETIME, () => {
      this.auctioner.play("sold");
      this.flyItemToSpectator();
      this.presentNextItem();
    });
  }

  /** The player says no: a copy of the item is tossed away, spinning, and falls off screen. */
  private reject() {
    if (this.finished) return;
    this.presentNextItem();
  }

  /** A spectator (the last bidder) wins: a copy of the item flies to them, shrinking to nothing. */
  private flyItemToSpectator() {
    const buyer =
      this.lastBidder ?? Phaser.Utils.Array.GetRandom(this.spectators);
    const flying = new ItemImage(
      this,
      this.itemDisplay.x,
      this.itemDisplay.y,
      this.currentItem,
    ).setScale(this.itemDisplay.scale);
    this.tweens.add({
      targets: flying,
      x: buyer.x,
      y: buyer.y,
      scale: 0,
      duration: 450,
      ease: "Quad.easeIn",
      onComplete: () => flying.destroy(),
    });
  }

  private buy() {
    if (this.finished) return;
    if (this.money < this.price) {
      // Can't afford it: flash the money
      this.moneyLabel.setColor("#dd0000");
      this.time.delayedCall(200, () => this.moneyLabel.setColor("#000000"));
      return;
    }
    this.money -= this.price;
    this.purchased.push(this.currentItem);
    this.auctioner.play("sold");
    this.flyItemToInventory(this.currentItem, this.purchased.length - 1);
    this.registry.set("money", this.money);
    this.refreshMoney();
    this.presentNextItem();
  }

  /** The bought item flies from the auction to the next free inventory slot in the HUD. */
  private flyItemToInventory(item: Item, slot: number) {
    const x =
      this.hudCenter +
      ((slot % HUD_COLUMNS) - (HUD_COLUMNS - 1) / 2) * HUD_SLOT_PITCH;
    const y = 160 + Math.floor(slot / HUD_COLUMNS) * HUD_SLOT_PITCH;
    const bought = new ItemImage(
      this,
      this.itemDisplay.x,
      this.itemDisplay.y,
      item,
      HUD_ITEM_SIZE,
    );
    const restScale = bought.fitScale;
    bought.setScale(this.itemDisplay.scale);
    this.tweens.add({
      targets: bought,
      x,
      y,
      scale: restScale,
      duration: 450,
      ease: "Quad.easeInOut",
    });
  }

  private spectatorBid() {
    const increase = Phaser.Math.Between(BID_INCREASE.min, BID_INCREASE.max);
    this.setPrice(this.price + increase);

    const available = this.spectators.filter((s) => !this.jumping.has(s));
    if (available.length > 0) {
      const spectator = Phaser.Utils.Array.GetRandom(available);
      this.lastBidder = spectator;
      this.jump(spectator);

      const text = this.add
        .text(
          spectator.x,
          spectator.y - spectator.displayHeight - 10,
          `+${increase}`,
          {
            ...TEXT_STYLE,
            fontSize: "50px",
            fontStyle: "bold",
            stroke: "#ffffff",
            strokeThickness: 4,
          },
        )
        .setOrigin(0.5, 1);
      this.tweens.add({
        targets: text,
        y: text.y - 30,
        alpha: 0,
        duration: 700,
        ease: "Quad.easeIn",
        onComplete: () => text.destroy(),
      });
    }

    this.bidEvent = this.time.delayedCall(
      Phaser.Math.Between(BID_INTERVAL.min, BID_INTERVAL.max),
      () => this.spectatorBid(),
    );
  }

  private jump(spectator: Phaser.GameObjects.Image) {
    // The idle bobbing also drives y: pause it for the duration of the jump.
    const idle = this.idleTweens.get(spectator);
    idle?.pause();
    this.jumping.add(spectator);
    this.tweens.add({
      targets: spectator,
      y: spectator.y - 25,
      duration: 110,
      ease: "Quad.easeOut",
      yoyo: true,
      onComplete: () => {
        this.jumping.delete(spectator);
        idle?.resume();
      },
    });
  }

  private setPrice(price: number) {
    this.price = price;
    this.priceLabel.setText(`$${price}`);
  }

  private refreshMoney() {
    this.moneyLabel.setText(`$${this.money}`);
  }

  update() {
    const remaining = this.timer.getRemaining();
    this.bar.width = this.scale.width * (remaining / DURATION);
    this.label.setText(Math.ceil(remaining / 1000).toString());
  }
}
