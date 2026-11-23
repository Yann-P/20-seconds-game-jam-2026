import Phaser from "phaser";
import type { Item } from "./items";
import { ItemImage } from "./ItemImage";
import { Button } from "./Button";
import { findNpc, resultSentenceForPurchases } from "./npcs";
import {
  ORDER_SHEET_CONTENT_LEFT_X,
  ORDER_SHEET_CONTENT_RIGHT_X,
  addOrderSheet,
  addOrderSheetSectionLabel,
} from "./OrderSheet";

const ITEM_ROW_GAP = 30;
const BOUGHT_MARK_OFFSET_FROM_ITEM_CENTER = 50;

export class ResultsScene extends Phaser.Scene {
  constructor() {
    super("results");
  }

  create() {
    const wishlist: Item[] = this.registry.get("wishlist") ?? [];
    const purchased: Item[] = this.registry.get("purchased") ?? [];
    const npc = findNpc(this, this.registry.get("npcid"));

    const wishlistTextures = new Set(wishlist.map((item) => item.texture));
    const correctItems = purchased.filter((item) =>
      wishlistTextures.has(item.texture),
    );
    const superfluousItems = purchased.filter(
      (item) => !wishlistTextures.has(item.texture),
    );

    addOrderSheet(
      this,
      npc,
      "FEEDBACK:\n" +
        resultSentenceForPurchases(
          npc,
          correctItems.length,
          superfluousItems.length,
        ),
    );

    addOrderSheetSectionLabel(
      this,
      430,
      `Order delivered: ${correctItems.length} / ${wishlist.length}`,
    );
    const wishlistItemImages = this.addItemRow(wishlist, 545, 150);
    const purchasedTextures = new Set(purchased.map((item) => item.texture));
    wishlist.forEach((item, itemIndex) => {
      this.addBoughtMark(
        wishlistItemImages[itemIndex],
        purchasedTextures.has(item.texture),
      );
    });

    if (superfluousItems.length > 0) {
      addOrderSheetSectionLabel(this, 630, "I did not ask for this:");
      this.addItemRow(superfluousItems, 715, 85);
    }

    new Button(
      this,
      960,
      1080 - 230,
      "Again?",
      "press x",
      "green",
      () => this.replay(),
      {
        key: "X",
        //width: 540,
        fireOn: "up",
      },
    );
  }

  private addItemRow(items: Item[], y: number, itemSize: number) {
    const distanceBetweenItemCenters = Math.min(
      itemSize + ITEM_ROW_GAP,
      (ORDER_SHEET_CONTENT_RIGHT_X - ORDER_SHEET_CONTENT_LEFT_X) / items.length,
    );
    return items.map(
      (item, itemIndex) =>
        new ItemImage(
          this,
          ORDER_SHEET_CONTENT_LEFT_X +
            itemSize / 2 +
            itemIndex * distanceBetweenItemCenters,
          y,
          item,
          itemSize,
        ),
    );
  }

  private addBoughtMark(itemImage: ItemImage, wasBought: boolean) {
    this.add.image(
      itemImage.x + BOUGHT_MARK_OFFSET_FROM_ITEM_CENTER,
      itemImage.y + BOUGHT_MARK_OFFSET_FROM_ITEM_CENTER,
      wasBought ? "mark_yes" : "mark_no",
    );
  }

  private replay() {
    this.scene.start("wishlist");
  }
}
