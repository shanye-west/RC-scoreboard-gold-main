import React, { useEffect, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  useBestBallScorecardLogic,
  type HoleInfo,
  type PlayerData,
  type BestBallPlayerScore,
} from "../hooks/useBestBallScorecardLogic";
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
  holes: HoleInfo[];
  playerScores?: BestBallPlayerScore[];
  players?: PlayerData[];
  locked?: boolean;
  onUpdateScores?: (playerScores: BestBallPlayerScore[]) => void;
}

const TwoManTeamBestBallScorecard: React.FC<ScorecardProps> = ({
  holes = [],
  players = [],
  locked = false,
  onUpdateScores,
}) => {
  // Initialize the hook with provided data
  const {
    playerScores: hookPlayerScores,
    updateScore,
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
    const aviatorPlayers = hookPlayerScores.filter(p => p.team === 'aviator');
    const producerPlayers = hookPlayerScores.filter(p => p.team === 'producer');

    // Helper function to render a player row
    const renderPlayerRow = (player: BestBallPlayerScore) => (
      <React.Fragment key={`player-${player.playerId}`}>
        <div className={`player-name ${player.team}`}>{player.playerName}</div>
        <div className="player-handicap">{player.handicapStrokes.reduce((a, b) => a + b, 0)}</div>
        {frontNine.map((_, holeIdx) => (
          <div key={`${player.playerId}-front-${holeIdx}`} 
               className={`score-input-cell ${player.isBestBall[holeIdx] ? 'best-score' : ''}`}>
            <Input
              type="number"
              min="1"
              max="15"
              value={player.scores[holeIdx] ?? ''}
              disabled={locked}
              onChange={(e) => handleScoreChange(player.playerId, holeIdx, e.target.value)}
              className="score-input"
            />
            {player.handicapStrokes[holeIdx] > 0 && (
              <span className="handicap-dot">•</span>
            )}
            {player.netScores[holeIdx] !== null && (
              <span className="net-score">{player.netScores[holeIdx]}</span>
            )}
          </div>
        ))}
        <div className="player-total">
          {frontNine.reduce((sum, _, i) => {
            const net = player.netScores[i];
            return sum + (net !== null ? net : 0);
          }, 0) || ''}
        </div>
        {backNine.map((_, holeIdx) => {
          const actualHoleIdx = holeIdx + 9;
          return (
            <div key={`${player.playerId}-back-${holeIdx}`} 
                 className={`score-input-cell ${player.isBestBall[actualHoleIdx] ? 'best-score' : ''}`}>
              <Input
                type="number"
                min="1"
                max="15"
                value={player.scores[actualHoleIdx] ?? ''}
                disabled={locked}
                onChange={(e) => handleScoreChange(player.playerId, actualHoleIdx, e.target.value)}
                className="score-input"
              />
              {player.handicapStrokes[actualHoleIdx] > 0 && (
                <span className="handicap-dot">•</span>
              )}
              {player.netScores[actualHoleIdx] !== null && (
                <span className="net-score">{player.netScores[actualHoleIdx]}</span>
              )}
            </div>
          );
        })}
        <div className="player-total">
          {backNine.reduce((sum, _, i) => {
            const net = player.netScores[i + 9];
            return sum + (net !== null ? net : 0);
          }, 0) || ''}
        </div>
        <div className="player-total">
          {holes.reduce((sum, _, i) => {
            const net = player.netScores[i];
            return sum + (net !== null ? net : 0);
          }, 0) || ''}
        </div>
      </React.Fragment>
    );

    // Helper function to render team total row
    const renderTeamTotalRow = (team: 'aviator' | 'producer', totals: typeof aviatorTotals) => {
      const teamPlayers = team === 'aviator' ? aviatorPlayers : producerPlayers;
      const teamClass = team === 'aviator' ? 'aviators' : 'producers';
      const teamName = team === 'aviator' ? 'THE AVIATORS' : 'THE PRODUCERS';
      
      return (
        <React.Fragment key={`team-total-${team}`}>
          <div className={`team-total ${teamClass}`}>{teamName}</div>
          <div className="empty"></div>
          {frontNine.map((_, holeIdx) => {
            const bestScore = teamPlayers.reduce((best: number | null, player: BestBallPlayerScore) => {
              const net = player.netScores[holeIdx];
              if (net !== null && (best === null || net < best)) {
                return net;
              }
              return best;
            }, null as number | null);
            return (
              <div key={`${team}-team-front-${holeIdx}`} className="team-total">
                {bestScore !== null ? bestScore : ''}
              </div>
            );
          })}
          <div className="team-total">{totals.frontTotal || ''}</div>
          {backNine.map((_, holeIdx) => {
            const actualHoleIdx = holeIdx + 9;
            const bestScore = teamPlayers.reduce((best: number | null, player: BestBallPlayerScore) => {
              const net = player.netScores[actualHoleIdx];
              if (net !== null && (best === null || net < best)) {
                return net;
              }
              return best;
            }, null as number | null);
            return (
              <div key={`${team}-team-back-${holeIdx}`} className="team-total">
                {bestScore !== null ? bestScore : ''}
              </div>
            );
          })}
          <div className="team-total">{totals.backTotal || ''}</div>
          <div className="team-total">{totals.total || ''}</div>
        </React.Fragment>
      );
    };

    // Helper function to render match status row
    const renderMatchStatusRow = () => {
      return (
        <React.Fragment key="match-status">
          <div className="match-status">{matchStatus.status}</div>
          <div className="empty match-status-bg"></div>
          {Array(frontNine.length).fill(null).map((_, i) => (
            <div key={`match-status-front-${i}`} className="empty match-status-bg"></div>
          ))}
          <div className="empty match-status-bg"></div>
          {Array(backNine.length).fill(null).map((_, i) => (
            <div key={`match-status-back-${i}`} className="empty match-status-bg"></div>
          ))}
          <div className="empty match-status-bg"></div>
          <div className="empty match-status-bg"></div>
        </React.Fragment>
      );
    };

    return (
      <div className="scorecard-container">
        <div className="scorecard-grid">
          {/* Header Row */}
          <div className="header-cell player-header">Player</div>
          <div className="header-cell handicap-header">HCP</div>
          {frontNine.map(hole => (
            <div key={`front-${hole.hole_number}`} className="header-cell hole-number">
              {hole.hole_number}
            </div>
          ))}
          <div className="header-cell total-header">OUT</div>
          {backNine.map(hole => (
            <div key={`back-${hole.hole_number}`} className="header-cell hole-number">
              {hole.hole_number}
            </div>
          ))}
          <div className="header-cell total-header">IN</div>
          <div className="header-cell total-header">TOT</div>

          {/* Par Row */}
          <div className="par-label">PAR</div>
          <div className="empty"></div>
          {frontNine.map(hole => (
            <div key={`par-front-${hole.hole_number}`} className="par-value">
              {hole.par || 4}
            </div>
          ))}
          <div className="par-value">{frontNine.reduce((sum, h) => sum + (h.par || 4), 0)}</div>
          {backNine.map(hole => (
            <div key={`par-back-${hole.hole_number}`} className="par-value">
              {hole.par || 4}
            </div>
          ))}
          <div className="par-value">{backNine.reduce((sum, h) => sum + (h.par || 4), 0)}</div>
          <div className="par-value">{holes.reduce((sum, h) => sum + (h.par || 4), 0)}</div>

          {/* Handicap Row */}
          <div className="handicap-label">HCP</div>
          <div className="empty"></div>
          {frontNine.map(hole => (
            <div key={`hcp-front-${hole.hole_number}`} className="handicap-value">
              {hole.handicap || 1}
            </div>
          ))}
          <div className="empty"></div>
          {backNine.map(hole => (
            <div key={`hcp-back-${hole.hole_number}`} className="handicap-value">
              {hole.handicap || 1}
            </div>
          ))}
          <div className="empty"></div>
          <div className="empty"></div>

          {/* Render rows in the specific order requested */}
          {aviatorPlayers.map((player) => renderPlayerRow(player))}
          {renderTeamTotalRow('aviator', aviatorTotals)}
          {renderMatchStatusRow()}
          {renderTeamTotalRow('producer', producerTotals)}
          {producerPlayers.map((player) => renderPlayerRow(player))}
        </div>
      </div>
    );
  }, [hookPlayerScores, frontNine, backNine, aviatorTotals, producerTotals, matchStatus, holes, locked, handleScoreChange]);

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
