import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { useBestBallScorecardLogic } from '../hooks/useBestBallScorecardLogic';

// Mock data for testing
const mockHoles = [
  { id: 1, hole_number: 1, par: 4, handicap: 10 },
  { id: 2, hole_number: 2, par: 3, handicap: 18 },
  { id: 3, hole_number: 3, par: 5, handicap: 2 }
];

const mockPlayers = [
  { id: 1, name: 'John Doe', team: 'aviator' as const, courseHandicap: 10 },
  { id: 2, name: 'Jane Smith', team: 'aviator' as const, courseHandicap: 8 },
  { id: 3, name: 'Bob Wilson', team: 'producer' as const, courseHandicap: 12 },
  { id: 4, name: 'Alice Brown', team: 'producer' as const, courseHandicap: 6 }
];

describe('useBestBallScorecardLogic', () => {
  const defaultProps = {
    initialPlayers: mockPlayers,
    holes: mockHoles,
    roundId: 1,
    courseId: 1
  };

  beforeEach(() => {
    // Reset any mocks or global state before each test
  });

  describe('initialization', () => {
    it('should initialize with empty player scores', () => {
      const { result } = renderHook(() => useBestBallScorecardLogic(defaultProps));
      
      expect(result.current.playerScores).toEqual([]);
      expect(result.current.teamScores.aviator).toEqual([]);
      expect(result.current.teamScores.producer).toEqual([]);
    });

    it('should separate players by team correctly', () => {
      const { result } = renderHook(() => useBestBallScorecardLogic(defaultProps));
      
      expect(result.current.aviatorPlayers).toHaveLength(2);
      expect(result.current.producerPlayers).toHaveLength(2);
      expect(result.current.aviatorPlayers[0].name).toBe('John Doe');
      expect(result.current.producerPlayers[0].name).toBe('Bob Wilson');
    });
  });

  describe('setup completion', () => {
    it('should reflect setup status based on players and holes', () => {
      const { result } = renderHook(() =>
        useBestBallScorecardLogic({ roundId: 1, courseId: 1 })
      );

      // No players or holes initially
      expect(result.current.isSetupComplete).toBe(false);

      act(() => {
        result.current.setPlayers(mockPlayers);
      });
      // Still false because holes are missing
      expect(result.current.isSetupComplete).toBe(false);

      act(() => {
        result.current.setHoles(mockHoles);
      });
      expect(result.current.isSetupComplete).toBe(true);

      act(() => {
        result.current.setPlayers(mockPlayers.slice(0, 3));
      });
      // Missing one player so setup incomplete
      expect(result.current.isSetupComplete).toBe(false);

      act(() => {
        result.current.setPlayers(mockPlayers);
      });
      expect(result.current.isSetupComplete).toBe(true);
    });
  });

  describe('score management', () => {
    it('should update player score correctly', async () => {
      const { result } = renderHook(() => useBestBallScorecardLogic(defaultProps));
      
      await act(async () => {
        await result.current.updatePlayerScore(1, 1, 4); // Player 1, Hole 1, Score 4
      });

      const playerScore = result.current.playerScores.find(
        score => score.playerId === 1 && score.holeNumber === 1
      );
      expect(playerScore?.grossScore).toBe(4);
    });

    it('should calculate net score with handicap strokes', () => {
      const { result } = renderHook(() => useBestBallScorecardLogic(defaultProps));
      
      const netScore = result.current.calculateNetScore(5, 1, 10); // Gross 5, Hole 1, Handicap 10
      // Hole 1 has handicap 10, so it gets 1 stroke for a 10 handicap player
      expect(netScore).toBe(4);
    });

    it('should calculate player total correctly', async () => {
      const { result } = renderHook(() => useBestBallScorecardLogic(defaultProps));
      
      // Add scores for player 1 on all holes
      await act(async () => {
        await result.current.updatePlayerScore(1, 1, 4);
        await result.current.updatePlayerScore(1, 2, 3);
        await result.current.updatePlayerScore(1, 3, 6);
      });

      const total = result.current.getPlayerTotal(1);
      expect(total).toBe(13);
    });
  });

  describe('team best ball calculation', () => {
    it('should calculate team best ball score for a hole', async () => {
      const { result } = renderHook(() => useBestBallScorecardLogic(defaultProps));
      
      // Add scores for aviator team players on hole 1
      await act(async () => {
        await result.current.updatePlayerScore(1, 1, 4); // John: 4
        await result.current.updatePlayerScore(2, 1, 5); // Jane: 5
      });

      const bestBallScore = result.current.getTeamBestBallScore('aviator', 1);
      expect(bestBallScore).toBe(4); // Best score is 4
    });

    it('should return undefined when no scores exist for team/hole', () => {
      const { result } = renderHook(() => useBestBallScorecardLogic(defaultProps));
      
      const bestBallScore = result.current.getTeamBestBallScore('aviator', 1);
      expect(bestBallScore).toBeUndefined();
    });
  });

  describe('match status calculation', () => {
    it('should calculate holes played correctly', async () => {
      const { result } = renderHook(() => useBestBallScorecardLogic(defaultProps));
      
      // Add scores for both teams on hole 1
      await act(async () => {
        await result.current.updatePlayerScore(1, 1, 4); // Aviator
        await result.current.updatePlayerScore(2, 1, 5); // Aviator
        await result.current.updatePlayerScore(3, 1, 4); // Producer
        await result.current.updatePlayerScore(4, 1, 6); // Producer
      });

      const matchStatus = result.current.getMatchStatus();
      expect(matchStatus.holesPlayed).toBe(1);
    });

    it('should identify leading team correctly', async () => {
      const { result } = renderHook(() => useBestBallScorecardLogic(defaultProps));
      
      // Aviators win hole 1: 4 vs 5
      await act(async () => {
        await result.current.updatePlayerScore(1, 1, 4); // Aviator best
        await result.current.updatePlayerScore(2, 1, 5); // Aviator
        await result.current.updatePlayerScore(3, 1, 5); // Producer best
        await result.current.updatePlayerScore(4, 1, 6); // Producer
      });

      const matchStatus = result.current.getMatchStatus();
      expect(matchStatus.leadingTeam).toBe('aviator');
      expect(matchStatus.holesUp).toBe(1);
    });
  });

  describe('helper functions', () => {
    it('should identify best scores correctly', async () => {
      const { result } = renderHook(() => useBestBallScorecardLogic(defaultProps));
      
      await act(async () => {
        await result.current.updatePlayerScore(1, 1, 4);
        await result.current.updatePlayerScore(2, 1, 5);
      });

      const isBestScore1 = result.current.isBestScoreForTeam(1, 1);
      const isBestScore2 = result.current.isBestScoreForTeam(2, 1);
      
      expect(isBestScore1).toBe(true);  // Score 4 is best
      expect(isBestScore2).toBe(false); // Score 5 is not best
    });

    it('should get handicap strokes correctly', () => {
      const { result } = renderHook(() => useBestBallScorecardLogic(defaultProps));
      
      // Player with handicap 10 should get 1 stroke on hole with handicap 10
      const strokes = result.current.getHandicapStrokes(1, 10);
      expect(strokes).toBe(1);
      
      // Player with handicap 10 should get 0 strokes on hole with handicap 18
      const strokes2 = result.current.getHandicapStrokes(2, 10);
      expect(strokes2).toBe(0);
    });
  });
});
