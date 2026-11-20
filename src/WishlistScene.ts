import Phaser from "phaser";
import { pickWishlist } from "./items";
import { ItemImage } from "./ItemImage";
import { COLORS, TEXT_STYLE } from "./consts";
import { Button } from "./Button";

export class WishlistScene extends Phaser.Scene {
  constructor() {
    super("wishlist");
  }

  private startGame() {
    this.requestFullscreenOnMobile();
    this.scene.start("auction");
  }

  private requestFullscreenOnMobile() {
    if (this.sys.game.device.os.desktop) return;
    if (!this.scale.fullscreen.available || this.scale.isFullscreen) return;
    this.scale.once(Phaser.Scale.Events.ENTER_FULLSCREEN, () => {
      const orientation = screen.orientation as ScreenOrientation & {
        lock?: (orientation: string) => Promise<void>;
      };
      orientation.lock?.("landscape").catch(() => {});
    });
    this.scale.startFullscreen();
  }

  create() {
    const { width } = this.scale;
    const wishlist = pickWishlist();
    this.registry.set("wishlist", wishlist);
    this.registry.set("npcid", Phaser.Math.Between(1, 9));

    const yellow = this.add.rectangle(
      this.scale.width / 2,
      this.scale.height / 2 + 50,
      1180,
      350,
      COLORS.yellow.hex,
    );

    const ui = this.add.image(
      this.scale.width / 2,
      this.scale.height / 2,
      "UI_start3",
    );
    ui.setScale(1.9);

    this.add
      .text(390, 430, "Order details:", {
        ...TEXT_STYLE,
        fontSize: "33px",
        color: COLORS.pinkpurple.hexString,
      })
      .setOrigin(0, 0);

    const npc = this.add.image(470, 280, "NPC_" + this.registry.get("npcid"));
    npc.setScale(0.65);

    this.add
      .text(npc.x + 100, npc.y - 100, "CUSTOMER CU_942342_FA", {
        ...TEXT_STYLE,
        fontSize: "40px",
        color: COLORS.darkpink.hexString,
      })
      .setOrigin(0, 0);

    this.add
      .text(npc.x + 100, npc.y - 60, "ORDER SJKLAHFAKLSHFKLS", {
        ...TEXT_STYLE,
        fontSize: "33px",
        color: COLORS.darkpink.hexString,
      })
      .setOrigin(0, 0);

    this.add
      .text(
        npc.x + 100,
        npc.y - 25,
        "REQUEST:\nBuy these 3 items for me at the auction\nBUDGET:\n$1000",
        {
          ...TEXT_STYLE,
          fontSize: "33px",
        },
      )
      .setOrigin(0, 0);

    const size = 230;
    const gap = 58;
    const startX = width / 2 - ((wishlist.length - 1) * (size + gap)) / 2;
    wishlist.forEach((item, i) => {
      const image = new ItemImage(
        this,
        startX + i * (size + gap),
        580,
        item,
        size,
      );

      this.tweens.add({
        targets: [image],
        y: image.y + 36,
        angle: [-2, 2],
        duration: 2000 + i * 1000,
        yoyo: true,
        repeat: -1,
      });
    });

    new Button(
      this,
      this.scale.width / 2,
      1080 - 230,
      "OK",
      "press x",
      "green",
      () => this.startGame(),
      {
        key: "X",
        //width: 504,
        fireOn: "up",
      },
    );
  }
}
