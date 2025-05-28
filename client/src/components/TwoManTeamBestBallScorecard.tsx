import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useTeams, type Team } from "@/hooks/useTeams";
import "./TwoManTeamBestBallScorecard.css";

interface PlayerScore {
  playerId: number;
  playerName: string;
  teamId: number;
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
  teamId: number;
  handicapStrokes: number[];
}

export function transformRawPlayerData(
  rawPlayers: RawPlayerData[],
  holes: HoleData[]
): PlayerScore[] {
  return rawPlayers.map((p) => ({
    playerId: p.id,
    playerName: p.name,
    teamId: p.teamId,
    scores: Array(holes.length).fill(null),
    netScores: Array(holes.length).fill(null),
    isBestBall: Array(holes.length).fill(false),
    handicapStrokes: p.handicapStrokes || Array(holes.length).fill(0),
  }));
}

interface ScorecardProps {
  holes: HoleData[];
  playerScores: PlayerScore[];
  existingScores?: Array<{
    holeNumber: number;
    teamScores: Record<number, number | null>; // teamId -> score
  }>;
  locked?: boolean;
  onUpdateScores?: (playerScores: PlayerScore[]) => void;
}

const TwoManTeamBestBallScorecard: React.FC<ScorecardProps> = ({
  holes = [],
  playerScores = [],
  existingScores = [],
  locked = false,
  onUpdateScores,
}) => {
  const [localPlayerScores, setLocalPlayerScores] = useState<PlayerScore[]>(playerScores);
  const { data: teams = [] } = useTeams();

  useEffect(() => {
    setLocalPlayerScores(playerScores);
  }, [playerScores]);

  // Helper function to get team by ID
  const getTeamById = (teamId: number): Team | undefined => {
    return teams.find(team => team.id === teamId);
  };

  // Helper function to get team identifier (shortName)
  const getTeamIdentifier = (teamId: number): string => {
    const team = getTeamById(teamId);
    return team ? team.shortName.toLowerCase() : `team-${teamId}`;
  };

  // Helper function to get team display name
  const getTeamDisplayName = (teamId: number): string => {
    const team = getTeamById(teamId);
    return team ? team.name.toUpperCase() : `TEAM ${teamId}`;
  };

  // Load existing scores from database into player scores
  useEffect(() => {
    if (existingScores.length > 0 && localPlayerScores.length > 0) {
      const updatedPlayerScores = [...localPlayerScores];
      
      existingScores.forEach(score => {
        const holeIndex = score.holeNumber - 1; // Convert to 0-based index
        
        // For best ball, we need to distribute the team scores to the players
        // For now, we'll put the team's best score on the first player of each team
        Object.entries(score.teamScores).forEach(([teamId, teamScore]) => {
          const teamPlayers = updatedPlayerScores.filter(p => p.teamId === parseInt(teamId));
          if (teamScore !== null && teamPlayers.length > 0) {
            teamPlayers[0].scores[holeIndex] = teamScore;
          }
        });
      });
      
      setLocalPlayerScores(updatedPlayerScores);
    }
  }, [existingScores, playerScores]);

  // Calculate net scores and best ball markers whenever scores change
  useEffect(() => {
    const updatedScores = localPlayerScores.map(player => {
      const netScores = player.scores.map((gross, idx) => {
        return gross !== null ? gross - (player.handicapStrokes[idx] || 0) : null;
      });
      return { ...player, netScores };
    });

    // Determine best net per team per hole
    holes.forEach((_, holeIdx) => {
      const bestByTeam: Record<number, { net: number | null; index: number | null }> = {};
      
      // Initialize best scores for each team based on actual players
      const uniqueTeamIds = Array.from(new Set(updatedScores.map(p => p.teamId)));
      uniqueTeamIds.forEach(teamId => {
        bestByTeam[teamId] = { net: null, index: null };
      });

      updatedScores.forEach((player, i) => {
        const net = player.netScores[holeIdx];
        if (net !== null && bestByTeam[player.teamId] !== undefined) {
          const best = bestByTeam[player.teamId];
          if (best.net === null || net < best.net) {
            bestByTeam[player.teamId] = { net, index: i };
          }
        }
      });

      updatedScores.forEach((player, i) => {
        const teamBest = bestByTeam[player.teamId];
        player.isBestBall[holeIdx] = teamBest && teamBest.index === i;
      });
    });

    setLocalPlayerScores(updatedScores);
  }, [localPlayerScores.map(p => p.scores.join(',')).join('|'), holes, teams]);

  // Call onUpdateScores separately to avoid infinite loops
  useEffect(() => {
    onUpdateScores?.(localPlayerScores);
  }, [localPlayerScores.map(p => p.scores.join(',')).join('|')]);

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
  const calculateTeamTotals = (teamId: number) => {
    const teamPlayers = localPlayerScores.filter(p => p.teamId === teamId);
    let frontTotal = 0;
    let backTotal = 0;

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

  // Get all unique team IDs from player scores
  const teamIds = Array.from(new Set(localPlayerScores.map(p => p.teamId)));
  const teamTotals = teamIds.reduce((acc, teamId) => {
    acc[teamId] = calculateTeamTotals(teamId);
    return acc;
  }, {} as Record<number, { frontTotal: number; backTotal: number; total: number }>);

  const renderScoreGrid = () => {
    // Group players by team
    const playersByTeam = teamIds.reduce((acc, teamId) => {
      acc[teamId] = localPlayerScores.filter(p => p.teamId === teamId);
      return acc;
    }, {} as Record<number, PlayerScore[]>);

    // Helper function to render a player row
    const renderPlayerRow = (player: PlayerScore) => (
      <React.Fragment key={`player-${player.playerId}`}>
        <div className={`player-name ${getTeamIdentifier(player.teamId)}`}>{player.playerName}</div>
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
    const renderTeamTotalRow = (teamId: number, totals: typeof teamTotals[number]) => {
      const teamPlayers = playersByTeam[teamId] || [];
      const teamClass = getTeamIdentifier(teamId) + 's';
      const teamName = getTeamDisplayName(teamId);
      
      return (
        <React.Fragment key={`team-total-${teamId}`}>
          <div className={`team-total ${teamClass}`}>{teamName}</div>
          <div className="empty"></div>
          {frontNine.map((_, holeIdx) => {
            const bestScore = teamPlayers.reduce((best: number | null, player: PlayerScore) => {
              const net = player.netScores[holeIdx];
              if (net !== null && (best === null || net < best)) {
                return net;
              }
              return best;
            }, null as number | null);
            return (
              <div key={`${teamId}-team-front-${holeIdx}`} className="team-total">
                {bestScore !== null ? bestScore : ''}
              </div>
            );
          })}
          <div className="team-total">{totals.frontTotal || ''}</div>
          {backNine.map((_, holeIdx) => {
            const actualHoleIdx = holeIdx + 9;
            const bestScore = teamPlayers.reduce((best: number | null, player: PlayerScore) => {
              const net = player.netScores[actualHoleIdx];
              if (net !== null && (best === null || net < best)) {
                return net;
              }
              return best;
            }, null as number | null);
            return (
              <div key={`${teamId}-team-back-${holeIdx}`} className="team-total">
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
      if (teamIds.length !== 2) {
        return null; // Only show match status for exactly 2 teams
      }

      const [team1Id, team2Id] = teamIds;
      const team1Total = teamTotals[team1Id]?.total || 0;
      const team2Total = teamTotals[team2Id]?.total || 0;
      const team1Name = getTeamById(team1Id)?.shortName.toUpperCase() || `TEAM ${team1Id}`;
      const team2Name = getTeamById(team2Id)?.shortName.toUpperCase() || `TEAM ${team2Id}`;
      
      let status = '';
      
      if (team1Total === 0 && team2Total === 0) {
        status = 'MATCH EVEN';
      } else if (team1Total < team2Total) {
        const diff = team2Total - team1Total;
        status = `${team1Name} UP ${diff}`;
      } else if (team2Total < team1Total) {
        const diff = team1Total - team2Total;
        status = `${team2Name} UP ${diff}`;
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

    // If we have exactly 2 teams, render in the traditional order
    if (teamIds.length === 2) {
      const [team1Id, team2Id] = teamIds.sort(); // Sort for consistent ordering
      const team1Players = playersByTeam[team1Id] || [];
      const team2Players = playersByTeam[team2Id] || [];

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

            {/* Team 1 Players */}
            {team1Players.map((player) => renderPlayerRow(player))}
            
            {/* Team 1 Total */}
            {renderTeamTotalRow(team1Id, teamTotals[team1Id])}
            
            {/* Match Status */}
            {renderMatchStatusRow()}
            
            {/* Team 2 Total */}
            {renderTeamTotalRow(team2Id, teamTotals[team2Id])}
            
            {/* Team 2 Players */}
            {team2Players.map((player) => renderPlayerRow(player))}
          </div>
        </div>
      );
    }

    // Fallback for non-standard number of teams
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

          {/* All Players and Team Totals */}
          {teamIds.map(teamId => [
            ...(playersByTeam[teamId] || []).map((player: PlayerScore) => renderPlayerRow(player)),
            renderTeamTotalRow(teamId, teamTotals[teamId])
          ])}
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