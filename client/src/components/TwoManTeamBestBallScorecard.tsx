import React, { useEffect, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  useBestBallScorecardLogic,
  type HoleInfo,
  type PlayerData,
  type BestBallPlayerScore,
} from "../hooks/useBestBallScorecardLogic";
import { useAuth } from "../hooks/use-auth"; // Added import
import "./TwoManTeamBestBallScorecard.css";

interface RawPlayerData {
  id: number;
  name: string;
  team: 'aviator' | 'producer';
  handicapStrokes: number[];
}

export function transformRawPlayerData(
  rawPlayers: RawPlayerData[],
  holes: HoleInfo[]
): PlayerData[] {
  return rawPlayers.map((p) => ({
    id: p.id,
    name: p.name,
    team: p.team,
    courseHandicap: p.handicapStrokes ? p.handicapStrokes.reduce((a, b) => a + b, 0) : 0,
  }));
}

interface ScorecardProps {
  roundId: number;
  courseId: number;
  holes: HoleInfo[];
  playerScores?: BestBallPlayerScore[];
  players?: PlayerData[];
  locked?: boolean;
  onUpdateScores?: (playerScores: BestBallPlayerScore[]) => void;
  onPlayerHandicapChange?: (playerId: number, newHandicap: number, roundId: number, courseId: number) => void; // Added prop
}

const TwoManTeamBestBallScorecard: React.FC<ScorecardProps> = ({
  roundId,
  courseId,
  holes = [],
  players = [],
  locked = false,
  onUpdateScores,
  onPlayerHandicapChange, // Destructured prop
}) => {
  const { isAdmin } = useAuth(); // Get isAdmin status

  // Initialize the hook with provided data
  const {
    playerScores: hookPlayerScores,
    updateScore,
    updatePlayerCourseHandicap, // Get function from hook
    aviatorTotals,
    producerTotals,
    matchStatus,
    setPlayers,
    setHoles,
  } = useBestBallScorecardLogic({
    initialPlayers: players,
    initialHoles: holes,
  });

  // Update hook state when props change
  useEffect(() => {
    if (players.length > 0) {
      setPlayers(players);
    }
  }, [players, setPlayers]);

  useEffect(() => {
    if (holes.length > 0) {
      setHoles(holes);
    }
  }, [holes, setHoles]);

  // Notify parent of score changes
  useEffect(() => {
    if (onUpdateScores && hookPlayerScores.length > 0) {
      onUpdateScores(hookPlayerScores);
    }
  }, [hookPlayerScores, onUpdateScores]);

  const handleScoreChange = useCallback((playerId: number, holeIndex: number, value: string) => {
    const score = value === '' ? null : parseInt(value, 10);
    if (value === '' || (!isNaN(score!) && score! >= 1 && score! <= 15)) {
      if (score !== null) {
        updateScore(playerId, holeIndex + 1, score); // Hook expects 1-based hole numbers
      }
    }
  }, [updateScore]);

  // Split holes into front nine (1-9) and back nine (10-18)
  const frontNine = useMemo(() => holes.slice(0, 9), [holes]);
  const backNine = useMemo(() => holes.slice(9, 18), [holes]);

  const renderScoreGrid = useCallback(() => {
    // Split holes into front nine (1-9) and back nine (10-18)
    const frontNine = holes.slice(0, 9);
    const backNine = holes.slice(9, 18);

    const renderHoleHeader = (hole: HoleInfo) => (
      <th key={`hole-${hole.hole_number}`} className="hole-header">
        <div className="hole-number">{hole.hole_number}</div>
        <div className="hole-handicap">{hole.handicap}</div>
      </th>
    );

    const renderPlayerRow = (player: PlayerData, scoreData: BestBallPlayerScore | undefined) => {
      const scores = scoreData?.scores || [];
      
      return (
        <tr key={`player-${player.id}`} className="player-row">
          <td className="player-name">{player.name}</td>
          {holes.map((hole, holeIndex) => {
            const score = scores[holeIndex] || null;
            return (
              <td key={`score-${player.id}-${hole.hole_number}`} className="score-cell">
                {locked ? (
                  <span className="score-display">{score || '-'}</span>
                ) : (
                  <Input
                    type="number"
                    min="1"
                    max="15"
                    value={score || ''}
                    onChange={(e) => handleScoreChange(player.id, holeIndex, e.target.value)}
                    className="score-input"
                    placeholder="-"
                  />
                )}
              </td>
            );
          })}
          <td className="total-cell">
            {scoreData ? scoreData.scores.filter(s => s !== null).reduce((sum, s) => sum + (s || 0), 0) : 0}
          </td>
        </tr>
      );
    };

    const renderTeamBestBallRow = (teamName: string, teamTotals: { frontTotal: number; backTotal: number; total: number }) => (
      <tr key={`team-${teamName}`} className="team-row">
        <td className="team-name">{teamName} Best Ball</td>
        {holes.map((hole, holeIndex) => {
          // Get the best ball score for this hole from the team's player scores
          const teamPlayerScores = hookPlayerScores
            .filter(ps => ps.team === (teamName.toLowerCase() as 'aviator' | 'producer'))
            .map(ps => ps.scores[holeIndex])
            .filter(score => score !== null && score !== undefined) as number[];
          
          const bestScore = teamPlayerScores.length > 0 ? Math.min(...teamPlayerScores) : null;
          
          return (
            <td key={`team-${teamName}-${holeIndex}`} className="team-score-cell">
              {bestScore || '-'}
            </td>
          );
        })}
        <td className="team-total-cell">
          {teamTotals.total}
        </td>
      </tr>
    );

    const aviatorPlayers = hookPlayerScores.filter(p => p.team === 'aviator');
    const producerPlayers = hookPlayerScores.filter(p => p.team === 'producer');

    return (
      <div className="scorecard-container">
        <div className="scorecard-table-wrapper">
          <table className="scorecard-table">
            <thead>
              <tr>
                <th className="player-header">Player</th>
                {holes.map(renderHoleHeader)}
                <th className="total-header">Total</th>
              </tr>
            </thead>
            <tbody>
              {/* Aviator Team */}
              {aviatorPlayers.map(playerScore => {
                const player = players.find(p => p.id === playerScore.playerId);
                return player ? renderPlayerRow(player, playerScore) : null;
              })}
              {aviatorTotals && renderTeamBestBallRow('Aviator', aviatorTotals)}
              
              {/* Producer Team */}
              {producerPlayers.map(playerScore => {
                const player = players.find(p => p.id === playerScore.playerId);
                return player ? renderPlayerRow(player, playerScore) : null;
              })}
              {producerTotals && renderTeamBestBallRow('Producer', producerTotals)}
            </tbody>
          </table>
        </div>
        
        {matchStatus && (
          <div className="match-status">
            <h3>Match Status</h3>
            <p>{matchStatus.status}</p>
            <div className="score-details">
              <p>Aviator Score: {matchStatus.aviatorScore}</p>
              <p>Producer Score: {matchStatus.producerScore}</p>
              <p>Holes Played: {matchStatus.holesPlayed}</p>
            </div>
          </div>
        )}
      </div>
    );
  }, [holes, players, hookPlayerScores, aviatorTotals, producerTotals, matchStatus, locked, handleScoreChange]);

  return (
    <Card className="rounded-2xl shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-center">2-Man Team Best Ball Scorecard</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {hookPlayerScores.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            No players found for this match. Please add players to the match first.
          </div>
        ) : (
          renderScoreGrid()
        )}
      </CardContent>
    </Card>
  );
};

export default TwoManTeamBestBallScorecard;
