import Phaser from "phaser";

export interface Collection {
  name: string;
  color: number;
}

export interface Item {
  collection: Collection;
  letter: string;
}

export const COLLECTIONS: Collection[] = [
  { name: "red", color: 0xff0000 },
  { name: "blue", color: 0x0000ff },
  { name: "green", color: 0x00ff00 },
  { name: "yellow", color: 0xffff00 },
];

const LETTERS = ["A", "B", "C", "D", "E", "F"];

export const ITEMS: Item[] = COLLECTIONS.flatMap((collection) =>
  LETTERS.map((letter) => ({ collection, letter })),
);

export const WISHLIST_SIZE = 5;

/** Distinct random items for the shopping list. */
export function pickWishlist(): Item[] {
  return Phaser.Utils.Array.Shuffle([...ITEMS]).slice(0, WISHLIST_SIZE);
}

/** Independent random pick: duplicates across calls are expected. */
export function randomItem(): Item {
  return Phaser.Utils.Array.GetRandom(ITEMS);
}
