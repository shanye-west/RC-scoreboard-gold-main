import React, { useState, useMemo, useEffect } from 'react';
import classNames from 'classnames';
import { ThemeToggler } from '@shanyewest/best-ball-scorecard.actions.theme-toggler';
import {
  useScorecardLogic,
  type Player as LogicPlayerType,
  type HoleInfo,
  type MatchStatus,
  type CalculatedPlayerData,
  type HoleResultDetails,
  type UseScorecardLogicOptions,
} from '@shanyewest/golf-scorecard.hooks.use-scorecard-logic';
import { PlayerInput, type Player as PlayerInputPlayerType } from '@shanyewest/golf-scorecard.ui.player-input';
import { HoleScoreInput, type PlayerInfo as HoleScorePlayerInfo } from '@shanyewest/golf-scorecard.ui.hole-score-input';
import { ScoreTable, type ScoreTableHoleType, type ScoreTablePlayerType, type ScoreTableTeamType } from '@shanyewest/golf-scorecard.ui.score-table';
import { ScoreSummary, type ScoreSummaryTeamInfoType } from '@shanyewest/golf-scorecard.ui.score-summary';

import styles from './golf-scorecard.module.scss';

const defaultHoles: HoleInfo[] = [
  { holeNumber: 1, handicapRating: 7 }, { holeNumber: 2, handicapRating: 13 }, { holeNumber: 3, handicapRating: 1 },
  { holeNumber: 4, handicapRating: 15 }, { holeNumber: 5, handicapRating: 5 }, { holeNumber: 6, handicapRating: 11 },
  { holeNumber: 7, handicapRating: 3 }, { holeNumber: 8, handicapRating: 17 }, { holeNumber: 9, handicapRating: 9 },
  { holeNumber: 10, handicapRating: 8 }, { holeNumber: 11, handicapRating: 14 }, { holeNumber: 12, handicapRating: 2 },
  { holeNumber: 13, handicapRating: 16 }, { holeNumber: 14, handicapRating: 6 }, { holeNumber: 15, handicapRating: 12 },
  { holeNumber: 16, handicapRating: 4 }, { holeNumber: 17, handicapRating: 18 }, { holeNumber: 18, handicapRating: 10 },
];

const APP_TITLE = '2-Man Best Ball Scorecard';

interface ExpectedUseScorecardLogicReturn {
  configuredPlayers: CalculatedPlayerData[];
  detailedHoleResults: HoleResultDetails[];
  matchStatus: MatchStatus;
  setPlayers: (players: LogicPlayerType[]) => void;
  updateScore: (playerId: string, holeNumber: number, score: number) => void;
}

export function GolfScorecard() {
  const [playersFromInput, setPlayersFromInput] = useState<PlayerInputPlayerType[]>([]);
  const [currentHole, setCurrentHole] = useState<number>(1);

  const logicPlayers: LogicPlayerType[] = useMemo(() => {
    return playersFromInput
      .filter(p => p.name && !Number.isNaN(p.handicap) && p.handicap >= 0)
      .map((p, index) => ({
        id: p.id,
        name: p.name,
        courseHandicap: p.handicap,
        teamId: index < 2 ? 'A' : 'B',
      }));
  }, [playersFromInput]);

  const {
    configuredPlayers,
    detailedHoleResults,
    matchStatus,
    setPlayers: setLogicPlayers,
    updateScore,
  } = useScorecardLogic({
    initialHoleData: defaultHoles,
  } as UseScorecardLogicOptions) as ExpectedUseScorecardLogicReturn;

  useEffect(() => {
    if (logicPlayers.length === 4) {
      setLogicPlayers(logicPlayers);
    } else {
      // If not 4 valid players, clear players in the hook to reset logic
      setLogicPlayers([]);
    }
  }, [logicPlayers, setLogicPlayers]);
  
  const isGameSetup = useMemo(() => 
    configuredPlayers.length === 4 && configuredPlayers.every(p => p.name && typeof p.courseHandicap === 'number' && !Number.isNaN(p.courseHandicap)),
  [configuredPlayers]);

  const handlePlayersChange = (newPlayers: PlayerInputPlayerType[]) => {
    setPlayersFromInput(newPlayers);
  };

  const handleScoreChangeHoleInput = (playerId: string, score: number) => {
    updateScore(playerId, currentHole, Number.isNaN(score) ? 0 : score);
  };

  const handlePreviousHole = () => {
    setCurrentHole(prev => Math.max(1, prev - 1));
  };

  const handleNextHole = () => {
    setCurrentHole(prev => Math.min(defaultHoles.length, prev + 1));
  };

  // Data for HoleScoreInput
  const holeScoreInputPlayers: HoleScorePlayerInfo[] = useMemo(() => {
    return configuredPlayers.map(p => ({ id: p.id, name: p.name }));
  }, [configuredPlayers]);

  const currentHoleScores: { [playerId: string]: number } = useMemo(() => {
    const scores: { [playerId: string]: number } = {};
    if (!isGameSetup) return scores;

    const currentHoleDetail = detailedHoleResults.find(hr => hr.holeNumber === currentHole);
    configuredPlayers.forEach(player => {
      let scoreVal: number | undefined;
      if (currentHoleDetail) {
        const teamAResult = currentHoleDetail.teamAResult.playerResults.find(pr => pr.playerId === player.id);
        if (teamAResult) scoreVal = teamAResult.grossScore;
        
        if (scoreVal === undefined) {
          const teamBResult = currentHoleDetail.teamBResult.playerResults.find(pr => pr.playerId === player.id);
          if (teamBResult) scoreVal = teamBResult.grossScore;
        }
      }
      scores[player.id] = scoreVal === undefined || Number.isNaN(scoreVal) ? NaN : scoreVal;
    });
    return scores;
  }, [currentHole, configuredPlayers, detailedHoleResults, isGameSetup]);

  // Data for ScoreTable
  const scoreTableHoles: ScoreTableHoleType[] = useMemo(() => {
    return defaultHoles.map(h => ({
      holeNumber: h.holeNumber,
      strokeIndex: h.handicapRating,
      // par: h.par, // If par was included in HoleInfo
    }));
  }, []);

  const scoreTablePlayers: ScoreTablePlayerType[] = useMemo(() => {
    if (!isGameSetup) return [];
    return configuredPlayers.map(player => ({
      id: player.id,
      name: player.name,
      teamId: player.teamId,
      courseHandicap: player.courseHandicap,
      holeScores: defaultHoles.map(h => {
        const holeDetail = detailedHoleResults.find(hr => hr.holeNumber === h.holeNumber);
        let gross: number | null = null;
        if (holeDetail) {
          const pResultA = holeDetail.teamAResult.playerResults.find(pr => pr.playerId === player.id);
          if (pResultA && pResultA.grossScore !== undefined) gross = pResultA.grossScore;
          else {
            const pResultB = holeDetail.teamBResult.playerResults.find(pr => pr.playerId === player.id);
            if (pResultB && pResultB.grossScore !== undefined) gross = pResultB.grossScore;
          }
        }
        return { gross };
      }),
    }));
  }, [configuredPlayers, detailedHoleResults, isGameSetup]);

  const scoreTableTeams: ScoreTableTeamType[] = useMemo(() => {
    if (!isGameSetup) return [];
    return [
      { id: 'A', name: 'Team A', playerIds: configuredPlayers.filter(p => p.teamId === 'A').map(p => p.id) },
      { id: 'B', name: 'Team B', playerIds: configuredPlayers.filter(p => p.teamId === 'B').map(p => p.id) },
    ];
  }, [configuredPlayers, isGameSetup]);

  // Data for ScoreSummary
  const getTeamScoreDisplay = (
    teamId: 'A' | 'B',
    status: MatchStatus
  ): string => {
    const isTeamA = teamId === 'A';
    const wins = isTeamA ? status.teamAWins : status.teamBWins;
    const opponentWins = isTeamA ? status.teamBWins : status.teamAWins;
    const diff = Math.abs(wins - opponentWins);
  
    if (status.status.includes(`Team ${teamId} wins`)) return 'Won';
    if (status.status.includes(`Team ${teamId === 'A' ? 'B' : 'A'} wins`)) return 'Lost';
    if (status.status.includes('Match Halved') || status.status.includes('All Square')) return 'AS';
  
    if (wins > opponentWins) return `${diff} Up`;
    if (opponentWins > wins) return `${diff} Down`;
    return 'AS';
  };

  const summaryTeamA: ScoreSummaryTeamInfoType = useMemo(() => ({
    name: 'Team A',
    players: configuredPlayers.filter(p => p.teamId === 'A').map(p => p.name),
    score: getTeamScoreDisplay('A', matchStatus),
    isWinner: matchStatus.status.includes('Team A wins'),
  }), [configuredPlayers, matchStatus]);

  const summaryTeamB: ScoreSummaryTeamInfoType = useMemo(() => ({
    name: 'Team B',
    players: configuredPlayers.filter(p => p.teamId === 'B').map(p => p.name),
    score: getTeamScoreDisplay('B', matchStatus),
    isWinner: matchStatus.status.includes('Team B wins'),
  }), [configuredPlayers, matchStatus]);


  return (
    <div className={styles.golfScorecardApp}>
      <header className={styles.appHeader}>
        <h1 className={styles.appTitle}>{APP_TITLE}</h1>
        <ThemeToggler />
      </header>

      <main className={styles.contentWrapper}>
        <section className={classNames(styles.section, styles.playerSetupSection)}>
          <h2 className={styles.sectionTitle}>Player Setup (2 vs 2)</h2>
          <PlayerInput
            initialPlayers={playersFromInput}
            onPlayersChange={handlePlayersChange}
            maxPlayers={4}
            minPlayers={4} 
          />
        </section>

        {isGameSetup ? (
          <>
            <section className={classNames(styles.section, styles.scoreEntrySection)}>
              <h2 className={styles.sectionTitle}>Hole Score Entry</h2>
              <HoleScoreInput
                holeNumber={currentHole}
                players={holeScoreInputPlayers}
                scores={currentHoleScores}
                onScoreChange={handleScoreChangeHoleInput}
                onPreviousHole={handlePreviousHole}
                onNextHole={handleNextHole}
                minScore={1}
                maxScore={20} // Allow for higher scores
              />
            </section>

            <section className={classNames(styles.section, styles.summarySection)}>
              <h2 className={styles.sectionTitle}>Match Summary</h2>
              <ScoreSummary
                teamA={summaryTeamA}
                teamB={summaryTeamB}
                matchConclusion={matchStatus.status || 'Match in progress...'}
                title="Current Match Status"
              />
            </section>
            
            <section className={classNames(styles.section, styles.scoreDisplaySection)}>
              <h2 className={styles.sectionTitle}>Full Scorecard</h2>
              <ScoreTable
                title="Detailed Scores"
                holes={scoreTableHoles}
                players={scoreTablePlayers}
                teams={scoreTableTeams}
              />
            </section>
          </>
        ) : (
          <div className={styles.setupInstructions}>
            <p>Please enter names and course handicaps for all 4 players to begin scoring.</p>
          </div>
        )}
      </main>
    </div>
  );
}