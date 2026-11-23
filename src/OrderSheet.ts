import Phaser from "phaser";
import { COLORS, TEXT_STYLE } from "./consts";
import type { Npc } from "./npcs";
import { addTypewriterText } from "./TypewriterText";

export const ORDER_SHEET_CONTENT_LEFT_X = 390;
export const ORDER_SHEET_CONTENT_RIGHT_X = 1530;

const NPC_PORTRAIT_X = 470;
const NPC_PORTRAIT_Y = 280;
const TEXT_BESIDE_PORTRAIT_X = NPC_PORTRAIT_X + 100;

export function addOrderSheet(scene: Phaser.Scene, npc: Npc, message: string) {
  const centerX = scene.scale.width / 2;
  const centerY = scene.scale.height / 2;

  scene.add.rectangle(centerX, centerY + 50, 1180, 350, COLORS.yellow.hex);

  const yellowStripTop = scene.add.tileSprite(
    centerX,
    centerY - 160,
    1180,
    50,
    "line_yellow",
  );
  yellowStripTop.setOrigin(0.5, 0);

  const yellowStripBottom = scene.add.tileSprite(
    centerX,
    centerY + 200,
    1180,
    50,
    "line_yellow",
  );
  yellowStripBottom.tileRotation = -Math.PI;
  yellowStripBottom.setOrigin(0.5, 0);

  scene.add.image(centerX, centerY, "UI_start3").setScale(1.9);
  scene.add
    .image(NPC_PORTRAIT_X, NPC_PORTRAIT_Y, "NPC_" + npc.id)
    .setScale(0.65);

  addTypewriterText(
    scene,
    TEXT_BESIDE_PORTRAIT_X,
    NPC_PORTRAIT_Y - 100,
    "CUSTOMER " + npc.customerId,
    {
      ...TEXT_STYLE,
      fontSize: "40px",
      color: COLORS.darkpink.hexString,
    },
  );

  addTypewriterText(
    scene,
    TEXT_BESIDE_PORTRAIT_X,
    NPC_PORTRAIT_Y - 60,
    "ORDER " + npc.orderId,
    {
      ...TEXT_STYLE,
      fontSize: "33px",
      color: COLORS.darkpink.hexString,
    },
  );

  addTypewriterText(
    scene,
    TEXT_BESIDE_PORTRAIT_X,
    NPC_PORTRAIT_Y - 25,
    message,
    {
      ...TEXT_STYLE,
      fontSize: "33px",
      wordWrap: {
        width: ORDER_SHEET_CONTENT_RIGHT_X - TEXT_BESIDE_PORTRAIT_X,
      },
    },
  );
}

export function addOrderSheetSectionLabel(
  scene: Phaser.Scene,
  y: number,
  label: string,
) {
  addTypewriterText(scene, ORDER_SHEET_CONTENT_LEFT_X, y, label, {
    ...TEXT_STYLE,
    fontSize: "33px",
    color: COLORS.pinkpurple.hexString,
  });
}
