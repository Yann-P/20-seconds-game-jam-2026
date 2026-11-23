import Phaser from "phaser";
import { ITEMS } from "./items";
import { NPCS_JSON_FILE, NPCS_JSON_KEY } from "./npcs";

export class LoadingScene extends Phaser.Scene {
  constructor() {
    super("loading");
  }

  preload() {
    const { width, height } = this.scale;
    const bar = this.add.rectangle(width / 2, height / 2, 0, 54, 0xffffff);
    this.load.on("progress", (value: number) => {
      bar.width = width * 0.6 * value;
    });
    this.load.setPath("assets");

    // Audio
    // Credits: https://pixabay.com/sound-effects/search/thump/
    this.load.audio("thump", ["thump.mp3"]);
    this.load.audio("woosh", ["woosh.mp3"]);
    this.load.audio("click", ["click.mp3"]);

    // Fonts
    this.load.font("whitrabt", "whitrabt.ttf", "truetype");

    this.load.json(NPCS_JSON_KEY, NPCS_JSON_FILE);

    // Images
    this.load.image("character_torso", "character_torso.png");
    this.load.image("character_head", "character_head.png");
    this.load.image("character_arm_L", "character_arm_L.png");
    this.load.image("character_arm_R", "character_arm_R.png");
    this.load.image("character_forearm_L", "character_forearm_L.png");
    this.load.image("character_forearm_R", "character_forearm_R.png");
    this.load.image("spectator", "spectator.png");
    this.load.image("star", "star.png");
    this.load.image("pupitre", "pupitre.png");
    this.load.image("UI_button_up_pink", "UI_button_up_pink.png");
    this.load.image("UI_button_down_pink", "UI_button_down_pink.png");
    this.load.image("UI_button_up_green", "UI_button_up_green.png");
    this.load.image("UI_button_down_green", "UI_button_down_green.png");
    this.load.image("UI_start", "UI_start.png");
    this.load.image("UI_start3", "UI_start3.png");
    this.load.image("mark_yes", "mark_yes.png");
    this.load.image("mark_no", "mark_no.png");
    this.load.image("review_star_empty", "review_star_empty.png");
    this.load.image("review_start_full", "review_start_full.png");
    this.load.image("NPC_1_outline", "NPC_1_outline.png");
    this.load.image("NPC_2_outline", "NPC_2_outline.png");
    this.load.image("NPC_3_outline", "NPC_3_outline.png");
    this.load.image("NPC_4_outline", "NPC_4_outline.png");
    this.load.image("NPC_5_outline", "NPC_5_outline.png");
    this.load.image("NPC_6_outline", "NPC_6_outline.png");
    this.load.image("NPC_7_outline", "NPC_7_outline.png");
    this.load.image("NPC_8_outline", "NPC_8_outline.png");
    this.load.image("NPC_9_outline", "NPC_9_outline.png");
    this.load.image("NPC_1", "NPC_1_frame.png");
    this.load.image("NPC_2", "NPC_2_frame.png");
    this.load.image("NPC_3", "NPC_3_frame.png");
    this.load.image("NPC_4", "NPC_4_frame.png");
    this.load.image("NPC_5", "NPC_5_frame.png");
    this.load.image("NPC_6", "NPC_6_frame.png");
    this.load.image("NPC_7", "NPC_7_frame.png");
    this.load.image("NPC_8", "NPC_8_frame.png");
    this.load.image("NPC_9", "NPC_9_frame.png");
    for (const item of ITEMS) {
      this.load.image(item.texture, `${item.texture}.png`);
    }
  }

  create() {
    this.scene.start("wishlist");
  }
}
