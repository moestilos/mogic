import { describe, it, expect } from 'vitest';
import {
  createGroup,
  addProfile,
  computeStandings,
  resultFromGame,
  createGame,
  adjustLife,
  type GroupGameResult,
} from '../src/index.js';

function buildGroupAndGame() {
  let g = createGroup('Mesa de Mario');
  g = addProfile(g, { name: 'Mario', color: 'R' });
  g = addProfile(g, { name: 'Luigi', color: 'G' });
  g = addProfile(g, { name: 'Peach', color: 'W' });
  g = addProfile(g, { name: 'Bowser', color: 'B' });
  const game = createGame({
    format: 'commander',
    players: g.profiles.map((p) => ({ name: p.name, color: p.color })),
  });
  const playerToProfile: Record<string, string> = {};
  game.players.forEach((p, i) => { playerToProfile[p.id] = g.profiles[i].id; });
  return { group: g, game, playerToProfile };
}

describe('groups', () => {
  it('creates a group with profiles', () => {
    const { group } = buildGroupAndGame();
    expect(group.profiles).toHaveLength(4);
  });

  it('derives placements from elimination order', () => {
    const { group, game, playerToProfile } = buildGroupAndGame();
    // Eliminate Mario first, then Luigi, then Peach. Bowser wins.
    adjustLife(game, game.players[0].id, -40);
    adjustLife(game, game.players[1].id, -40);
    adjustLife(game, game.players[2].id, -40);
    const result = resultFromGame(group, game, playerToProfile);
    expect(result).not.toBeNull();
    const winnerProfile = group.profiles[3];
    expect(result!.placements[0].profileId).toBe(winnerProfile.id);
    expect(result!.placements[0].placement).toBe(1);
    // Peach (eliminated last) should be 2nd
    expect(result!.placements[1].profileId).toBe(group.profiles[2].id);
    // Mario (eliminated first) should be 4th (last)
    expect(result!.placements[3].profileId).toBe(group.profiles[0].id);
  });

  it('computes standings ranked by wins then winRate', () => {
    const { group } = buildGroupAndGame();
    const mockResult = (winnerIdx: number, endedAt: number): GroupGameResult => ({
      id: `r${endedAt}`,
      groupId: group.id,
      gameId: `g${endedAt}`,
      format: 'commander',
      startedAt: endedAt - 1000,
      endedAt,
      placements: group.profiles.map((p, i) => ({
        profileId: p.id,
        placement: i === winnerIdx ? 1 : i + 2,
      })),
    });
    // Bowser wins twice, Mario once, others zero
    const results = [mockResult(3, 100), mockResult(3, 200), mockResult(0, 300)];
    const standings = computeStandings(group, results);
    expect(standings[0].name).toBe('Bowser');
    expect(standings[0].wins).toBe(2);
    expect(standings[1].name).toBe('Mario');
    expect(standings[1].wins).toBe(1);
  });

  it('tracks current and best win streaks', () => {
    const { group } = buildGroupAndGame();
    const wins = (winnerIdx: number, t: number): GroupGameResult => ({
      id: `r${t}`,
      groupId: group.id,
      gameId: `g${t}`,
      format: 'commander',
      startedAt: t,
      endedAt: t + 1,
      placements: group.profiles.map((p, i) => ({
        profileId: p.id,
        placement: i === winnerIdx ? 1 : i + 2,
      })),
    });
    // Mario wins 3 in a row, then loses, then wins again
    const standings = computeStandings(group, [
      wins(0, 1), wins(0, 2), wins(0, 3), wins(1, 4), wins(0, 5),
    ]);
    const mario = standings.find((s) => s.name === 'Mario')!;
    expect(mario.currentStreak).toBe(1);
    expect(mario.bestStreak).toBe(3);
  });
});
