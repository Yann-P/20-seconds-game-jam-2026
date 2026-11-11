import Phaser from "phaser";
import { LoadingScene } from "./LoadingScene";
import { WishlistScene } from "./WishlistScene";
import { AuctionScene } from "./AuctionScene";
import { ResultsScene } from "./ResultsScene";

new Phaser.Game({
  type: Phaser.AUTO,
  width: 1000,
  height: 600,
  backgroundColor: "#1d1d2e",
  scene: [LoadingScene, WishlistScene, AuctionScene, ResultsScene],
});
