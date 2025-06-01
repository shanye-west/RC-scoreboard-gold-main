import { useState, useMemo, useCallback } from 'react';

// Core Types
export interface HoleInfo {
  hole_number: number;
  par?: number;
  handicap?: number;
}

export interface PlayerData {
  id: number;
  name: string;
  team: 'aviator' | 'producer';
  courseHandicap: number;
}

export interface CalculatedPlayerData extends PlayerData {
  strokesReceived: number;
  handicapStrokes: number[];
}

export interface PlayerHoleResult {
  playerId: number;
  grossScore?: number;
  netScore?: number;
  receivesStrokeOnHole: boolean;
}

export interface TeamHoleResult {
  teamId: 'aviator' | 'producer';
  playerResults: PlayerHoleResult[];
  bestBallNetScore?: number;
}

export interface HoleResultDetails {
  holeNumber: number;
  holeInfo: HoleInfo;
  aviatorResult: TeamHoleResult;
  producerResult: TeamHoleResult;
  winningTeam?: 'aviator' | 'producer' | 'tie';
}

export interface MatchStatus {
  status: string;
  aviatorWins: number;
  producerWins: number;
  ties: number;
  holesPlayed: number;
  aviatorScore: number;
  producerScore: number;
}

export interface BestBallPlayerScore {
  playerId: number;
  playerName: string;
  team: 'aviator' | 'producer';
  scores: (number | null)[];
  netScores: (number | null)[];
  isBestBall: boolean[];
  handicapStrokes: number[];
}

// Hook Options
export interface UseBestBallScorecardLogicOptions {
  initialPlayers?: PlayerData[];
  initialHoles?: HoleInfo[];
  initialGrossScores?: Record<number, Record<number, number | undefined>>;
}

// Hook Return Type
export interface UseBestBallScorecardLogicReturn {
  // State Management Functions
  setPlayers: (players: PlayerData[]) => void;
  setHoles: (holes: HoleInfo[]) => void;
  updateScore: (playerId: number, holeNumber: number, grossScore: number) => void;
  clearScores: () => void;
  resetScorecard: () => void;

  // State Data
  players: PlayerData[];
  holes: HoleInfo[];
  configuredPlayers: CalculatedPlayerData[];
  playerScores: BestBallPlayerScore[];
  grossScores: Record<number, Record<number, number | undefined>>;
  detailedHoleResults: HoleResultDetails[];
  matchStatus: MatchStatus;
  isSetupComplete: boolean;

  // Team Totals
  aviatorTotals: {
    frontTotal: number;
    backTotal: number;
    total: number;
  };
  producerTotals: {
    frontTotal: number;
    backTotal: number;
    total: number;
  };
}

/**
 * Custom React hook to manage state and calculations for a 2-man Team Best Ball Scorecard.
 * Handles 2v2 match play net scoring with proper business logic separation.
 */
export function useBestBallScorecardLogic(
  options?: UseBestBallScorecardLogicOptions
): UseBestBallScorecardLogicReturn {
  // State Management
  const [playersState, setPlayersState] = useState<PlayerData[]>(options?.initialPlayers || []);
  const [holesState, setHolesState] = useState<HoleInfo[]>(options?.initialHoles || []);
  const [grossScoresState, setGrossScoresState] = useState<Record<number, Record<number, number | undefined>>>(
    options?.initialGrossScores || {}
  );

  // Setup Validation
  const isSetupComplete = useMemo(() => {
    const aviatorPlayersCount = playersState.filter(p => p.team === 'aviator').length;
    const producerPlayersCount = playersState.filter(p => p.team === 'producer').length;
    return aviatorPlayersCount === 2 && producerPlayersCount === 2 && playersState.length === 4 && holesState.length > 0;
  }, [playersState, holesState]);

  // Calculate configured players with strokes received
  const configuredPlayers = useMemo((): CalculatedPlayerData[] => {
    if (!isSetupComplete) return playersState.map(p => ({ 
      ...p, 
      strokesReceived: 0, 
      handicapStrokes: Array(holesState.length).fill(0) 
    }));

    return playersState.map(player => {
      const strokesReceived = player.courseHandicap; // Directly use courseHandicap
      const handicapStrokes = holesState.map(hole => 
        // hole.handicap is the stroke index (1-18 difficulty)
        (hole.handicap && hole.handicap <= player.courseHandicap) ? 1 : 0
      );
      
      return {
        ...player,
        strokesReceived,
        handicapStrokes,
      };
    });
  }, [playersState, holesState, isSetupComplete]);

  // State Management Functions
  const setPlayers = useCallback((newPlayers: PlayerData[]) => {
    setPlayersState(newPlayers);
    setGrossScoresState({}); // Reset scores when players change
  }, []);

  const setHoles = useCallback((newHoles: HoleInfo[]) => {
    setHolesState(newHoles);
    setGrossScoresState({}); // Reset scores when holes change
  }, []);

  const updateScore = useCallback((playerId: number, holeNumber: number, grossScore: number) => {
    if (Number.isNaN(grossScore) || grossScore < 0) {
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
    setHolesState(options?.initialHoles || []);
    setGrossScoresState({});
  }, [options]);

  // Calculate detailed hole results
  const detailedHoleResults = useMemo((): HoleResultDetails[] => {
    if (!isSetupComplete) return [];

    return holesState.map(holeInfo => {
      const currentHoleNumber = holeInfo.hole_number;
      const aviatorPlayersData = configuredPlayers.filter(p => p.team === 'aviator');
      const producerPlayersData = configuredPlayers.filter(p => p.team === 'producer');

      const calculatePlayerHoleResult = (player: CalculatedPlayerData): PlayerHoleResult => {
        const gross = grossScoresState[player.id]?.[currentHoleNumber];
        if (typeof gross !== 'number') {
          return { playerId: player.id, receivesStrokeOnHole: false };
        }
        const receivesStroke = player.handicapStrokes[currentHoleNumber - 1] > 0;
        const net = gross - (receivesStroke ? 1 : 0);
        return {
          playerId: player.id,
          grossScore: gross,
          receivesStrokeOnHole: receivesStroke,
          netScore: net,
        };
      };

      const aviatorPlayerResults = aviatorPlayersData.map(calculatePlayerHoleResult);
      const producerPlayerResults = producerPlayersData.map(calculatePlayerHoleResult);

      const getBestBallNetScore = (results: PlayerHoleResult[]): number | undefined => {
        const validNetScores = results.map(r => r.netScore).filter(s => typeof s === 'number') as number[];
        if (validNetScores.length === 0) return undefined;
        return Math.min(...validNetScores);
      };

      const aviatorBestBall = getBestBallNetScore(aviatorPlayerResults);
      const producerBestBall = getBestBallNetScore(producerPlayerResults);

      let holeWinningTeam: 'aviator' | 'producer' | 'tie' | undefined;
      if (typeof aviatorBestBall === 'number' && typeof producerBestBall === 'number') {
        if (aviatorBestBall < producerBestBall) holeWinningTeam = 'aviator';
        else if (producerBestBall < aviatorBestBall) holeWinningTeam = 'producer';
        else holeWinningTeam = 'tie';
      }

      return {
        holeNumber: currentHoleNumber,
        holeInfo,
        aviatorResult: { teamId: 'aviator', playerResults: aviatorPlayerResults, bestBallNetScore: aviatorBestBall },
        producerResult: { teamId: 'producer', playerResults: producerPlayerResults, bestBallNetScore: producerBestBall },
        winningTeam: holeWinningTeam,
      };
    });
  }, [isSetupComplete, holesState, configuredPlayers, grossScoresState]);

  // Calculate match status
  const matchStatus = useMemo((): MatchStatus => {
    if (!isSetupComplete) {
      return { status: "Setup incomplete.", aviatorWins: 0, producerWins: 0, ties: 0, holesPlayed: 0, aviatorScore: 0, producerScore: 0 };
    }

    let currentAviatorWins = 0;
    let currentProducerWins = 0;
    let currentTies = 0;
    let playedHolesCount = 0;

    detailedHoleResults.forEach(hr => {
      if (hr.winningTeam) {
        playedHolesCount += 1;
        if (hr.winningTeam === 'aviator') currentAviatorWins += 1;
        else if (hr.winningTeam === 'producer') currentProducerWins += 1;
        else if (hr.winningTeam === 'tie') currentTies += 1;
      }
    });

    let statusMessage = "";
    const diff = Math.abs(currentAviatorWins - currentProducerWins);
    const remainingHoles = holesState.length - playedHolesCount;

    if (playedHolesCount === 0) {
      statusMessage = "Match not started";
    } else if (diff > remainingHoles && playedHolesCount < holesState.length) {
      if (currentAviatorWins > currentProducerWins) statusMessage = `AVIATORS WIN ${diff} & ${remainingHoles}`;
      else statusMessage = `PRODUCERS WIN ${diff} & ${remainingHoles}`;
    } else if (playedHolesCount === holesState.length) {
      if (diff === 0) statusMessage = "MATCH TIED";
      else if (currentAviatorWins > currentProducerWins) statusMessage = `AVIATORS WIN ${diff} UP`;
      else statusMessage = `PRODUCERS WIN ${diff} UP`;
    } else {
      if (currentAviatorWins === currentProducerWins) {
        statusMessage = "MATCH EVEN";
      } else if (currentAviatorWins > currentProducerWins) {
        statusMessage = `AVIATORS UP ${diff}`;
      } else {
        statusMessage = `PRODUCERS UP ${diff}`;
      }
    }

    const totalAviatorScore = detailedHoleResults.reduce((acc, curr) => acc + (curr.aviatorResult.bestBallNetScore ?? 0), 0);
    const totalProducerScore = detailedHoleResults.reduce((acc, curr) => acc + (curr.producerResult.bestBallNetScore ?? 0), 0);

    return {
      status: statusMessage,
      aviatorWins: currentAviatorWins,
      producerWins: currentProducerWins,
      ties: currentTies,
      holesPlayed: playedHolesCount,
      aviatorScore: totalAviatorScore,
      producerScore: totalProducerScore,
    };
  }, [isSetupComplete, detailedHoleResults, holesState.length]);

  // Transform data for UI compatibility (BestBallPlayerScore format)
  const playerScores = useMemo((): BestBallPlayerScore[] => {
    return configuredPlayers.map(player => {
      const scores = holesState.map(hole => grossScoresState[player.id]?.[hole.hole_number] ?? null);
      const netScores = scores.map((gross, idx) => {
        return gross !== null ? gross - (player.handicapStrokes[idx] || 0) : null;
      });

      // Determine if this player's score is the best ball for their team on each hole
      const isBestBall = holesState.map((_, holeIdx) => {
        const holeResult = detailedHoleResults.find(hr => hr.holeNumber === holesState[holeIdx].hole_number);
        if (!holeResult) return false;
        
        const teamResult = player.team === 'aviator' ? holeResult.aviatorResult : holeResult.producerResult;
        const playerResult = teamResult.playerResults.find(pr => pr.playerId === player.id);
        return playerResult?.netScore === teamResult.bestBallNetScore;
      });

      return {
        playerId: player.id,
        playerName: player.name,
        team: player.team,
        scores,
        netScores,
        isBestBall,
        handicapStrokes: player.handicapStrokes,
      };
    });
  }, [configuredPlayers, holesState, grossScoresState, detailedHoleResults]);

  // Calculate team totals
  const aviatorTotals = useMemo(() => {
    const aviatorPlayers = playerScores.filter(p => p.team === 'aviator');
    let frontTotal = 0;
    let backTotal = 0;

    // Front nine (holes 1-9)
    for (let i = 0; i < 9; i++) {
      const bestScore = aviatorPlayers.reduce((best, player) => {
        const net = player.netScores[i];
        if (net !== null && (best === null || net < best)) {
          return net;
        }
        return best;
      }, null as number | null);
      
      if (bestScore !== null) {
        frontTotal += bestScore;
      }
    }

    // Back nine (holes 10-18)
    for (let i = 9; i < 18; i++) {
      const bestScore = aviatorPlayers.reduce((best, player) => {
        const net = player.netScores[i];
        if (net !== null && (best === null || net < best)) {
          return net;
        }
        return best;
      }, null as number | null);
      
      if (bestScore !== null) {
        backTotal += bestScore;
      }
    }

    return { frontTotal, backTotal, total: frontTotal + backTotal };
  }, [playerScores]);

  const producerTotals = useMemo(() => {
    const producerPlayers = playerScores.filter(p => p.team === 'producer');
    let frontTotal = 0;
    let backTotal = 0;

    // Front nine (holes 1-9)
    for (let i = 0; i < 9; i++) {
      const bestScore = producerPlayers.reduce((best, player) => {
        const net = player.netScores[i];
        if (net !== null && (best === null || net < best)) {
          return net;
        }
        return best;
      }, null as number | null);
      
      if (bestScore !== null) {
        frontTotal += bestScore;
      }
    }

    // Back nine (holes 10-18)
    for (let i = 9; i < 18; i++) {
      const bestScore = producerPlayers.reduce((best, player) => {
        const net = player.netScores[i];
        if (net !== null && (best === null || net < best)) {
          return net;
        }
        return best;
      }, null as number | null);
      
      if (bestScore !== null) {
        backTotal += bestScore;
      }
    }

    return { frontTotal, backTotal, total: frontTotal + backTotal };
  }, [playerScores]);

  return {
    // State Management Functions
    setPlayers,
    setHoles,
    updateScore,
    clearScores,
    resetScorecard,

    // State Data
    players: playersState,
    holes: holesState,
    configuredPlayers,
    playerScores,
    grossScores: grossScoresState,
    detailedHoleResults,
    matchStatus,
    isSetupComplete,

    // Team Totals
    aviatorTotals,
    producerTotals,
  };
}
