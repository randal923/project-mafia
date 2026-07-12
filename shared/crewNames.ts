/**
 * Name pools for generating crew candidates. The recruitment service
 * combines them with a seeded RNG; the LLM only writes the one-line bio.
 * Combinations: 48 x 45 x (31 nickname variants) — collisions are fine,
 * half this city is named Sal.
 */
export const CREW_FIRST_NAMES = [
  "Ace", "Angelo", "Benny", "Bruno", "Carlo", "Cesar", "Dante", "Dominic",
  "Eddie", "Enzo", "Ezra", "Felix", "Frankie", "Gino", "Gus", "Harvey",
  "Iggy", "Ivan", "Jack", "Joey", "Jonah", "Lena", "Leo", "Lou",
  "Lucia", "Luca", "Marco", "Mickey", "Mona", "Nadia", "Nico", "Oscar",
  "Paulie", "Ray", "Remy", "Rocco", "Rosa", "Sal", "Sonny", "Stella",
  "Teddy", "Tommy", "Vera", "Vince", "Vito", "Willa", "Yuri", "Ziggy",
] as const;

export const CREW_LAST_NAMES = [
  "Abato", "Barzetti", "Bellome", "Bianchi", "Calloway", "Caruso", "Colombo",
  "Conti", "Costa", "DeLuca", "Donnelly", "Esposito", "Falcone", "Farrell",
  "Ferraro", "Fiore", "Gallo", "Greco", "Grimaldi", "Hartley", "Kaminski",
  "Kovac", "LaRosa", "Lombardi", "Malone", "Mancini", "Marino", "Moretti",
  "Novak", "O'Rourke", "Pagano", "Petrov", "Ricci", "Romano", "Rossi",
  "Russo", "Santoro", "Serrano", "Sokolov", "Sullivan", "Toscano", "Valentine",
  "Vargas", "Vitale", "Walsh", "Weiss", "Zampa", "Zeller",
] as const;

/** Slotted between first and last name; the empty string means no nickname. */
export const CREW_NICKNAMES = [
  "", "the Saint", "Two-Times", "the Ghost", "Knuckles", "the Book",
  "Fingers", "the Wire", "Smiles", "the Hammer", "Lucky", "the Fox",
  "Ice", "the Tailor", "Bricks", "the Whisper", "Snake Eyes", "the Doctor",
  "Matches", "the Owl", "Razor", "the Banker", "Shadows", "the Bull",
  "Pockets", "the Judge", "Static", "the Baron", "Echo", "the Locksmith",
  "Trigger",
] as const;

/** Stable translation keys parallel to `CREW_NICKNAMES`. */
export const CREW_NICKNAME_IDS = [
  "none", "saint", "two_times", "ghost", "knuckles", "book",
  "fingers", "wire", "smiles", "hammer", "lucky", "fox",
  "ice", "tailor", "bricks", "whisper", "snake_eyes", "doctor",
  "matches", "owl", "razor", "banker", "shadows", "bull",
  "pockets", "judge", "static", "baron", "echo", "locksmith",
  "trigger",
] as const;

export function formatCrewName(
  firstName: string,
  nickname: string,
  lastName: string,
): string {
  return nickname
    ? `${firstName} "${nickname}" ${lastName}`
    : `${firstName} ${lastName}`;
}
