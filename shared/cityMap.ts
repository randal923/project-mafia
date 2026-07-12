import type { TurfStatic } from "./territory";

/**
 * The city: a 10x7 grid of 70 turfs, seven districts of ten. Generated
 * data, hand-tunable — coordinates drive both map rendering and adjacency
 * (orthogonal neighbors touch). Landmark turfs carry no racket slots; the
 * landmark IS the building.
 */
export const CITY_GRID_COLUMNS = 10;
export const CITY_GRID_ROWS = 7;

export const CITY_TURFS: readonly TurfStatic[] = [
  {
    "baseDefense": 31,
    "buildingSlots": 1,
    "district": "hillcrest",
    "id": "hillcrest-01",
    "landmarkId": null,
    "name": "Crestview Terrace",
    "x": 0,
    "y": 0
  },
  {
    "baseDefense": 32,
    "buildingSlots": 2,
    "district": "hillcrest",
    "id": "hillcrest-02",
    "landmarkId": null,
    "name": "Magnolia Row",
    "x": 1,
    "y": 0
  },
  {
    "baseDefense": 33,
    "buildingSlots": 3,
    "district": "hillcrest",
    "id": "hillcrest-03",
    "landmarkId": null,
    "name": "The Conservatory Blocks",
    "x": 2,
    "y": 0
  },
  {
    "baseDefense": 34,
    "buildingSlots": 1,
    "district": "hillcrest",
    "id": "hillcrest-04",
    "landmarkId": null,
    "name": "Bishop's Gate",
    "x": 3,
    "y": 0
  },
  {
    "baseDefense": 35,
    "buildingSlots": 2,
    "district": "hillcrest",
    "id": "hillcrest-05",
    "landmarkId": null,
    "name": "Laurel Heights",
    "x": 4,
    "y": 0
  },
  {
    "baseDefense": 36,
    "buildingSlots": 3,
    "district": "hillcrest",
    "id": "hillcrest-06",
    "landmarkId": null,
    "name": "The Pemberton Estate",
    "x": 0,
    "y": 1
  },
  {
    "baseDefense": 37,
    "buildingSlots": 1,
    "district": "hillcrest",
    "id": "hillcrest-07",
    "landmarkId": null,
    "name": "Garden Court",
    "x": 1,
    "y": 1
  },
  {
    "baseDefense": 58,
    "buildingSlots": 0,
    "district": "hillcrest",
    "id": "hillcrest-08",
    "landmarkId": "hillcrest-general",
    "name": "Widow's Walk",
    "x": 2,
    "y": 1
  },
  {
    "baseDefense": 39,
    "buildingSlots": 3,
    "district": "hillcrest",
    "id": "hillcrest-09",
    "landmarkId": null,
    "name": "The Overlook",
    "x": 3,
    "y": 1
  },
  {
    "baseDefense": 34,
    "buildingSlots": 1,
    "district": "hillcrest",
    "id": "hillcrest-10",
    "landmarkId": null,
    "name": "Ivy Circle",
    "x": 4,
    "y": 1
  },
  {
    "baseDefense": 34,
    "buildingSlots": 3,
    "district": "old_quarter",
    "id": "old-quarter-01",
    "landmarkId": null,
    "name": "Cobbler's Lane",
    "x": 5,
    "y": 0
  },
  {
    "baseDefense": 26,
    "buildingSlots": 1,
    "district": "old_quarter",
    "id": "old-quarter-02",
    "landmarkId": null,
    "name": "Saint Amaro's Steps",
    "x": 6,
    "y": 0
  },
  {
    "baseDefense": 47,
    "buildingSlots": 0,
    "district": "old_quarter",
    "id": "old-quarter-03",
    "landmarkId": "city-hall-annex",
    "name": "The Clock Tower Blocks",
    "x": 7,
    "y": 0
  },
  {
    "baseDefense": 28,
    "buildingSlots": 3,
    "district": "old_quarter",
    "id": "old-quarter-04",
    "landmarkId": null,
    "name": "Tanner's Row",
    "x": 8,
    "y": 0
  },
  {
    "baseDefense": 29,
    "buildingSlots": 1,
    "district": "old_quarter",
    "id": "old-quarter-05",
    "landmarkId": null,
    "name": "Old Market Square",
    "x": 9,
    "y": 0
  },
  {
    "baseDefense": 30,
    "buildingSlots": 2,
    "district": "old_quarter",
    "id": "old-quarter-06",
    "landmarkId": null,
    "name": "The Archives Block",
    "x": 5,
    "y": 1
  },
  {
    "baseDefense": 31,
    "buildingSlots": 3,
    "district": "old_quarter",
    "id": "old-quarter-07",
    "landmarkId": null,
    "name": "Chandler's Cross",
    "x": 6,
    "y": 1
  },
  {
    "baseDefense": 32,
    "buildingSlots": 1,
    "district": "old_quarter",
    "id": "old-quarter-08",
    "landmarkId": null,
    "name": "Priory Walk",
    "x": 7,
    "y": 1
  },
  {
    "baseDefense": 33,
    "buildingSlots": 2,
    "district": "old_quarter",
    "id": "old-quarter-09",
    "landmarkId": null,
    "name": "The Foundling Yard",
    "x": 8,
    "y": 1
  },
  {
    "baseDefense": 28,
    "buildingSlots": 3,
    "district": "old_quarter",
    "id": "old-quarter-10",
    "landmarkId": null,
    "name": "Bellhaven Alley",
    "x": 9,
    "y": 1
  },
  {
    "baseDefense": 28,
    "buildingSlots": 1,
    "district": "ironworks",
    "id": "ironworks-01",
    "landmarkId": null,
    "name": "The Blast Rows",
    "x": 0,
    "y": 2
  },
  {
    "baseDefense": 29,
    "buildingSlots": 2,
    "district": "ironworks",
    "id": "ironworks-02",
    "landmarkId": null,
    "name": "Crucible Yard",
    "x": 1,
    "y": 2
  },
  {
    "baseDefense": 30,
    "buildingSlots": 3,
    "district": "ironworks",
    "id": "ironworks-03",
    "landmarkId": null,
    "name": "Slagtown",
    "x": 2,
    "y": 2
  },
  {
    "baseDefense": 22,
    "buildingSlots": 1,
    "district": "ironworks",
    "id": "ironworks-04",
    "landmarkId": null,
    "name": "The Chain Works",
    "x": 3,
    "y": 2
  },
  {
    "baseDefense": 23,
    "buildingSlots": 2,
    "district": "ironworks",
    "id": "ironworks-05",
    "landmarkId": null,
    "name": "Boilermaker's Block",
    "x": 4,
    "y": 2
  },
  {
    "baseDefense": 24,
    "buildingSlots": 3,
    "district": "ironworks",
    "id": "ironworks-06",
    "landmarkId": null,
    "name": "The Pattern Shops",
    "x": 0,
    "y": 3
  },
  {
    "baseDefense": 25,
    "buildingSlots": 1,
    "district": "ironworks",
    "id": "ironworks-07",
    "landmarkId": null,
    "name": "Anvil Court",
    "x": 1,
    "y": 3
  },
  {
    "baseDefense": 46,
    "buildingSlots": 0,
    "district": "ironworks",
    "id": "ironworks-08",
    "landmarkId": "union-hall",
    "name": "The Coke Ovens",
    "x": 2,
    "y": 3
  },
  {
    "baseDefense": 27,
    "buildingSlots": 3,
    "district": "ironworks",
    "id": "ironworks-09",
    "landmarkId": null,
    "name": "Piston Alley",
    "x": 3,
    "y": 3
  },
  {
    "baseDefense": 22,
    "buildingSlots": 1,
    "district": "ironworks",
    "id": "ironworks-10",
    "landmarkId": null,
    "name": "The Gantry Line",
    "x": 4,
    "y": 3
  },
  {
    "baseDefense": 41,
    "buildingSlots": 1,
    "district": "downtown",
    "id": "downtown-01",
    "landmarkId": null,
    "name": "Exchange Plaza",
    "x": 5,
    "y": 2
  },
  {
    "baseDefense": 42,
    "buildingSlots": 2,
    "district": "downtown",
    "id": "downtown-02",
    "landmarkId": null,
    "name": "The Meridian Blocks",
    "x": 6,
    "y": 2
  },
  {
    "baseDefense": 63,
    "buildingSlots": 0,
    "district": "downtown",
    "id": "downtown-03",
    "landmarkId": "police-precinct-hq",
    "name": "Granite Row",
    "x": 7,
    "y": 2
  },
  {
    "baseDefense": 44,
    "buildingSlots": 1,
    "district": "downtown",
    "id": "downtown-04",
    "landmarkId": null,
    "name": "Courthouse Square",
    "x": 8,
    "y": 2
  },
  {
    "baseDefense": 45,
    "buildingSlots": 2,
    "district": "downtown",
    "id": "downtown-05",
    "landmarkId": null,
    "name": "The Trust Building Blocks",
    "x": 9,
    "y": 2
  },
  {
    "baseDefense": 46,
    "buildingSlots": 3,
    "district": "downtown",
    "id": "downtown-06",
    "landmarkId": null,
    "name": "Pinnacle Corner",
    "x": 5,
    "y": 3
  },
  {
    "baseDefense": 47,
    "buildingSlots": 1,
    "district": "downtown",
    "id": "downtown-07",
    "landmarkId": null,
    "name": "The Press District",
    "x": 6,
    "y": 3
  },
  {
    "baseDefense": 48,
    "buildingSlots": 2,
    "district": "downtown",
    "id": "downtown-08",
    "landmarkId": null,
    "name": "Marble Arcade",
    "x": 7,
    "y": 3
  },
  {
    "baseDefense": 49,
    "buildingSlots": 3,
    "district": "downtown",
    "id": "downtown-09",
    "landmarkId": null,
    "name": "The Standard Blocks",
    "x": 8,
    "y": 3
  },
  {
    "baseDefense": 44,
    "buildingSlots": 1,
    "district": "downtown",
    "id": "downtown-10",
    "landmarkId": null,
    "name": "Union Square",
    "x": 9,
    "y": 3
  },
  {
    "baseDefense": 40,
    "buildingSlots": 2,
    "district": "neon_strip",
    "id": "neon-strip-01",
    "landmarkId": null,
    "name": "The Marquee Mile",
    "x": 0,
    "y": 4
  },
  {
    "baseDefense": 39,
    "buildingSlots": 1,
    "district": "neon_strip",
    "id": "neon-strip-02",
    "landmarkId": null,
    "name": "Velvet Row",
    "x": 1,
    "y": 4
  },
  {
    "baseDefense": 58,
    "buildingSlots": 0,
    "district": "neon_strip",
    "id": "neon-strip-03",
    "landmarkId": "the-grand-casino",
    "name": "The Palace Blocks",
    "x": 2,
    "y": 4
  },
  {
    "baseDefense": 37,
    "buildingSlots": 2,
    "district": "neon_strip",
    "id": "neon-strip-04",
    "landmarkId": null,
    "name": "Jackpot Corner",
    "x": 3,
    "y": 4
  },
  {
    "baseDefense": 36,
    "buildingSlots": 1,
    "district": "neon_strip",
    "id": "neon-strip-05",
    "landmarkId": null,
    "name": "The Boulevard of Aces",
    "x": 4,
    "y": 4
  },
  {
    "baseDefense": 44,
    "buildingSlots": 3,
    "district": "neon_strip",
    "id": "neon-strip-06",
    "landmarkId": null,
    "name": "Starlight Court",
    "x": 0,
    "y": 5
  },
  {
    "baseDefense": 43,
    "buildingSlots": 2,
    "district": "neon_strip",
    "id": "neon-strip-07",
    "landmarkId": null,
    "name": "The Revue Blocks",
    "x": 1,
    "y": 5
  },
  {
    "baseDefense": 42,
    "buildingSlots": 1,
    "district": "neon_strip",
    "id": "neon-strip-08",
    "landmarkId": null,
    "name": "Roulette Row",
    "x": 2,
    "y": 5
  },
  {
    "baseDefense": 41,
    "buildingSlots": 3,
    "district": "neon_strip",
    "id": "neon-strip-09",
    "landmarkId": null,
    "name": "The Midnight Mile",
    "x": 3,
    "y": 5
  },
  {
    "baseDefense": 37,
    "buildingSlots": 2,
    "district": "neon_strip",
    "id": "neon-strip-10",
    "landmarkId": null,
    "name": "Champagne Corner",
    "x": 4,
    "y": 5
  },
  {
    "baseDefense": 30,
    "buildingSlots": 1,
    "district": "riverside",
    "id": "riverside-01",
    "landmarkId": null,
    "name": "The Card Rooms",
    "x": 5,
    "y": 4
  },
  {
    "baseDefense": 31,
    "buildingSlots": 2,
    "district": "riverside",
    "id": "riverside-02",
    "landmarkId": null,
    "name": "Ferryman's Landing",
    "x": 6,
    "y": 4
  },
  {
    "baseDefense": 32,
    "buildingSlots": 3,
    "district": "riverside",
    "id": "riverside-03",
    "landmarkId": null,
    "name": "The Cannery Blocks",
    "x": 7,
    "y": 4
  },
  {
    "baseDefense": 24,
    "buildingSlots": 1,
    "district": "riverside",
    "id": "riverside-04",
    "landmarkId": null,
    "name": "Barge Row",
    "x": 8,
    "y": 4
  },
  {
    "baseDefense": 25,
    "buildingSlots": 2,
    "district": "riverside",
    "id": "riverside-05",
    "landmarkId": null,
    "name": "The Icehouse Blocks",
    "x": 9,
    "y": 4
  },
  {
    "baseDefense": 26,
    "buildingSlots": 3,
    "district": "riverside",
    "id": "riverside-06",
    "landmarkId": null,
    "name": "Current Street",
    "x": 5,
    "y": 5
  },
  {
    "baseDefense": 27,
    "buildingSlots": 1,
    "district": "riverside",
    "id": "riverside-07",
    "landmarkId": null,
    "name": "The Mill Races",
    "x": 6,
    "y": 5
  },
  {
    "baseDefense": 48,
    "buildingSlots": 0,
    "district": "riverside",
    "id": "riverside-08",
    "landmarkId": "riverside-freight-yard",
    "name": "Driftwood Court",
    "x": 7,
    "y": 5
  },
  {
    "baseDefense": 29,
    "buildingSlots": 3,
    "district": "riverside",
    "id": "riverside-09",
    "landmarkId": null,
    "name": "The Packing Rows",
    "x": 8,
    "y": 5
  },
  {
    "baseDefense": 24,
    "buildingSlots": 1,
    "district": "riverside",
    "id": "riverside-10",
    "landmarkId": null,
    "name": "Undertow Alley",
    "x": 9,
    "y": 5
  },
  {
    "baseDefense": 29,
    "buildingSlots": 3,
    "district": "the_docks",
    "id": "the-docks-01",
    "landmarkId": null,
    "name": "Pier Thirteen",
    "x": 0,
    "y": 6
  },
  {
    "baseDefense": 28,
    "buildingSlots": 2,
    "district": "the_docks",
    "id": "the-docks-02",
    "landmarkId": null,
    "name": "The Customs Sheds",
    "x": 1,
    "y": 6
  },
  {
    "baseDefense": 27,
    "buildingSlots": 1,
    "district": "the_docks",
    "id": "the-docks-03",
    "landmarkId": null,
    "name": "Longshore Row",
    "x": 2,
    "y": 6
  },
  {
    "baseDefense": 26,
    "buildingSlots": 3,
    "district": "the_docks",
    "id": "the-docks-04",
    "landmarkId": null,
    "name": "The Breakwater Blocks",
    "x": 3,
    "y": 6
  },
  {
    "baseDefense": 25,
    "buildingSlots": 2,
    "district": "the_docks",
    "id": "the-docks-05",
    "landmarkId": null,
    "name": "Anchor Yard",
    "x": 4,
    "y": 6
  },
  {
    "baseDefense": 44,
    "buildingSlots": 0,
    "district": "the_docks",
    "id": "the-docks-06",
    "landmarkId": "the-port",
    "name": "The Container Rows",
    "x": 5,
    "y": 6
  },
  {
    "baseDefense": 23,
    "buildingSlots": 3,
    "district": "the_docks",
    "id": "the-docks-07",
    "landmarkId": null,
    "name": "Stevedore's Walk",
    "x": 6,
    "y": 6
  },
  {
    "baseDefense": 22,
    "buildingSlots": 2,
    "district": "the_docks",
    "id": "the-docks-08",
    "landmarkId": null,
    "name": "The Fog Line",
    "x": 7,
    "y": 6
  },
  {
    "baseDefense": 21,
    "buildingSlots": 1,
    "district": "the_docks",
    "id": "the-docks-09",
    "landmarkId": null,
    "name": "Harbormaster's Block",
    "x": 8,
    "y": 6
  },
  {
    "baseDefense": 26,
    "buildingSlots": 3,
    "district": "the_docks",
    "id": "the-docks-10",
    "landmarkId": null,
    "name": "The Salt Stacks",
    "x": 9,
    "y": 6
  }
];

const TURFS_BY_ID = new Map(CITY_TURFS.map((turf) => [turf.id, turf]));

export function cityTurf(id: string): TurfStatic | null {
  return TURFS_BY_ID.get(id) ?? null;
}
