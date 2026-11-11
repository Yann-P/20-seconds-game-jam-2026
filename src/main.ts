import Phaser from "phaser";
import { LoadingScene } from "./LoadingScene";
import { WishlistScene } from "./WishlistScene";
import { AuctionScene } from "./AuctionScene";
import { ResultsScene } from "./ResultsScene";

new Phaser.Game({
  type: Phaser.AUTO,
  scale: {
    parent: "game",
    width: 1000,
    height: 600,
    // Scales the 1000x600 game to fit the screen, keeping its proportions
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    fullscreenTarget: "game",
  },
  backgroundColor: "#fff",
  scene: [LoadingScene, WishlistScene, AuctionScene, ResultsScene],
  antialias: true,
  roundPixels: true,
});
