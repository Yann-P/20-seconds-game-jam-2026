import Phaser from "phaser";
import {
  itemsInPresentationOrderWithWishlistGuaranteedEarly,
  type Item,
} from "./items";
import { ItemImage } from "./ItemImage";
import { Auctioner } from "./Auctioner";
import { Button } from "./Button";
import { COLORS, TEXT_STYLE, TIMER_HEIGHT } from "./consts";

const DURATION = 20000;
const SPECTATOR_COUNT = 7;

const START_MONEY = 1000;
const OPENING_PRICE = { min: 100, max: 200 };
const BID_INCREASE = { min: 10, max: 10 };
const BID_THRESHOLD = 1000; // spectators start bidding after this time interval
const BID_INTERVAL = { min: 1000, max: 1200 };
// HUD inventory: bought items fill these slots in purchase order
const HUD_COLUMNS = 3;
const HUD_ITEM_SIZE = 150;
const HUD_SLOT_PITCH = 144;

const NEXT_ITEM_DELAY = 600; // pause after the hammer hits, before the next object
const ITEM_LIFETIME = 5000; // someone else buys the item after this

export class AuctionScene extends Phaser.Scene {
  private money = START_MONEY;
  private price = 0;
  private currentItem!: Item;
  private purchased: Item[] = [];
  private itemDisplay!: ItemImage;
  private priceLabel!: Phaser.GameObjects.Text;
  private priceLabelLabel!: Phaser.GameObjects.Text;
  private moneyLabel!: Phaser.GameObjects.Text;
  private bidEvent?: Phaser.Time.TimerEvent;
  private lostEvent?: Phaser.Time.TimerEvent;
  private idleTweens = new Map<Phaser.GameObjects.Image, Phaser.Tweens.Tween>();
  private jumping = new Set<Phaser.GameObjects.Image>();
  private itemRestX = 0;
  private deck: Item[] = [];
  private finished = false;
  private waitingForNext = false;
  private lastBidder?: Phaser.GameObjects.Image;
  private swipeTween?: Phaser.Tweens.Tween;
  private hudCenter = 0;
  private stopHints: (() => void)[] = [];
  private timer!: Phaser.Time.TimerEvent;
  private bar!: Phaser.GameObjects.Rectangle;
  private label!: Phaser.GameObjects.Text;
  private spectators: Phaser.GameObjects.Image[] = [];
  private auctioner!: Auctioner;

  constructor() {
    super("auction");
  }

  create() {
    const { width, height } = this.scale;
    const sceneWidth = (width * 2) / 3; // left two thirds; the HUD takes the rest

    const yellowBackground = this.add.rectangle(
      this.scale.width / 3,
      0,
      this.scale.width / 3,
      this.scale.height,
      COLORS.yellow.hex,
    );

    yellowBackground.setOrigin(0, 0);

    this.add
      .rectangle(0, 0, width, TIMER_HEIGHT, COLORS.pinkpurple.hex)
      .setOrigin(0, 0);

    this.bar = this.add
      .rectangle(0, 0, width, TIMER_HEIGHT, COLORS.pink.hex)
      .setStrokeStyle(2, COLORS.purple.hex)
      .setOrigin(0, 0);
    this.label = this.add
      .text(15, 27, "", { ...TEXT_STYLE, fontSize: "36px", color: "black" })
      .setOrigin(0, 0.5);
    this.timer = this.time.delayedCall(DURATION, () =>
      this.scene.start("results"),
    );

    // The scene instance is reused between games: reset state here.
    this.money = START_MONEY;
    this.purchased = [];
    this.deck = itemsInPresentationOrderWithWishlistGuaranteedEarly(
      this.registry.get("wishlist") ?? [],
    );
    this.finished = false;
    this.waitingForNext = false;
    this.idleTweens.clear();
    this.jumping.clear();
    this.registry.set("purchased", this.purchased);
    this.registry.set("money", this.money);

    this.auctioner = new Auctioner(this, 250, 590);

    const table = this.add.image(384, 770, "pupitre");
    table.setScale(0.63);

    this.spectators = [];
    const spacing = sceneWidth / (SPECTATOR_COUNT + 1);
    for (let i = 0; i < SPECTATOR_COUNT; i++) {
      const spectator = this.add
        .image(
          spacing * (i + 1) - 150,
          height + 50,
          "NPC_" + Phaser.Math.Between(2, 9) + "_outline",
        )
        .setOrigin(0.5, 1)
        .setScale(Phaser.Math.FloatBetween(0.8, 0.9));
      spectator.y -= 90;
      const idle = this.tweens.add({
        targets: spectator,
        y: spectator.y - 22,
        duration: Phaser.Math.Between(800, 3600),
        ease: "Sine.easeInOut",
        yoyo: true,
        repeat: -1,
        delay: Phaser.Math.Between(0, 1600),
      });
      this.spectators.push(spectator);
      this.idleTweens.set(spectator, idle);
    }

    const yesNoContainer = this.add.rectangle(
      0,
      this.scale.height - 126,
      this.scale.width,
      126,
      COLORS.darkpink.hex,
    );
    yesNoContainer.setOrigin(0, 0);

    this.stopHints = [];
    const pressed = (action: () => void) => () => {
      this.stopHints.forEach((stop) => stop());
      this.stopHints = [];
      action();
    };
    this.addHint(
      new Button(
        this,
        (this.scale.width * 2) / 3,
        height - 75,
        "YES",
        "press y",
        "green",
        pressed(() => this.buy()),
        { key: "Y", width: 270 },
      ),
    );
    this.addHint(
      new Button(
        this,
        (this.scale.width * 1) / 3,
        height - 75,
        "NO",
        "press n",
        "pink",
        pressed(() => this.reject()),
        { key: "N", width: 270 },
      ),
    );

    const uiStartHud = this.add
      .image(
        (this.scale.width * 2) / 3 - 60,
        this.scale.height / 2 - 40,
        "UI_start",
      )
      .setOrigin(0, 0.5)
      .setScale(1.5, 1.5);

    const yellowBackgroundHud = this.add
      .rectangle(
        uiStartHud.x + 35,
        uiStartHud.y,
        uiStartHud.width - 53,
        200,
        COLORS.yellow.hex,
      )
      .setOrigin(0, 0.5)
      .setScale(1.5);

    yellowBackground.setOrigin(0, 0);

    //// HUD ////
    const hudWidth = this.scale.width / 3;
    const hudCenter = sceneWidth + hudWidth / 2 - 40;
    this.moneyLabel = this.add
      .text(hudCenter, 250, "", {
        ...TEXT_STYLE,
        color: COLORS.pink.hexString,
        align: "left",
        fontSize: "72px",
      })
      .setOrigin(0.5);
    this.refreshMoney();

    this.hudCenter = hudCenter;

    const itemDisplayX = 960;
    const itemDisplayY = 470;

    this.priceLabelLabel = this.add
      .text(itemDisplayX, itemDisplayY - 320, "PRICE", {
        ...TEXT_STYLE,
        fontSize: "76px",
      })
      .setOrigin(0.5);

    // Object on sale and its price, next to the auctioner
    this.priceLabel = this.add
      .text(itemDisplayX, itemDisplayY - 250, "", {
        ...TEXT_STYLE,
        fontSize: "76px",
      })
      .setOrigin(0.5);
    this.currentItem = this.deck[this.deck.length - 1]; // placeholder until presentNextItem

    this.itemDisplay = new ItemImage(
      this,
      itemDisplayX,
      itemDisplayY,
      this.currentItem,
      300,
    );
    this.itemRestX = itemDisplayX;

    this.tweens.add({
      targets: this.itemDisplay,
      y: this.itemDisplay.y + 36,
      duration: 2000,
      ease: "Sine.easeInOut",
      yoyo: true,
      repeat: -1,
    });

    this.presentNextItem();
  }

  /** Pulses the button until the player presses either button for the first time. */
  private addHint(button: Button) {
    const hint = this.tweens.add({
      targets: button,
      scale: 1.15,
      duration: 350,
      ease: "Sine.easeInOut",
      yoyo: true,
      repeat: 2,
    });
    this.stopHints.push(() => {
      hint.stop();
      button.setScale(1);
    });
  }

  private presentNextItem() {
    this.bidEvent?.remove();
    this.lostEvent?.remove();

    // Each object is auctioned only once: when none is left, the auction ends early.
    const next = this.deck.shift();
    if (!next) {
      this.finished = true;
      this.itemDisplay.setVisible(false);
      this.priceLabel.setVisible(false);
      this.priceLabelLabel.setVisible(false);
      this.time.delayedCall(700, () => this.scene.start("results"));
      return;
    }
    this.currentItem = next;
    this.itemDisplay.setItem(this.currentItem);

    // Swipe in from the left while fading in
    this.swipeTween?.stop();
    this.itemDisplay.setX(this.itemRestX - 180).setAlpha(0);
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
      this.presentNextItemAfterHammer();
    });
  }

  /** After a sale (to the player or a spectator): short pause on the hammer hit before the next object. */
  private presentNextItemAfterHammer() {
    this.bidEvent?.remove();
    this.lostEvent?.remove();
    this.waitingForNext = true; // yes/no are ignored meanwhile
    // The sold object is gone from the stand: a copy of it is flying to its buyer.
    this.swipeTween?.stop();
    this.itemDisplay.setAlpha(0);
    this.time.delayedCall(NEXT_ITEM_DELAY, () => {
      this.waitingForNext = false;
      this.presentNextItem();
    });
  }

  private reject() {
    if (this.finished || this.waitingForNext) return;
    this.presentNextItem();
  }

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
      duration: 600,
      ease: "Quad.easeIn",
      onComplete: () => flying.destroy(),
    });
  }

  private buy() {
    if (this.finished || this.waitingForNext) return;
    if (this.money < this.price) {
      // Can't afford it: flash the money
      this.moneyLabel.setColor("red");

      // Restart from the resting size: otherwise a new press mid-animation
      // takes the enlarged size as its starting point and ends up stuck there.
      this.tweens.killTweensOf(this.moneyLabel);
      this.moneyLabel.setScale(1);
      this.tweens.add({
        targets: [this.moneyLabel],
        color: "#dd00000",
        duration: 100,
        scale: 2,
        ease: "Quad.easeInOut",
        yoyo: true,
        onComplete: () => {
          this.moneyLabel.setColor(COLORS.yellow.hexString);
        },
      });

      return;
    }
    this.money -= this.price;
    this.purchased.push(this.currentItem);
    this.auctioner.play("sold");
    this.flyItemToInventory(this.currentItem, this.purchased.length - 1);
    this.registry.set("money", this.money);
    this.refreshMoney();
    this.presentNextItemAfterHammer();
  }

  /** The bought item flies from the auction to the next free inventory slot in the HUD. */
  private flyItemToInventory(item: Item, slot: number) {
    const x =
      this.hudCenter +
      ((slot % HUD_COLUMNS) - (HUD_COLUMNS - 1) / 2) * HUD_SLOT_PITCH -
      50;
    const y = 400 + Math.floor(slot / HUD_COLUMNS) * HUD_SLOT_PITCH;
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
          spectator.y - spectator.displayHeight,
          `+ \$${increase}`,
          {
            ...TEXT_STYLE,
            fontSize: "90px",
            fontStyle: "bold",
            stroke: COLORS.yellow.hexString,
            color: COLORS.darkpink.hexString,
            strokeThickness: 7,
          },
        )
        .setOrigin(0.5, 1);
      this.tweens.add({
        targets: text,
        y: text.y - 54,
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
      y: spectator.y - 45,
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
    this.moneyLabel.setText(`CREDIT: $${this.money}`);
  }

  update() {
    const remaining = this.timer.getRemaining();
    this.bar.width = this.scale.width * (remaining / DURATION);
    this.label.setText(Math.ceil(remaining / 1000).toString());
  }
}
