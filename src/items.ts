import Phaser from "phaser";

export interface Collection {
  name: string;
  /** Number of items: assets are named `<name>_1.png` ... `<name>_<count>.png`. */
  count: number;
}

export interface Item {
  collection: Collection;
  /** Texture key, also the asset file name without extension (e.g. `book_2`). */
  texture: string;
}

// Collections don't need to have the same number of items.
export const COLLECTIONS: Collection[] = [
  { name: "book", count: 3 },
  { name: "flask", count: 3 },
  { name: "floppy", count: 3 },
  { name: "light", count: 3 },
  { name: "phone", count: 3 },
  { name: "plant", count: 3 },
];

export const ITEMS: Item[] = COLLECTIONS.flatMap((collection) =>
  Array.from({ length: collection.count }, (_, i) => ({
    collection,
    texture: `${collection.name}_${i + 1}`,
  })),
);

export const WISHLIST_SIZE = 3;

/** Distinct random items for the shopping list. */
export function pickWishlist(): Item[] {
  return Phaser.Utils.Array.Shuffle([...ITEMS]).slice(0, WISHLIST_SIZE);
}

/** Every item exactly once, in random order. */
export function shuffledItems(): Item[] {
  return Phaser.Utils.Array.Shuffle([...ITEMS]);
}
