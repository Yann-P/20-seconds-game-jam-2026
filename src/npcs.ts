import Phaser from "phaser";
import { WISHLIST_SIZE } from "./items";

export interface Npc {
  id: number;
  persona: string;
  customerId: string;
  orderId: string;
  resultSentences: {
    perfect: string;
    mid: string;
    bad: string;
  };
}

export const NPCS_JSON_KEY = "npcs";
export const NPCS_JSON_FILE = "npcs.json";

export function findNpc(scene: Phaser.Scene, npcId: number): Npc {
  const npcs: Npc[] = scene.cache.json.get(NPCS_JSON_KEY);
  const npc = npcs.find((candidate) => candidate.id === npcId);
  if (!npc) throw new Error(`Unknown NPC id: ${npcId}`);
  return npc;
}

export function resultSentenceForPurchases(
  npc: Npc,
  correctItemCount: number,
  superfluousItemCount: number,
): string {
  const boughtWholeWishlist = correctItemCount >= WISHLIST_SIZE;
  const boughtAllButOneWishlistItem = correctItemCount === WISHLIST_SIZE - 1;
  const boughtSuperfluousItems = superfluousItemCount > 0;

  if (boughtWholeWishlist && !boughtSuperfluousItems) {
    return npc.resultSentences.perfect;
  }
  if (boughtWholeWishlist || boughtAllButOneWishlistItem) {
    return npc.resultSentences.mid;
  }
  return npc.resultSentences.bad;
}
