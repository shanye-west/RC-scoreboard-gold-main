import { renderHook, act } from '@testing-library/react';
import { useScorecardLogic } from './use-scorecard-logic.js';
import type { Player } from './player-type.js';
import type { HoleInfo } from './hole-info-type.js';

const mockPlayers: Player[] = [
  { id: 'p1', name: 'Player A1', courseHandicap: 10, teamId: 'A' },
  { id: 'p2', name: 'Player A2', courseHandicap: 15, teamId: 'A' },
  { id: 'p3', name: 'Player B1', courseHandicap: 8, teamId: 'B' },
  { id: 'p4', name: 'Player B2', courseHandicap: 12, teamId: 'B' },
];

const mockHoleData: HoleInfo[] = [
  { holeNumber: 1, handicapRating: 1 }, // Hardest hole
  { holeNumber: 2, handicapRating: 3 },
  { holeNumber: 3, handicapRating: 2 },
];

describe('useScorecardLogic', () => {
  it('should initialize with default values and correctly calculate setup status', () => {
    const { result } = renderHook(() => useScorecardLogic());

    expect(result.current.isSetupComplete).toBe(false);
    expect(result.current.players.length).toBe(0);
    expect(result.current.holeData.length).toBe(18); // Default hole data
    expect(result.current.lowestCourseHandicapPlayerValue).toBe(0);

    act(() => {
      result.current.setPlayers(mockPlayers);
      result.current.setHoleData(mockHoleData);
    });

    expect(result.current.isSetupComplete).toBe(true);
    expect(result.current.lowestCourseHandicapPlayerValue).toBe(8); // Player B1 has 8
  });

  it('should correctly update scores and calculate detailed hole results', () => {
    const { result } = renderHook(() => useScorecardLogic({
        initialPlayers: mockPlayers,
        initialHoleData: mockHoleData,
      }));

    // Update scores for hole 1
    act(() => {
      result.current.updateScore('p1', 1, 5); // Team A Player 1: Gross 5
      result.current.updateScore('p2', 1, 6); // Team A Player 2: Gross 6
      result.current.updateScore('p3', 1, 4); // Team B Player 1: Gross 4
      result.current.updateScore('p4', 1, 7); // Team B Player 2: Gross 7
    });

    // Check calculated player data
    const p1Configured = result.current.configuredPlayers.find(p => p.id === 'p1'); // CH 10, lowest CH 8 => 2 strokes
    const p2Configured = result.current.configuredPlayers.find(p => p.id === 'p2'); // CH 15, lowest CH 8 => 7 strokes
    const p3Configured = result.current.configuredPlayers.find(p => p.id === 'p3'); // CH 8, lowest CH 8 => 0 strokes
    const p4Configured = result.current.configuredPlayers.find(p => p.id === 'p4'); // CH 12, lowest CH 8 => 4 strokes

    expect(p1Configured?.strokesReceived).toBe(2);
    expect(p3Configured?.strokesReceived).toBe(0);

    // Check hole 1 results
    const hole1Result = result.current.detailedHoleResults.find(h => h.holeNumber === 1);
    expect(hole1Result).toBeDefined();
    if (hole1Result) {
      // Handicap rating for hole 1 is 1
      // Player 1 (strokesReceived 2) gets stroke on hole 1 -> net 5 - 1 = 4
      // Player 2 (strokesReceived 7) gets stroke on hole 1 -> net 6 - 1 = 5
      // Team A Best Ball Net: 4
      expect(hole1Result.teamAResult.bestBallNetScore).toBe(4);

      // Player 3 (strokesReceived 0) gets no stroke on hole 1 -> net 4 - 0 = 4
      // Player 4 (strokesReceived 4) gets stroke on hole 1 -> net 7 - 1 = 6
      // Team B Best Ball Net: 4
      expect(hole1Result.teamBResult.bestBallNetScore).toBe(4);
      expect(hole1Result.winningTeam).toBe('Tie');
    }
  });

  it('should correctly calculate match status (holes won, ties, status message)', () => {
    const { result } = renderHook(() => useScorecardLogic({
        initialPlayers: mockPlayers,
        initialHoleData: mockHoleData, // 3 holes
      }));

    // Hole 1: Team A: Best 4, Team B: Best 5 => Team A wins
    act(() => {
      result.current.updateScore('p1', 1, 5); // p1 gross 5, net 4 (5 - 1 stroke)
      result.current.updateScore('p2', 1, 6); // p2 gross 6, net 5 (6 - 1 stroke)
      result.current.updateScore('p3', 1, 6); // p3 gross 6, net 6 (6 - 0 strokes)
      result.current.updateScore('p4', 1, 7); // p4 gross 7, net 6 (7 - 1 stroke)
    });

    expect(result.current.matchStatus.teamAWins).toBe(1);
    expect(result.current.matchStatus.teamBWins).toBe(0);
    expect(result.current.matchStatus.ties).toBe(0);
    expect(result.current.matchStatus.holesPlayed).toBe(1);
    expect(result.current.matchStatus.status).toBe('Team A 1 Up with 2 to play');

    // Hole 2: Team A: Best 6, Team B: Best 5 => Team B wins
    act(() => {
      result.current.updateScore('p1', 2, 7); // p1 gross 7, net 6 (7 - 1 stroke)
      result.current.updateScore('p2', 2, 8); // p2 gross 8, net 7 (8 - 1 stroke)
      result.current.updateScore('p3', 2, 5); // p3 gross 5, net 5 (5 - 0 strokes)
      result.current.updateScore('p4', 2, 6); // p4 gross 6, net 5 (6 - 1 stroke)
    });

    expect(result.current.matchStatus.teamAWins).toBe(1);
    expect(result.current.matchStatus.teamBWins).toBe(1);
    expect(result.current.matchStatus.ties).toBe(0);
    expect(result.current.matchStatus.holesPlayed).toBe(2);
    expect(result.current.matchStatus.status).toBe('All Square with 1 to play');
  });
});