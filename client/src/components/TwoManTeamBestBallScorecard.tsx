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

          {/* Aviator Team Header */}
          <div className="team-header aviators">THE AVIATORS</div>
          <div className="empty aviator-bg"></div>
          <div className="empty aviator-bg"></div>
          <div className="empty aviator-bg"></div>
          <div className="empty aviator-bg"></div>
          <div className="empty aviator-bg"></div>
          <div className="empty aviator-bg"></div>
          <div className="empty aviator-bg"></div>
          <div className="empty aviator-bg"></div>
          <div className="empty aviator-bg"></div>
          <div className="empty aviator-bg"></div>
          <div className="empty aviator-bg"></div>
          <div className="empty aviator-bg"></div>
          <div className="empty aviator-bg"></div>
          <div className="empty aviator-bg"></div>
          <div className="empty aviator-bg"></div>
          <div className="empty aviator-bg"></div>
          <div className="empty aviator-bg"></div>
          <div className="empty aviator-bg"></div>
          <div className="empty aviator-bg"></div>

          {/* Aviator Players */}
          {aviatorPlayers.map((player, playerIdx) => (
            <React.Fragment key={`aviator-${player.playerId}`}>
              <div className="player-name aviator">{player.playerName}</div>
              <div className="player-handicap">{player.handicapStrokes.reduce((a, b) => a + b, 0)}</div>
              {frontNine.map((_, holeIdx) => (
                <div key={`aviator-${player.playerId}-front-${holeIdx}`} 
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
                  <div key={`aviator-${player.playerId}-back-${holeIdx}`} 
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
          ))}

          {/* Aviator Team Total */}
          <div className="team-total aviators">TEAM TOTAL</div>
          <div className="empty"></div>
          {frontNine.map((_, holeIdx) => {
            const bestScore = aviatorPlayers.reduce((best, player) => {
              const net = player.netScores[holeIdx];
              if (net !== null && (best === null || net < best)) {
                return net;
              }
              return best;
            }, null as number | null);
            return (
              <div key={`aviator-team-front-${holeIdx}`} className="team-total">
                {bestScore !== null ? bestScore : ''}
              </div>
            );
          })}
          <div className="team-total">{aviatorTotals.frontTotal || ''}</div>
          {backNine.map((_, holeIdx) => {
            const actualHoleIdx = holeIdx + 9;
            const bestScore = aviatorPlayers.reduce((best, player) => {
              const net = player.netScores[actualHoleIdx];
              if (net !== null && (best === null || net < best)) {
                return net;
              }
              return best;
            }, null as number | null);
            return (
              <div key={`aviator-team-back-${holeIdx}`} className="team-total">
                {bestScore !== null ? bestScore : ''}
              </div>
            );
          })}
          <div className="team-total">{aviatorTotals.backTotal || ''}</div>
          <div className="team-total">{aviatorTotals.total || ''}</div>

          {/* Producer Team Header */}
          <div className="team-header producers">THE PRODUCERS</div>
          <div className="empty producer-bg"></div>
          <div className="empty producer-bg"></div>
          <div className="empty producer-bg"></div>
          <div className="empty producer-bg"></div>
          <div className="empty producer-bg"></div>
          <div className="empty producer-bg"></div>
          <div className="empty producer-bg"></div>
          <div className="empty producer-bg"></div>
          <div className="empty producer-bg"></div>
          <div className="empty producer-bg"></div>
          <div className="empty producer-bg"></div>
          <div className="empty producer-bg"></div>
          <div className="empty producer-bg"></div>
          <div className="empty producer-bg"></div>
          <div className="empty producer-bg"></div>
          <div className="empty producer-bg"></div>
          <div className="empty producer-bg"></div>
          <div className="empty producer-bg"></div>
          <div className="empty producer-bg"></div>

          {/* Producer Players */}
          {producerPlayers.map((player, playerIdx) => (
            <React.Fragment key={`producer-${player.playerId}`}>
              <div className="player-name producer">{player.playerName}</div>
              <div className="player-handicap">{player.handicapStrokes.reduce((a, b) => a + b, 0)}</div>
              {frontNine.map((_, holeIdx) => (
                <div key={`producer-${player.playerId}-front-${holeIdx}`} 
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
                  <div key={`producer-${player.playerId}-back-${holeIdx}`} 
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
          ))}

          {/* Producer Team Total */}
          <div className="team-total producers">TEAM TOTAL</div>
          <div className="empty"></div>
          {frontNine.map((_, holeIdx) => {
            const bestScore = producerPlayers.reduce((best, player) => {
              const net = player.netScores[holeIdx];
              if (net !== null && (best === null || net < best)) {
                return net;
              }
              return best;
            }, null as number | null);
            return (
              <div key={`producer-team-front-${holeIdx}`} className="team-total">
                {bestScore !== null ? bestScore : ''}
              </div>
            );
          })}
          <div className="team-total">{producerTotals.frontTotal || ''}</div>
          {backNine.map((_, holeIdx) => {
            const actualHoleIdx = holeIdx + 9;
            const bestScore = producerPlayers.reduce((best, player) => {
              const net = player.netScores[actualHoleIdx];
              if (net !== null && (best === null || net < best)) {
                return net;
              }
              return best;
            }, null as number | null);
            return (
              <div key={`producer-team-back-${holeIdx}`} className="team-total">
                {bestScore !== null ? bestScore : ''}
              </div>
            );
          })}
          <div className="team-total">{producerTotals.backTotal || ''}</div>
          <div className="team-total">{producerTotals.total || ''}</div>
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
        {renderScoreGrid()}
      </CardContent>
    </Card>
  );
};

export default TwoManTeamBestBallScorecard;