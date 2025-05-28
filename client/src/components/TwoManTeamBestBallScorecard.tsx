import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import "./TwoManTeamBestBallScorecard.css";

interface PlayerScore {
  playerId: number;
  playerName: string;
  team: 'aviator' | 'producer';
  scores: (number | null)[];
  netScores: (number | null)[];
  isBestBall: boolean[];
  handicapStrokes: number[];
}

interface HoleData {
  hole_number: number;
  par?: number;
  handicap?: number;
}

interface RawPlayerData {
  id: number;
  name: string;
  team: 'aviator' | 'producer';
  handicapStrokes: number[];
}

export function transformRawPlayerData(
  rawPlayers: RawPlayerData[],
  holes: HoleData[]
): PlayerScore[] {
  return rawPlayers.map((p) => ({
    playerId: p.id,
    playerName: p.name,
    team: p.team,
    scores: Array(holes.length).fill(null),
    netScores: Array(holes.length).fill(null),
    isBestBall: Array(holes.length).fill(false),
    handicapStrokes: p.handicapStrokes || Array(holes.length).fill(0),
  }));
}

interface ScorecardProps {
  holes: HoleData[];
  playerScores: PlayerScore[];
  locked?: boolean;
  onUpdateScores?: (playerScores: PlayerScore[]) => void;
}

const TwoManTeamBestBallScorecard: React.FC<ScorecardProps> = ({
  holes = [],
  playerScores = [],
  locked = false,
  onUpdateScores,
}) => {
  const [localPlayerScores, setLocalPlayerScores] = useState<PlayerScore[]>(playerScores);

  // Debug logging
  console.log('TwoManTeamBestBallScorecard received:', { holes, playerScores, locked });

  useEffect(() => {
    setLocalPlayerScores(playerScores);
  }, [playerScores]);

  useEffect(() => {
    const updatedScores = localPlayerScores.map(player => {
      const netScores = player.scores.map((gross, idx) => {
        return gross !== null ? gross - (player.handicapStrokes[idx] || 0) : null;
      });
      return { ...player, netScores };
    });

    // Determine best net per team per hole
    holes.forEach((_, holeIdx) => {
      const bestByTeam: { [team: string]: { net: number | null; index: number | null } } = {
        aviator: { net: null, index: null },
        producer: { net: null, index: null }
      };

      updatedScores.forEach((player, i) => {
        const net = player.netScores[holeIdx];
        if (net !== null) {
          const best = bestByTeam[player.team];
          if (best.net === null || net < best.net) {
            bestByTeam[player.team] = { net, index: i };
          }
        }
      });

      updatedScores.forEach((player, i) => {
        player.isBestBall[holeIdx] = bestByTeam[player.team].index === i;
      });
    });

    setLocalPlayerScores(updatedScores);
    onUpdateScores?.(updatedScores);
  }, [localPlayerScores.map(p => p.scores.join(',')).join('|'), holes, onUpdateScores]);

  const handleScoreChange = (playerIndex: number, holeIndex: number, value: string) => {
    const newScores = [...localPlayerScores];
    const score = value === '' ? null : parseInt(value, 10);
    if (value === '' || (!isNaN(score!) && score! >= 1 && score! <= 15)) {
      newScores[playerIndex].scores[holeIndex] = score;
      setLocalPlayerScores(newScores);
    }
  };

  // Split holes into front nine (1-9) and back nine (10-18)
  const frontNine = holes.slice(0, 9);
  const backNine = holes.slice(9, 18);
  
  // Calculate team totals for front nine, back nine, and total
  const calculateTeamTotals = (team: 'aviator' | 'producer') => {
    const teamPlayers = localPlayerScores.filter(p => p.team === team);
    let frontTotal = 0;
    let backTotal = 0;
    let totalHoles = 0;

    // Front nine
    for (let i = 0; i < 9; i++) {
      const bestScore = teamPlayers.reduce((best, player) => {
        const net = player.netScores[i];
        if (net !== null && (best === null || net < best)) {
          return net;
        }
        return best;
      }, null as number | null);
      
      if (bestScore !== null) {
        frontTotal += bestScore;
        totalHoles++;
      }
    }

    // Back nine
    for (let i = 9; i < 18; i++) {
      const bestScore = teamPlayers.reduce((best, player) => {
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
  };

  const aviatorTotals = calculateTeamTotals('aviator');
  const producerTotals = calculateTeamTotals('producer');

  const renderScoreGrid = () => {
    const aviatorPlayers = localPlayerScores.filter(p => p.team === 'aviator');
    const producerPlayers = localPlayerScores.filter(p => p.team === 'producer');

    // Helper function to render a player row
    const renderPlayerRow = (player: PlayerScore) => (
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
              onChange={(e) => handleScoreChange(
                localPlayerScores.findIndex(p => p.playerId === player.playerId), 
                holeIdx, 
                e.target.value
              )}
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
                onChange={(e) => handleScoreChange(
                  localPlayerScores.findIndex(p => p.playerId === player.playerId), 
                  actualHoleIdx, 
                  e.target.value
                )}
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
            const bestScore = teamPlayers.reduce((best, player) => {
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
            const bestScore = teamPlayers.reduce((best, player) => {
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
      const aviatorTotal = aviatorTotals.total || 0;
      const producerTotal = producerTotals.total || 0;
      let status = '';
      
      if (aviatorTotal === 0 && producerTotal === 0) {
        status = 'MATCH EVEN';
      } else if (aviatorTotal < producerTotal) {
        const diff = producerTotal - aviatorTotal;
        status = `AVIATORS UP ${diff}`;
      } else if (producerTotal < aviatorTotal) {
        const diff = aviatorTotal - producerTotal;
        status = `PRODUCERS UP ${diff}`;
      } else {
        status = 'MATCH EVEN';
      }

      return (
        <React.Fragment key="match-status">
          <div className="match-status">{status}</div>
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

          {/* Render rows in the specific order requested:
              1. Aviators Player 1
              2. Aviators Player 2  
              3. Aviators team score
              4. Match status
              5. Producers team score
              6. Producers Player 1
              7. Producers Player 2 */}
          
          {/* 1-2. Aviators Players */}
          {aviatorPlayers.map((player) => renderPlayerRow(player))}
          
          {/* 3. Aviators Team Score */}
          {renderTeamTotalRow('aviator', aviatorTotals)}
          
          {/* 4. Match Status */}
          {renderMatchStatusRow()}
          
          {/* 5. Producers Team Score */}
          {renderTeamTotalRow('producer', producerTotals)}
          
          {/* 6-7. Producers Players */}
          {producerPlayers.map((player) => renderPlayerRow(player))}
        </div>
      </div>
    );
  };

  return (
    <Card className="rounded-2xl shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-center">2-Man Team Best Ball Scorecard</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {localPlayerScores.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <div>No players found for this match. Please add players to the match first.</div>
            <div className="mt-4 text-sm">
              <div>DEBUG INFO:</div>
              <div>playerScores.length: {playerScores.length}</div>
              <div>localPlayerScores.length: {localPlayerScores.length}</div>
              <div>holes.length: {holes.length}</div>
              <div>playerScores: {JSON.stringify(playerScores, null, 2)}</div>
            </div>
          </div>
        ) : (
          renderScoreGrid()
        )}
      </CardContent>
    </Card>
  );
};

export default TwoManTeamBestBallScorecard;