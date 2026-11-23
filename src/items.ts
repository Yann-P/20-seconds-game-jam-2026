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
  { name: "injector", count: 3 },
  { name: "light", count: 3 },
  { name: "phone", count: 3 },
  { name: "plant", count: 3 },
  { name: "prothese", count: 3 },
  { name: "gun", count: 3 },
  { name: "hardisk", count: 3 },
  { name: "paper", count: 3 },
  { name: "sunglass", count: 3 },
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

export const WISHLIST_GUARANTEED_WITHIN_FIRST_PRESENTED_ITEMS = 20;

export function itemsInPresentationOrderWithWishlistGuaranteedEarly(
  wishlist: Item[],
): Item[] {
  const wishlistTextures = new Set(wishlist.map((item) => item.texture));
  const wishlistItems = ITEMS.filter((item) =>
    wishlistTextures.has(item.texture),
  );
  const shuffledNonWishlistItems = Phaser.Utils.Array.Shuffle(
    ITEMS.filter((item) => !wishlistTextures.has(item.texture)),
  );
  const nonWishlistItemsPresentedEarlyCount = Math.max(
    0,
    WISHLIST_GUARANTEED_WITHIN_FIRST_PRESENTED_ITEMS - wishlistItems.length,
  );
  const itemsPresentedEarly = Phaser.Utils.Array.Shuffle([
    ...wishlistItems,
    ...shuffledNonWishlistItems.slice(0, nonWishlistItemsPresentedEarlyCount),
  ]);
  const itemsPresentedLate = shuffledNonWishlistItems.slice(
    nonWishlistItemsPresentedEarlyCount,
  );
  return [...itemsPresentedEarly, ...itemsPresentedLate];
}
