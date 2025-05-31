import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import "./TwoManScrambleScorecard.css";

// Team score interface for Scramble
interface TeamScrambleScore {
  teamId: number;
  score: number | null;
  holeNumber: number;
}

// Simple interface for the component props
interface ScrambleScorecardProps {
  matchId: number;
  holes: any[];
  aviatorPlayersList: any[];
  producerPlayersList: any[];
  participants: any[];
  allPlayers: any[];
  matchData: any;
  onScoreUpdate?: (scores: any) => void;
  isMobile?: boolean;
}

/**
 * ScrambleScorecard Component
 * 
 * Specialized scorecard for 2-man Team Scramble format
 * - Shows only team scores (not individual players)
 * - Includes match play status calculation
 * - Features enhanced grid-based UI matching Best Ball scorecard
 */
const ScrambleScorecard: React.FC<ScrambleScorecardProps> = ({
  matchId,
  holes = [],
  aviatorPlayersList = [],
  producerPlayersList = [],
  participants = [],
  allPlayers = [],
  matchData,
  onScoreUpdate,
  isMobile = false
}) => {
  const { user, isAdmin } = useAuth();
  const [teamScores, setTeamScores] = useState<Map<string, TeamScrambleScore>>(new Map());
  const [locked, setLocked] = useState(matchData?.status === "completed");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Determine if the current user can edit scores (admin or participant)
  const canEditScores = useMemo(() => {
    console.log('Edit permissions check:', { 
      isAdmin, 
      user: user?.id, 
      allPlayersCount: allPlayers.length,
      participantsCount: participants.length 
    });
    
    if (isAdmin) return true;
    if (!user) return false;
    
    // Find all player IDs linked to this user
    const userPlayerIds = allPlayers
      .filter((p: any) => user && p?.userId === user.id)
      .map((p: any) => p?.id)
      .filter(Boolean);
    
    console.log('User player IDs:', userPlayerIds);
    
    // Check if any of the user's players are participants in this match
    const canEdit = participants.some((p: any) => 
      userPlayerIds.includes(p?.playerId)
    );
    
    console.log('Can edit scores:', canEdit);
    return canEdit;
  }, [isAdmin, user, allPlayers, participants]);

  // Split holes into front and back nine
  const frontNine = holes
    .filter((hole: any) => hole && hole.number <= 9)
    .sort((a: any, b: any) => a.number - b.number);
  
  const backNine = holes
    .filter((hole: any) => hole && hole.number > 9)
    .sort((a: any, b: any) => a.number - b.number);

  // Get team IDs
  const getAviatorTeamId = () => {
    const aviatorTeam = aviatorPlayersList[0]?.teamId;
    return aviatorTeam || 1;
  };

  const getProducerTeamId = () => {
    const producerTeam = producerPlayersList[0]?.teamId;
    return producerTeam || 2;
  };

  // Fetch team scores from the server
  const { data: savedScores = [], isLoading } = useQuery({
    queryKey: ['/api/team-scores', matchId],
    retry: false,
  });

  // Initialize team scores from saved data
  useEffect(() => {
    if (savedScores && Array.isArray(savedScores)) {
      const scoresMap = new Map<string, TeamScrambleScore>();
      
      savedScores.forEach((score: any) => {
        if (score?.teamId && score?.holeNumber) {
          const key = `${score.holeNumber}-${score.teamId}`;
          scoresMap.set(key, {
            teamId: score.teamId,
            score: score.score,
            holeNumber: score.holeNumber
          });
        }
      });
      
      setTeamScores(scoresMap);
    }
  }, [savedScores]);

  // Mutation for saving team scores
  const saveScoreMutation = useMutation({
    mutationFn: async ({ teamId, holeNumber, score }: { teamId: number; holeNumber: number; score: number | null }) => {
      return apiRequest(
        'POST',
        `/api/team-scores`,
        {
          matchId,
          teamId,
          holeNumber,
          score
        }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/team-scores', matchId] });
      onScoreUpdate?.({});
    }
  });

  // Handle score changes
  const handleScoreChange = async (holeNumber: number, teamId: number, score: number | null) => {
    if (locked || !canEditScores || isSubmitting) return;

    setIsSubmitting(true);
    
    try {
      // Update local state immediately
      const key = `${holeNumber}-${teamId}`;
      const newScores = new Map(teamScores);
      
      if (score !== null) {
        newScores.set(key, { teamId, holeNumber, score });
      } else {
        newScores.delete(key);
      }
      
      setTeamScores(newScores);
      
      // Save to server
      await saveScoreMutation.mutateAsync({ teamId, holeNumber, score });
    } catch (error) {
      console.error("Error saving team score:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate team totals
  const calculateTeamTotals = () => {
    const aviatorTeamId = getAviatorTeamId();
    const producerTeamId = getProducerTeamId();
    
    let aviatorFrontTotal = 0;
    let aviatorBackTotal = 0;
    let producerFrontTotal = 0;
    let producerBackTotal = 0;
    
    // Calculate front nine totals
    frontNine.forEach(hole => {
      const aviatorKey = `${hole.number}-${aviatorTeamId}`;
      const producerKey = `${hole.number}-${producerTeamId}`;
      
      const aviatorScore = teamScores.get(aviatorKey)?.score;
      const producerScore = teamScores.get(producerKey)?.score;
      
      if (aviatorScore) aviatorFrontTotal += aviatorScore;
      if (producerScore) producerFrontTotal += producerScore;
    });
    
    // Calculate back nine totals
    backNine.forEach(hole => {
      const aviatorKey = `${hole.number}-${aviatorTeamId}`;
      const producerKey = `${hole.number}-${producerTeamId}`;
      
      const aviatorScore = teamScores.get(aviatorKey)?.score;
      const producerScore = teamScores.get(producerKey)?.score;
      
      if (aviatorScore) aviatorBackTotal += aviatorScore;
      if (producerScore) producerBackTotal += producerScore;
    });
    
    return {
      aviatorFrontTotal,
      aviatorBackTotal,
      aviatorTotal: aviatorFrontTotal + aviatorBackTotal,
      producerFrontTotal,
      producerBackTotal,
      producerTotal: producerFrontTotal + producerBackTotal
    };
  };

  // Helper function to generate match status for each hole
  const generateMatchStatus = (holeNumber: number): { text: string; color: string } => {
    const aviatorTeamId = getAviatorTeamId();
    const producerTeamId = getProducerTeamId();
    
    const aviatorKey = `${holeNumber}-${aviatorTeamId}`;
    const producerKey = `${holeNumber}-${producerTeamId}`;
    
    const aviatorScore = teamScores.get(aviatorKey)?.score;
    const producerScore = teamScores.get(producerKey)?.score;

    // Check if this hole has been completed
    if (aviatorScore === null || aviatorScore === undefined || 
        producerScore === null || producerScore === undefined) {
      return { text: "-", color: "text-gray-400" }; // Hole not completed yet
    }

    // Calculate running match status up to this hole
    let aviatorWins = 0;
    let producerWins = 0;

    // Loop through all holes up to current hole to calculate cumulative match status
    for (let h = 1; h <= holeNumber; h++) {
      const hAviatorKey = `${h}-${aviatorTeamId}`;
      const hProducerKey = `${h}-${producerTeamId}`;
      
      const hAviatorScore = teamScores.get(hAviatorKey)?.score;
      const hProducerScore = teamScores.get(hProducerKey)?.score;
      
      if (hAviatorScore !== null && hAviatorScore !== undefined && 
          hProducerScore !== null && hProducerScore !== undefined) {
        if (hAviatorScore < hProducerScore) {
          aviatorWins++;
        } else if (hProducerScore < hAviatorScore) {
          producerWins++;
        }
        // Ties don't count in match play
      }
    }

    const diff = aviatorWins - producerWins;
    let text = "AS"; // All Square
    let color = "text-black";

    if (diff > 0) {
      text = `A${diff}`;
      color = "text-aviator";
    } else if (diff < 0) {
      text = `P${Math.abs(diff)}`;
      color = "text-producer";
    }

    return { text, color };
  };

  const totals = calculateTeamTotals();

  if (isLoading) {
    return (
      <Card className="best-ball-scorecard-container">
        <CardHeader>
          <CardTitle>2-Man Team Scramble Scorecard</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="best-ball-scorecard-container">
      <CardHeader>
        <CardTitle>2-Man Team Scramble Scorecard</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="scorecard-grid">
          {/* Header row */}
          <div className="player-header">Player</div>
          <div className="handicap-header">Hdcp</div>
          {frontNine.map((hole) => (
            <div key={`front-hole-${hole.number}`} className="hole-number">{hole.number}</div>
          ))}
          <div className="total-header">Out</div>
          {backNine.map((hole) => (
            <div key={`back-hole-${hole.number}`} className="hole-number">{hole.number}</div>
          ))}
          <div className="total-header">In</div>
          <div className="total-header">Total</div>

          {/* Par row */}
          <div className="par-label">Par</div>
          <div className="empty"></div>
          {frontNine.map((hole) => (
            <div key={`front-par-${hole.number}`} className="par-value">{hole.par || 4}</div>
          ))}
          <div className="empty"></div>
          {backNine.map((hole) => (
            <div key={`back-par-${hole.number}`} className="par-value">{hole.par || 4}</div>
          ))}
          <div className="empty"></div>
          <div className="empty"></div>

          {/* Handicap row */}
          <div className="handicap-label">Handicap</div>
          <div className="empty"></div>
          {frontNine.map((hole) => (
            <div key={`front-hcp-${hole.number}`} className="handicap-value">{hole.handicap || 1}</div>
          ))}
          <div className="empty"></div>
          {backNine.map((hole) => (
            <div key={`back-hcp-${hole.number}`} className="handicap-value">{hole.handicap || 1}</div>
          ))}
          <div className="empty"></div>
          <div className="empty"></div>

          {/* Aviator Team Score */}
          <div className="team-header aviators">The Aviators</div>
          <div className="empty"></div>
          {frontNine.map((hole) => {
            const aviatorTeamId = getAviatorTeamId();
            const key = `${hole.number}-${aviatorTeamId}`;
            const scoreData = teamScores.get(key);
            
            return (
              <div key={`aviator-${hole.number}`} className="score-input-cell">
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={scoreData?.score !== null && scoreData?.score !== undefined ? scoreData.score : ''}
                  disabled={locked || !canEditScores || isSubmitting}
                  onChange={(e) => {
                    const newValue = e.target.value.trim() !== '' 
                      ? parseInt(e.target.value, 10) 
                      : null;
                    handleScoreChange(hole.number, aviatorTeamId, newValue);
                  }}
                  onBlur={(e) => {
                    const newValue = e.target.value.trim() !== ''
                      ? parseInt(e.target.value, 10)
                      : null;
                    if (newValue !== null && (newValue < 1 || newValue > 20)) {
                      e.target.value = '';
                      handleScoreChange(hole.number, aviatorTeamId, null);
                    }
                  }}
                />
              </div>
            );
          })}
          <div className="team-total">{totals.aviatorFrontTotal || 0}</div>
          {backNine.map((hole) => {
            const aviatorTeamId = getAviatorTeamId();
            const key = `${hole.number}-${aviatorTeamId}`;
            const scoreData = teamScores.get(key);
            
            return (
              <div key={`aviator-${hole.number}`} className="score-input-cell">
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={scoreData?.score !== null && scoreData?.score !== undefined ? scoreData.score : ''}
                  disabled={locked || !canEditScores || isSubmitting}
                  onChange={(e) => {
                    const newValue = e.target.value.trim() !== '' 
                      ? parseInt(e.target.value, 10) 
                      : null;
                    handleScoreChange(hole.number, aviatorTeamId, newValue);
                  }}
                  onBlur={(e) => {
                    const newValue = e.target.value.trim() !== ''
                      ? parseInt(e.target.value, 10)
                      : null;
                    if (newValue !== null && (newValue < 1 || newValue > 20)) {
                      e.target.value = '';
                      handleScoreChange(hole.number, aviatorTeamId, null);
                    }
                  }}
                />
              </div>
            );
          })}
          <div className="team-total">{totals.aviatorBackTotal || 0}</div>
          <div className="team-total">{totals.aviatorTotal || 0}</div>

          {/* Match Status Row */}
          <div className="match-status-label">Match Status</div>
          <div className="empty"></div>
          {frontNine.map((hole) => {
            const matchStatus = generateMatchStatus(hole.number);
            return (
              <div key={`match-status-${hole.number}`} className={`match-status-cell ${matchStatus.color}`}>
                {matchStatus.text}
              </div>
            );
          })}
          <div className="empty"></div>
          {backNine.map((hole) => {
            const matchStatus = generateMatchStatus(hole.number);
            return (
              <div key={`match-status-${hole.number}`} className={`match-status-cell ${matchStatus.color}`}>
                {matchStatus.text}
              </div>
            );
          })}
          <div className="empty"></div>
          <div className="empty"></div>

          {/* Producer Team Score */}
          <div className="team-header producers">The Producers</div>
          <div className="empty"></div>
          {frontNine.map((hole) => {
            const producerTeamId = getProducerTeamId();
            const key = `${hole.number}-${producerTeamId}`;
            const scoreData = teamScores.get(key);
            
            return (
              <div key={`producer-${hole.number}`} className="score-input-cell">
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={scoreData?.score !== null && scoreData?.score !== undefined ? scoreData.score : ''}
                  disabled={locked || !canEditScores || isSubmitting}
                  onChange={(e) => {
                    const newValue = e.target.value.trim() !== '' 
                      ? parseInt(e.target.value, 10) 
                      : null;
                    handleScoreChange(hole.number, producerTeamId, newValue);
                  }}
                  onBlur={(e) => {
                    const newValue = e.target.value.trim() !== ''
                      ? parseInt(e.target.value, 10)
                      : null;
                    if (newValue !== null && (newValue < 1 || newValue > 20)) {
                      e.target.value = '';
                      handleScoreChange(hole.number, producerTeamId, null);
                    }
                  }}
                />
              </div>
            );
          })}
          <div className="team-total">{totals.producerFrontTotal || 0}</div>
          {backNine.map((hole) => {
            const producerTeamId = getProducerTeamId();
            const key = `${hole.number}-${producerTeamId}`;
            const scoreData = teamScores.get(key);
            
            return (
              <div key={`producer-${hole.number}`} className="score-input-cell">
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={scoreData?.score !== null && scoreData?.score !== undefined ? scoreData.score : ''}
                  disabled={locked || !canEditScores || isSubmitting}
                  onChange={(e) => {
                    const newValue = e.target.value.trim() !== '' 
                      ? parseInt(e.target.value, 10) 
                      : null;
                    handleScoreChange(hole.number, producerTeamId, newValue);
                  }}
                  onBlur={(e) => {
                    const newValue = e.target.value.trim() !== ''
                      ? parseInt(e.target.value, 10)
                      : null;
                    if (newValue !== null && (newValue < 1 || newValue > 20)) {
                      e.target.value = '';
                      handleScoreChange(hole.number, producerTeamId, null);
                    }
                  }}
                />
              </div>
            );
          })}
          <div className="team-total">{totals.producerBackTotal || 0}</div>
          <div className="team-total">{totals.producerTotal || 0}</div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ScrambleScorecard;
