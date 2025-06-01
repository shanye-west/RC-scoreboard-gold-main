import { useState, useMemo, useCallback } from 'react';
import { Player } from './player-type.js';
import { CalculatedPlayerData } from './calculated-player-data-type.js';
import { HoleInfo } from './hole-info-type.js';
import { HoleResultDetails, PlayerHoleResult } from './hole-result-details-type.js';
import { MatchStatus } from './match-status-type.js';

/**
 * Default 18 holes data.
 * In a real scenario, these would be actual course handicap ratings.
 * This simplified version uses hole number as handicap rating for holes 1-18.
 */
const DEFAULT_HOLE_DATA: HoleInfo[] = Array.from({ length: 18 }, (_, i) => ({
  holeNumber: i + 1,
  handicapRating: i + 1,
}));

/**
 * Options for initializing the useScorecardLogic hook.
 * @property {Player[]} [initialPlayers] - An array of initial players for the scorecard. Must be 4 players (2 per teamId 'A' and 'B') for full functionality.
 * @property {HoleInfo[]} [initialHoleData] - An array defining the hole numbers and their handicap ratings. Defaults to 18 holes with simplified ratings.
 * @property {Record<string, Record<number, number | undefined>>} [initialGrossScores] - Initial gross scores for players.
 */
export type UseScorecardLogicOptions = {
  initialPlayers?: Player[];
  initialHoleData?: HoleInfo[];
  initialGrossScores?: Record<string, Record<number, number | undefined>>;
};

/**
 * Return value of the useScorecardLogic hook.
 * @property {function} setPlayers - Function to set/replace the list of players. Resets scores.
 *    Requires 4 players, 2 per team ('A' and 'B'), for full functionality.
 *    @param {Player[]} newPlayers - The new array of players.
 * @property {function} setHoleData - Function to set/replace the hole data (e.g., for a specific course). Resets scores.
 *    @param {HoleInfo[]} newHoleData - The new array of hole information.
 * @property {function} updatePlayerInfo - Function to update a specific player's name or course handicap.
 *    @param {string} playerId - The ID of the player to update.
 *    @param {{ name?: string; courseHandicap?: number }} data - The player data to update.
 * @property {function} updateScore - Function to record or update a player's gross score for a specific hole.
 *    @param {string} playerId - The ID of the player.
 *    @param {number} holeNumber - The hole number.
 *    @param {number} grossScore - The gross score for the player on that hole.
 * @property {function} clearScores - Function to clear all recorded gross scores, keeping players and hole data.
 * @property {function} resetScorecard - Function to reset all players, hole data, and scores to their initial or default states.
 * @property {Player[]} players - The current array of raw player data.
 * @property {CalculatedPlayerData[]} configuredPlayers - Players with their calculated net strokes received. Empty if setup is incomplete.
 * @property {HoleInfo[]} holeData - The current array of hole information (number, handicap rating).
 * @property {Record<string, Record<number, number | undefined>>} grossScores - An object storing gross scores: `grossScores[playerId][holeNumber]`.
 * @property {HoleResultDetails[]} detailedHoleResults - An array of detailed results for each hole. Empty if setup is incomplete.
 * @property {MatchStatus} matchStatus - An object representing the current overall match status.
 * @property {boolean} isSetupComplete - A boolean flag indicating if players (4) and hole data are sufficiently configured.
 * @property {number} lowestCourseHandicapPlayerValue - The course handicap of the player with the lowest handicap.
 */
export type UseScorecardLogicReturn = {
  setPlayers: (newPlayers: Player[]) => void;
  setHoleData: (newHoleData: HoleInfo[]) => void;
  updatePlayerInfo: (playerId: string, data: { name?: string; courseHandicap?: number }) => void;
  updateScore: (playerId: string, holeNumber: number, grossScore: number) => void;
  clearScores: () => void;
  resetScorecard: () => void;

  players: Player[];
  configuredPlayers: CalculatedPlayerData[];
  holeData: HoleInfo[];
  grossScores: Record<string, Record<number, number | undefined>>;
  detailedHoleResults: HoleResultDetails[];
  matchStatus: MatchStatus;
  isSetupComplete: boolean;
  lowestCourseHandicapPlayerValue: number;
};

/**
 * Custom React hook to manage state and calculations for a 2-man Team Best Ball Scorecard.
 * Handles 2v2 match play net scoring. Strokes are based on the lowest course handicap,
 * applied to holes by difficulty.
 *
 * @param {UseScorecardLogicOptions} [options] - Optional initial configuration.
 * @returns {UseScorecardLogicReturn} Object with state, data, and management functions.
 */
export function useScorecardLogic(options?: UseScorecardLogicOptions): UseScorecardLogicReturn {
  const [playersState, setPlayersState] = useState<Player[]>(options?.initialPlayers || []);
  const [holeDataState, setHoleDataState] = useState<HoleInfo[]>(options?.initialHoleData || DEFAULT_HOLE_DATA);
  const [grossScoresState, setGrossScoresState] = useState<Record<string, Record<number, number | undefined>>>(options?.initialGrossScores || {});

  const isSetupComplete = useMemo(() => {
    const teamAPlayersCount = playersState.filter(p => p.teamId === 'A').length;
    const teamBPlayersCount = playersState.filter(p => p.teamId === 'B').length;
    return teamAPlayersCount === 2 && teamBPlayersCount === 2 && playersState.length === 4 && holeDataState.length > 0;
  }, [playersState, holeDataState]);

  const lowestCourseHandicapPlayerValue = useMemo(() => {
    if (!isSetupComplete || playersState.length === 0) return 0; // Default if not setup or no players
    return Math.min(...playersState.map(p => p.courseHandicap));
  }, [playersState, isSetupComplete]);

  const configuredPlayers = useMemo((): CalculatedPlayerData[] => {
    if (!isSetupComplete) return playersState.map(p => ({ ...p, strokesReceived: 0 }));

    const lowestCh = lowestCourseHandicapPlayerValue;
    return playersState.map(p => ({
      ...p,
      strokesReceived: p.courseHandicap - lowestCh,
    }));
  }, [playersState, lowestCourseHandicapPlayerValue, isSetupComplete]);

  const setPlayers = useCallback((newPlayers: Player[]) => {
    setPlayersState(newPlayers);
    setGrossScoresState({}); // Reset scores when players are set
  }, []);

  const setHoleData = useCallback((newHoleData: HoleInfo[]) => {
    setHoleDataState(newHoleData);
    setGrossScoresState({}); // Reset scores when hole data changes
  }, []);

  const updatePlayerInfo = useCallback((playerId: string, data: { name?: string; courseHandicap?: number }) => {
    setPlayersState(prevPlayers =>
      prevPlayers.map(p =>
        p.id === playerId ? { ...p, ...data } : p
      )
    );
  }, []);

  const updateScore = useCallback((playerId: string, holeNumber: number, grossScore: number) => {
    if (Number.isNaN(grossScore) || grossScore < 0) {
        // console.warn("Invalid gross score provided.");
        return;
    }
    setGrossScoresState(prevScores => ({
      ...prevScores,
      [playerId]: {
        ...prevScores[playerId],
        [holeNumber]: grossScore,
      },
    }));
  }, []);

  const clearScores = useCallback(() => {
    setGrossScoresState({});
  }, []);

  const resetScorecard = useCallback(() => {
    setPlayersState(options?.initialPlayers || []);
    setHoleDataState(options?.initialHoleData || DEFAULT_HOLE_DATA);
    setGrossScoresState({});
  }, [options]);

  const detailedHoleResults = useMemo((): HoleResultDetails[] => {
    if (!isSetupComplete) return [];

    return holeDataState.map(hInfo => {
      const currentHoleNumber = hInfo.holeNumber;
      const teamAPlayersData = configuredPlayers.filter(p => p.teamId === 'A');
      const teamBPlayersData = configuredPlayers.filter(p => p.teamId === 'B');

      const calculatePlayerHoleResult = (player: CalculatedPlayerData): PlayerHoleResult => {
        const gross = grossScoresState[player.id]?.[currentHoleNumber];
        if (typeof gross !== 'number') {
          return { playerId: player.id, receivesStrokeOnHole: false };
        }
        const receivesStroke = player.strokesReceived >= hInfo.handicapRating;
        const net = gross - (receivesStroke ? 1 : 0);
        return {
          playerId: player.id,
          grossScore: gross,
          receivesStrokeOnHole: receivesStroke,
          netScore: net,
        };
      };

      const teamAPlayerResults = teamAPlayersData.map(calculatePlayerHoleResult);
      const teamBPlayerResults = teamBPlayersData.map(calculatePlayerHoleResult);

      const getBestBallNetScore = (results: PlayerHoleResult[]): number | undefined => {
        const validNetScores = results.map(r => r.netScore).filter(s => typeof s === 'number') as number[];
        if (validNetScores.length === 0) return undefined;
        return Math.min(...validNetScores);
      };

      const teamABestBall = getBestBallNetScore(teamAPlayerResults);
      const teamBBestBall = getBestBallNetScore(teamBPlayerResults);

      let holeWinningTeam: 'A' | 'B' | 'Tie' | undefined;
      if (typeof teamABestBall === 'number' && typeof teamBBestBall === 'number') {
        if (teamABestBall < teamBBestBall) holeWinningTeam = 'A';
        else if (teamBBestBall < teamABestBall) holeWinningTeam = 'B';
        else holeWinningTeam = 'Tie';
      }

      return {
        holeNumber: currentHoleNumber,
        holeInfo: hInfo,
        teamAResult: { teamId: 'A', playerResults: teamAPlayerResults, bestBallNetScore: teamABestBall },
        teamBResult: { teamId: 'B', playerResults: teamBPlayerResults, bestBallNetScore: teamBBestBall },
        winningTeam: holeWinningTeam,
      };
    });
  }, [isSetupComplete, holeDataState, configuredPlayers, grossScoresState]);

  const matchStatus = useMemo((): MatchStatus => {
    if (!isSetupComplete && playersState.length < 4) return { status: "Setup incomplete: Requires 4 players.", teamAWins: 0, teamBWins: 0, ties: 0, holesPlayed: 0, teamAScore: 0, teamBScore: 0 };
    if (!isSetupComplete) return { status: "Setup incomplete.", teamAWins: 0, teamBWins: 0, ties: 0, holesPlayed: 0, teamAScore: 0, teamBScore: 0 };


    let currentTeamAWins = 0;
    let currentTeamBWins = 0;
    let currentTies = 0;
    let playedHolesCount = 0;

    detailedHoleResults.forEach(hr => {
      if (hr.winningTeam) {
        playedHolesCount += 1;
        if (hr.winningTeam === 'A') currentTeamAWins += 1;
        else if (hr.winningTeam === 'B') currentTeamBWins += 1;
        else if (hr.winningTeam === 'Tie') currentTies += 1;
      }
    });

    let statusMessage = "";
    const diff = Math.abs(currentTeamAWins - currentTeamBWins);
    const remainingHoles = holeDataState.length - playedHolesCount;

    if (playedHolesCount === 0) {
      statusMessage = "Match not started";
    } else if (diff > remainingHoles && playedHolesCount < holeDataState.length) { // Match decided before all holes played
        if (currentTeamAWins > currentTeamBWins) statusMessage = `Team A wins ${diff} & ${remainingHoles}`;
        else statusMessage = `Team B wins ${diff} & ${remainingHoles}`;
    } else if (playedHolesCount === holeDataState.length) { // All holes played
        if (diff === 0) statusMessage = "Match Tied";
        else if (currentTeamAWins > currentTeamBWins) statusMessage = `Team A wins ${diff} Up`;
        else statusMessage = `Team B wins ${diff} Up`;
    } else { // Match ongoing
        if (currentTeamAWins === currentTeamBWins) {
            statusMessage = "All Square";
        } else if (currentTeamAWins > currentTeamBWins) {
            statusMessage = `Team A ${diff} Up`;
        } else {
            statusMessage = `Team B ${diff} Up`;
        }
        if (remainingHoles > 0) {
          statusMessage = `${statusMessage} with ${remainingHoles} to play`;
        }
    }

    const totalTeamAScore = detailedHoleResults.reduce((acc, curr) => acc + (curr.teamAResult.bestBallNetScore ?? 0), 0);
    const totalTeamBScore = detailedHoleResults.reduce((acc, curr) => acc + (curr.teamBResult.bestBallNetScore ?? 0), 0);

    return {
      status: statusMessage,
      teamAWins: currentTeamAWins,
      teamBWins: currentTeamBWins,
      ties: currentTies,
      holesPlayed: playedHolesCount,
      teamAScore: totalTeamAScore,
      teamBScore: totalTeamBScore,
    };
  }, [isSetupComplete, playersState.length, detailedHoleResults, holeDataState.length]);

  return {
    setPlayers,
    setHoleData,
    updatePlayerInfo,
    updateScore,
    clearScores,
    resetScorecard,

    players: playersState,
    configuredPlayers,
    holeData: holeDataState,
    grossScores: grossScoresState,
    detailedHoleResults,
    matchStatus,
    isSetupComplete,
    lowestCourseHandicapPlayerValue,
  };
}