import Phaser from "phaser";
import { COLLECTIONS, ITEMS, randomItem, type Item } from "./items";
import { PlaceholderItem } from "./PlaceholderItem";

const DURATION = 20000;
const SPECTATOR_COUNT = 8;

const START_MONEY = 1000;
const OPENING_PRICE = { min: 80, max: 250 };
const BID_INCREASE = { min: 10, max: 40 };
const BID_THRESHOLD = 800; // spectators start bidding after this
const BID_INTERVAL = { min: 300, max: 900 };
const ITEM_LIFETIME = 5000; // someone else buys the item after this

export class AuctionScene extends Phaser.Scene {
  private money = START_MONEY;
  private price = 0;
  private currentItem!: Item;
  private purchased: Item[] = [];
  private itemDisplay!: PlaceholderItem;
  private priceLabel!: Phaser.GameObjects.Text;
  private moneyLabel!: Phaser.GameObjects.Text;
  private bidEvent?: Phaser.Time.TimerEvent;
  private lostEvent?: Phaser.Time.TimerEvent;
  private idleTweens = new Map<Phaser.GameObjects.Image, Phaser.Tweens.Tween>();
  private jumping = new Set<Phaser.GameObjects.Image>();
  private hudItems = new Map<Item, PlaceholderItem>();
  private timer!: Phaser.Time.TimerEvent;
  private bar!: Phaser.GameObjects.Rectangle;
  private label!: Phaser.GameObjects.Text;
  private spectators: Phaser.GameObjects.Image[] = [];
  private auctioner!: Phaser.GameObjects.Image;

  constructor() {
    super("auction");
  }

  create() {
    const { width, height } = this.scale;
    const sceneWidth = (width * 2) / 3; // left two thirds; the HUD takes the rest
    this.bar = this.add.rectangle(0, 0, width, 30, 0xffffff).setOrigin(0, 0);
    this.label = this.add
      .text(8, 15, "", { fontSize: "20px", color: "#000000" })
      .setOrigin(0, 0.5);
    this.timer = this.time.delayedCall(DURATION, () =>
      this.scene.start("results"),
    );

    // The scene instance is reused between games: reset state here.
    this.money = START_MONEY;
    this.purchased = [];
    this.idleTweens.clear();
    this.jumping.clear();
    this.registry.set("purchased", this.purchased);
    this.registry.set("money", this.money);

    this.auctioner = this.add.image(170, 180, "auctioner");
    this.auctioner.setScale(0.2);

    this.tweens.add({
      targets: this.auctioner,
      angle: this.auctioner.angle - 5,
      duration: Phaser.Math.Between(1800, 5600),
      ease: "Sine.easeInOut",
      yoyo: true,
      repeat: -1,
    });

    const table = this.add.image(200, 400, "table");
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
    const graphics = this.add.graphics({ fillStyle: { color: 0xffffff } });
    graphics.fillRectShape(rect);

    const yes = this.add
      .image((sceneWidth * 1) / 4, height - 30, "yes")
      .setScale(0.2)
      .setTint(0xbbffbb);
    const no = this.add
      .image((sceneWidth * 3) / 4, height - 30, "no")
      .setScale(0.2)
      .setTint(0xffbbbb);
    this.bindButton(yes, "Y", () => this.buy());
    this.bindButton(no, "N", () => this.presentNextItem());

    // HUD (right third, full height below the timer): money, then every collection
    const hudWidth = width - sceneWidth;
    const hudCenter = sceneWidth + hudWidth / 2;
    this.add
      .rectangle(sceneWidth, 30, hudWidth, height - 30, 0x12121f)
      .setOrigin(0, 0);
    this.moneyLabel = this.add
      .text(hudCenter, 70, "", { fontSize: "36px", color: "#ffffff" })
      .setOrigin(0.5);
    this.refreshMoney();

    // One row per collection; items stay half transparent until bought.
    const hudItemSize = 34;
    const hudItemGap = 8;
    const hudRowPitch = 56;
    this.hudItems.clear();
    COLLECTIONS.forEach((collection, row) => {
      const items = ITEMS.filter((item) => item.collection === collection);
      const startX =
        hudCenter - ((items.length - 1) * (hudItemSize + hudItemGap)) / 2;
      items.forEach((item, col) => {
        const x = startX + col * (hudItemSize + hudItemGap);
        const y = 150 + row * hudRowPitch;
        this.hudItems.set(
          item,
          new PlaceholderItem(this, x, y, item, hudItemSize).setAlpha(0.5),
        );
      });
    });

    // Object on sale and its price, next to the auctioner
    this.priceLabel = this.add
      .text(410, 150, "", { fontSize: "32px", color: "#ffffff" })
      .setOrigin(0.5);
    this.currentItem = randomItem();
    this.itemDisplay = new PlaceholderItem(
      this,
      410,
      240,
      this.currentItem,
      96,
    );
    this.presentNextItem();
  }

  /** Triggers the action on click or on the given key, with a quick zoom on the button. */
  private bindButton(
    button: Phaser.GameObjects.Image,
    key: string,
    action: () => void,
  ) {
    const baseScale = button.scale;
    const press = () => {
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
    this.bidEvent?.remove();
    this.lostEvent?.remove();

    this.currentItem = randomItem();
    this.itemDisplay.setItem(this.currentItem);
    this.setPrice(Phaser.Math.Between(OPENING_PRICE.min, OPENING_PRICE.max));

    this.bidEvent = this.time.delayedCall(BID_THRESHOLD, () =>
      this.spectatorBid(),
    );
    // Someone else buys it: no visual cue, on purpose.
    this.lostEvent = this.time.delayedCall(ITEM_LIFETIME, () =>
      this.presentNextItem(),
    );
  }

  private buy() {
    if (this.money < this.price) {
      // Can't afford it: flash the money
      this.moneyLabel.setColor("#ff5555");
      this.time.delayedCall(200, () => this.moneyLabel.setColor("#ffffff"));
      return;
    }
    this.money -= this.price;
    this.purchased.push(this.currentItem);
    this.hudItems.get(this.currentItem)?.setAlpha(1);
    this.registry.set("money", this.money);
    this.refreshMoney();
    this.presentNextItem();
  }

  private spectatorBid() {
    const increase = Phaser.Math.Between(BID_INCREASE.min, BID_INCREASE.max);
    this.setPrice(this.price + increase);

    const available = this.spectators.filter((s) => !this.jumping.has(s));
    if (available.length > 0) {
      const spectator = Phaser.Utils.Array.GetRandom(available);
      this.jump(spectator);

      const text = this.add
        .text(
          spectator.x,
          spectator.y - spectator.displayHeight - 10,
          `+${increase}`,
          {
            fontSize: "24px",
            fontStyle: "bold",
            color: "#ffe066",
            stroke: "#000000",
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
