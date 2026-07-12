import assert from "node:assert/strict";
import test from "node:test";
import type { Player, PlayerItem } from "@shared/player";
import { runOptimisticLoadoutMutation } from "./runOptimisticLoadoutMutation.ts";

const knife: PlayerItem = {
  id: "stiletto-knife",
  name: "Stiletto Knife",
  slot: "hand"
};

const gun: PlayerItem = {
  id: "service-45",
  name: "Service .45",
  slot: "hand"
};

const player: Player = {
  avatar: null,
  createdAt: "2026-07-10T00:00:00.000Z",
  id: "player-1",
  language: null,
  loadout: { hand: knife },
  name: "Rico Vale",
  nameKey: "rico vale",
  narrative: {
    llmMemory: { importantFacts: [], unresolvedConflicts: [] },
    storySummary: ""
  },
  war: { lastAttackAt: null, revenge: null },
  family: null,
  prison: null,
  progression: {
    experience: 0,
    level: 10,
    skillExperience: {
      charisma: 0,
      corruption: 0,
      leadership: 0,
      muscle: 0,
      stealth: 0,
      strategy: 0,
      tech: 0
    },
    skillPoints: 0,
    skills: {
      charisma: 1,
      corruption: 1,
      leadership: 1,
      muscle: 1,
      stealth: 1,
      strategy: 1,
      tech: 1
    }
  },
  rank: "nobody",
  reservedEquipment: null,
  resources: {
    cash: 0,
    drunk: 0,
    health: 100,
    heat: 0,
    high: 0,
    power: 0,
    stamina: 100
  },
  stash: [gun],
  updatedAt: "2026-07-10T00:00:00.000Z"
};

test("rolls back a rejected gun-for-knife hand replacement", async () => {
  const renderedPlayers: Player[] = [];
  const failure = new Error("Equip rejected");
  let rejectMutation: (reason: unknown) => void = () => undefined;
  const pendingMutation = new Promise<Player>((_, reject) => {
    rejectMutation = reject;
  });

  const operation = runOptimisticLoadoutMutation({
    mutate: () => pendingMutation,
    player,
    setPlayer: (nextPlayer) => renderedPlayers.push(nextPlayer),
    update: { item: gun, type: "equip" }
  });

  assert.equal(renderedPlayers.length, 1);
  assert.equal(renderedPlayers[0]?.loadout.hand?.id, gun.id);
  assert.deepEqual(renderedPlayers[0]?.stash, [knife]);

  rejectMutation(failure);

  assert.deepEqual(await operation, { error: failure, failed: true });
  assert.equal(renderedPlayers.length, 2);
  assert.strictEqual(renderedPlayers[1], player);
  assert.equal(renderedPlayers[1]?.loadout.hand?.id, knife.id);
  assert.deepEqual(renderedPlayers[1]?.stash, [gun]);
});

test("rolls back a rejected optimistic unequip", async () => {
  const renderedPlayers: Player[] = [];
  const failure = new Error("Unequip rejected");
  let rejectMutation: (reason: unknown) => void = () => undefined;
  const pendingMutation = new Promise<Player>((_, reject) => {
    rejectMutation = reject;
  });

  const operation = runOptimisticLoadoutMutation({
    mutate: () => pendingMutation,
    player,
    setPlayer: (nextPlayer) => renderedPlayers.push(nextPlayer),
    update: { slotId: "hand", type: "unequip" }
  });

  assert.equal(renderedPlayers.length, 1);
  assert.equal(renderedPlayers[0]?.loadout.hand, undefined);
  assert.deepEqual(renderedPlayers[0]?.stash, [gun, knife]);

  rejectMutation(failure);

  assert.deepEqual(await operation, { error: failure, failed: true });
  assert.equal(renderedPlayers.length, 2);
  assert.strictEqual(renderedPlayers[1], player);
});
