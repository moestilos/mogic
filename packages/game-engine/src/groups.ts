import type { GameSnapshot, ManaColor } from './types.js';

/** Persistent player profile inside a personal group/league. */
export interface GroupProfile {
  id: string;
  name: string;
  color: ManaColor;
  avatar?: string;
  /** ms epoch */
  createdAt: number;
}

export interface Group {
  id: string;
  name: string;
  emoji?: string;
  profiles: GroupProfile[];
  createdAt: number;
}

/** A finished game's result anchored to a group (final standings). */
export interface GroupGameResult {
  id: string;
  groupId: string;
  gameId: string;
  format: string;
  startedAt: number;
  endedAt: number;
  /** Ordered from winner (placement 1) to first-out (placement N). */
  placements: { profileId: string; placement: number }[];
}

/** Aggregated standing per profile across all group games. */
export interface Standing {
  profileId: string;
  name: string;
  color: ManaColor;
  games: number;
  wins: number;
  podiums: number; // top 2 in 3-4P, top 1 in 2P — simplified: placement === 1 here
  avgPlacement: number;
  winRate: number; // 0..1
  currentStreak: number; // wins in a row, 0 if last game not a win
  bestStreak: number;
  lastPlayedAt?: number;
}

const uid = (): string =>
  globalThis.crypto?.randomUUID?.() ??
  `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

export function createGroup(name: string, emoji?: string, now: number = Date.now()): Group {
  return { id: uid(), name, emoji, profiles: [], createdAt: now };
}

export function addProfile(
  group: Group,
  input: { name: string; color: ManaColor; avatar?: string },
  now: number = Date.now(),
): Group {
  return {
    ...group,
    profiles: [
      ...group.profiles,
      { id: uid(), createdAt: now, ...input },
    ],
  };
}

export function removeProfile(group: Group, profileId: string): Group {
  return { ...group, profiles: group.profiles.filter((p) => p.id !== profileId) };
}

export function renameProfile(group: Group, profileId: string, name: string): Group {
  return {
    ...group,
    profiles: group.profiles.map((p) => (p.id === profileId ? { ...p, name } : p)),
  };
}

/**
 * Derive a GroupGameResult from a finished GameSnapshot.
 * Requires that each game player.id maps to a group profile id (set at game creation).
 * Placement: winner=1, then by reverse elimination order (latest eliminated = better placement).
 */
export function resultFromGame(
  group: Group,
  game: GameSnapshot,
  playerToProfile: Record<string, string>,
): GroupGameResult | null {
  if (!game.endedAt || !game.winnerId) return null;

  // Build elimination order from event log
  const elimOrder: string[] = [];
  for (const ev of game.events) {
    if (ev.t === 'eliminate' && !elimOrder.includes(ev.pid)) elimOrder.push(ev.pid);
  }
  // Reverse: last eliminated = better placement
  const reverseElim = [...elimOrder].reverse();
  const winner = game.winnerId;
  const ordered = [winner, ...reverseElim.filter((id) => id !== winner)];

  // Any players who never eliminated (shouldn't happen but safety)
  for (const p of game.players) {
    if (!ordered.includes(p.id)) ordered.push(p.id);
  }

  const placements = ordered
    .map((pid, idx) => {
      const profileId = playerToProfile[pid];
      if (!profileId) return null;
      return { profileId, placement: idx + 1 };
    })
    .filter((x): x is { profileId: string; placement: number } => x !== null);

  return {
    id: uid(),
    groupId: group.id,
    gameId: game.id,
    format: game.format,
    startedAt: game.startedAt,
    endedAt: game.endedAt,
    placements,
  };
}

export function computeStandings(group: Group, results: GroupGameResult[]): Standing[] {
  const stats = new Map<string, {
    games: number;
    wins: number;
    placementSum: number;
    lastPlayedAt?: number;
    history: { won: boolean; at: number }[];
  }>();

  for (const profile of group.profiles) {
    stats.set(profile.id, { games: 0, wins: 0, placementSum: 0, history: [] });
  }

  const sortedResults = [...results].sort((a, b) => a.endedAt - b.endedAt);
  for (const r of sortedResults) {
    for (const p of r.placements) {
      const s = stats.get(p.profileId);
      if (!s) continue;
      s.games += 1;
      s.placementSum += p.placement;
      s.lastPlayedAt = r.endedAt;
      const won = p.placement === 1;
      if (won) s.wins += 1;
      s.history.push({ won, at: r.endedAt });
    }
  }

  return group.profiles.map((profile) => {
    const s = stats.get(profile.id)!;
    let currentStreak = 0;
    for (let i = s.history.length - 1; i >= 0; i--) {
      if (s.history[i].won) currentStreak += 1;
      else break;
    }
    let bestStreak = 0;
    let run = 0;
    for (const h of s.history) {
      if (h.won) {
        run += 1;
        if (run > bestStreak) bestStreak = run;
      } else run = 0;
    }
    return {
      profileId: profile.id,
      name: profile.name,
      color: profile.color,
      games: s.games,
      wins: s.wins,
      podiums: s.wins, // alias for MVP — refine later by formato
      avgPlacement: s.games > 0 ? s.placementSum / s.games : 0,
      winRate: s.games > 0 ? s.wins / s.games : 0,
      currentStreak,
      bestStreak,
      lastPlayedAt: s.lastPlayedAt,
    };
  }).sort((a, b) => {
    if (b.wins !== a.wins) return b.wins - a.wins;
    if (b.winRate !== a.winRate) return b.winRate - a.winRate;
    return a.avgPlacement - b.avgPlacement;
  });
}
