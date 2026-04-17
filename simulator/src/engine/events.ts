/**
 * Typed game events.
 *
 * Every state mutation in the engine MUST be preceded (or accompanied) by an
 * event append. The `events` log is:
 *  - the audit trail (replayable, greppable, serializable to JSONL),
 *  - the source of truth for visualisation,
 *  - the only public output of a simulated game (engine is the private side).
 *
 * Guidelines:
 *  - Keep events small and denormalized (ids, not object refs).
 *  - One action by the player can emit many events (attack → damage → elim).
 *  - Do NOT use events to drive control flow — they are OUTPUT only.
 */

export type GameEvent =
  // Setup / structure
  | { t: number; kind: 'SETUP'; seed: number | string; nPlayers: number; bossId: string; heroes: string[]; bossHp: number }
  | { t: number; kind: 'SHUFFLE_PILE'; pile: PileName; size: number }
  | { t: number; kind: 'PILE_RESHUFFLE'; pile: PileName; size: number }
  | { t: number; kind: 'INITIAL_HAND'; seat: number; cards: string[] }

  // Turn flow
  | { t: number; kind: 'TURN_START'; turn: number; seat: number }
  | { t: number; kind: 'TURN_END'; turn: number; seat: number }
  | { t: number; kind: 'PHASE'; phase: string }

  // Hero actions
  | { t: number; kind: 'ACTION_DRAW'; seat: number; drew: string[]; reason?: string }
  | { t: number; kind: 'ACTION_EXCHANGE'; seat: number; withSeat: number; given: string[]; received: string[]; reason?: string }
  | { t: number; kind: 'ACTION_PLAY_OBJECT'; seat: number; card: string; reason?: string }
  | { t: number; kind: 'ACTION_PLAY_ACTION'; seat: number; card: string; renforts: string[]; reason?: string }
  | { t: number; kind: 'ACTION_NONE'; seat: number; reason: string }
  | { t: number; kind: 'SKIP_TURN'; seat: number; reason: string }

  // Combat primitives
  | { t: number; kind: 'ATTACK'; src: AttackSource; tgt: AttackTarget; degats: number }
  | { t: number; kind: 'DAMAGE'; sourceCardId: string; source: WoundSource; targetKind: TargetKind; targetId: string; amount: number; woundId: string }
  | { t: number; kind: 'ELIMINATE_MONSTER'; instanceId: string; cardId: string; seat: number }
  | { t: number; kind: 'HERO_DEATH'; seat: number }
  | { t: number; kind: 'BOSS_DEFEATED'; bossId: string }

  // Boss sequence
  | { t: number; kind: 'BOSS_SEQ_ICON'; icon: BossIcon }
  | { t: number; kind: 'DRAW_MENACE'; card: string; name: string; menaceType: string | undefined }
  | { t: number; kind: 'RESOLVE_MENACE'; card: string; outcome: string }
  | { t: number; kind: 'SUMMON_MONSTER'; instanceId: string; cardId: string; cardName: string; seat: number }
  | { t: number; kind: 'ATTACK_ORDER'; seat: number; instanceId: string | null } // null = empty queue
  | { t: number; kind: 'BOSS_ACTIF_TRIGGERED'; bossId: string; implemented: boolean }

  // Card movement
  | { t: number; kind: 'DRAW_CARD'; pile: PileName; card: string; toSeat?: number }
  | { t: number; kind: 'DISCARD_CARD'; pile: PileName; card: string; fromSeat?: number }

  // Choice op resolution (visible in the log)
  | { t: number; kind: 'CHOICE_MADE'; sourceCardId: string; seat: number; label: string }
  | { t: number; kind: 'MONSTER_MOVED'; instanceId: string; cardId: string; fromSeat: number; toSeat: number; position: 'head' | 'tail'; sourceCardId: string }
  | { t: number; kind: 'CAPACITE_USED'; seat: number; heroId: string }
  | { t: number; kind: 'OBJECT_USED'; seat: number; card: string; reason?: string }

  // Catch-all for things not yet coded in current jalon
  | { t: number; kind: 'WARN'; message: string }
  | { t: number; kind: 'NOT_IMPLEMENTED'; feature: string; detail?: string }

  // End of game
  | { t: number; kind: 'GAME_END'; result: 'victory' | 'defeat'; turns: number; bossHpRemaining: number; deadHeroes: number[] };

export type PileName = 'chasse' | 'menace' | 'monstre' | 'destin';
export type BossIcon = 'menace' | 'invocation' | 'attaque' | 'actif_boss' | 'destin';

export type WoundSource = 'chasse' | 'menace' | 'destin' | 'monstre' | 'boss';
export type TargetKind = 'hero' | 'monster' | 'boss';

export type AttackSource =
  | { kind: 'hero_action'; seat: number; card: string }
  | { kind: 'monster'; instanceId: string; cardId: string; seat: number }
  | { kind: 'boss'; bossId: string }
  | { kind: 'menace'; card: string }
  | { kind: 'destin'; card: string };

export type AttackTarget =
  | { kind: 'hero'; seat: number }
  | { kind: 'monster'; instanceId: string; seat: number }
  | { kind: 'boss' };
