import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, useCallback, useRef } from "react";
import { useLocation } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import MatchHeader from "@/components/MatchHeader";
import EnhancedMatchScorecard from "@/components/EnhancedMatchScorecard";
import TwoManTeamBestBallScorecard, { transformRawPlayerData } from "@/components/TwoManTeamBestBallScorecard";
import TwoManTeamGrossScorecard from "@/components/TwoManTeamGrossScorecard";
import FourManTeamScrambleScorecard from "@/components/FourManTeamScrambleScorecard";
import TwoManTeamScrambleScorecard from "@/components/TwoManTeamScrambleScorecard";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft, Edit, Save, Lock, Unlock } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/hooks/use-auth";
import { useTeams } from "@/hooks/useTeams";

interface MatchProps {
  id: number;
}

interface MatchData {
  id: number;
  roundId: number;
  name: string;
  status: string;
  currentHole: number;
  leadingTeam: string | null;
  leadAmount: number;
  result: string | null;
  locked?: boolean;
}

interface RoundData {
  id: number;
  name: string;
  matchType: string;
  courseName: string;
  startTime: string;
  aviatorScore: number;
  producerScore: number;
  date: string;
  isComplete: boolean;
  courseId?: number;
}

interface HoleData {
  id: number;
  number: number;
  par: number;
}

interface ScoreData {
  id: number;
  matchId: number;
  holeNumber: number;
  aviatorScore: number | null;
  producerScore: number | null;
  winningTeam: string | null;
  matchStatus: string | null;
}

const Match = ({ id }: { id: number }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  // Load teams for dynamic team handling
  const { data: teams = [], isLoading: isTeamsLoading } = useTeams();
  
  // Helper functions to get team IDs dynamically
  const getAviatorTeamId = () => {
    if (!teams?.length) return 1; // fallback
    const aviatorTeam = teams.find(t => 
      t.shortName.toLowerCase() === 'aviators' || 
      t.name.toLowerCase().includes('aviator')
    );
    console.log('DEBUG: getAviatorTeamId - found team:', aviatorTeam);
    return aviatorTeam?.id || 1;
  };
  
  const getProducerTeamId = () => {
    if (!teams?.length) return 2; // fallback
    const producerTeam = teams.find(t => 
      t.shortName.toLowerCase() === 'producers' || 
      t.name.toLowerCase().includes('producer')
    );
    console.log('DEBUG: getProducerTeamId - found team:', producerTeam);
    return producerTeam?.id || 2;
  };
  
  // Helper function to get team identifier from ID
  const getTeamIdentifier = (teamId: number) => {
    const aviatorTeamId = getAviatorTeamId();
    const producerTeamId = getProducerTeamId();
    
    if (teamId === aviatorTeamId) return 'aviators';
    if (teamId === producerTeamId) return 'producers';
    return 'unknown';
  };

  const [showCompletionDialog, setShowCompletionDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [matchSummary, setMatchSummary] = useState({
    aviatorTotal: 0,
    producerTotal: 0,
    result: "",
    leadingTeam: "",
    matchPlayResult: "",
  });
  const [editMatchData, setEditMatchData] = useState({
    name: "",
  });
  const [selectedAviatorPlayers, setSelectedAviatorPlayers] = useState<any[]>([]);
  const [selectedProducerPlayers, setSelectedProducerPlayers] = useState<any[]>([]);

  // Check if admin mode is enabled via URL parameter
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    setIsAdminMode(urlParams.get("admin") === "true");
    
    // Force refresh participants and players data to ensure we have latest data
    queryClient.removeQueries({ queryKey: [`/api/match-players?matchId=${id}`] });
    queryClient.removeQueries({ queryKey: ["/api/players"] });
    queryClient.invalidateQueries({ queryKey: [`/api/match-players?matchId=${id}`] });
    queryClient.invalidateQueries({ queryKey: ["/api/players"] });
  }, [id, queryClient]);

  // Fetch match data
  const { data: match, isLoading: isMatchLoading } = useQuery<MatchData>({
    queryKey: [`/api/matches/${id}`],
  });

  // Fetch scores for this match
  const { data: scores, isLoading: isScoresLoading } = useQuery<ScoreData[]>({
    queryKey: [`/api/scores?matchId=${id}`],
  });

  // Fetch round data
  const { data: round, isLoading: isRoundLoading } = useQuery<RoundData>({
    queryKey: [`/api/rounds/${match?.roundId}`],
    enabled: !!match?.roundId,
  });

  // Fetch holes data for the specific course of this round
  const { data: holes, isLoading: isHolesLoading } = useQuery<HoleData[]>({
    queryKey: [`/api/holes`, round?.courseId],
    queryFn: async () => {
      if (!round?.courseId) return [];
      const response = await fetch(`/api/holes?courseId=${round.courseId}`);
      if (!response.ok) throw new Error('Failed to fetch holes');
      return response.json();
    },
    enabled: !!round?.courseId,
  });

  // Fetch players data for match editing
  const { data: players = [], isLoading: isPlayersLoading } = useQuery<any[]>({
    queryKey: ["/api/players"],
    queryFn: async () => {
      console.log('DEBUG: Fetching players');
      const response = await fetch('/api/players', {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error('Failed to fetch players');
      }
      const data = await response.json();
      console.log('DEBUG: Players API response:', data);
      return data;
    },
    initialData: [],
    staleTime: 0, // Override global staleTime to ensure fresh data
    refetchOnMount: true,
  });

  // Fetch match participants to populate selected players
  const { data: participants = [], isLoading: isParticipantsLoading, refetch: refetchParticipants } = useQuery<any[]>({
    queryKey: [`/api/match-players?matchId=${id}`],
    queryFn: async () => {
      console.log('DEBUG: Fetching participants for match', id);
      if (!id) {
        console.log('DEBUG: No match ID available');
        return [];
      }
      const response = await fetch(`/api/match-players?matchId=${id}`, {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error('Failed to fetch participants');
      }
      const data = await response.json();
      console.log('DEBUG: Participants API response:', data);
      return data;
    },
    enabled: !!id && !isNaN(Number(id)),
    initialData: [],
    staleTime: 0, // Override global staleTime to ensure fresh data
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  // Debug logging
  console.log('DEBUG Match component:', {
    matchId: id,
    participantsQueryKey: `/api/match-players?matchId=${id}`,
    participants,
    participantsLength: participants?.length
  });

  console.log('DEBUG Match component:', {
    matchId: id,
    participantsQueryKey: `/api/match-players?matchId=${id}`,
    participants,
    participantsLength: participants?.length
  });

  const { isAdmin } = useAuth();

  // Debounce timer for score saving
  const saveTimeoutRef = useRef<NodeJS.Timeout>();

  // Update lock status when match data changes
  useEffect(() => {
    if (match) {
      setIsLocked(!!match.locked);
    }
  }, [match]);

  // Function to update score
  const updateScoreMutation = useMutation({
    mutationFn: async (scoreData: any) => {
      const existingScore = scores?.find(
        (s) => s.holeNumber === scoreData.holeNumber,
      );

      if (existingScore) {
        // Update existing score
        return apiRequest("PUT", `/api/scores/${existingScore.id}`, scoreData);
      } else {
        // Create new score
        return apiRequest("POST", "/api/scores", scoreData);
      }
    },
    onSuccess: () => {
      // Invalidate the scores query to refetch the data
      queryClient.invalidateQueries({ queryKey: [`/api/scores?matchId=${id}`] });
    },
    onError: (error) => {
      toast({
        title: "Error updating score",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Function to update match
  const updateMatchMutation = useMutation({
    mutationFn: async (matchData: any) => {
      return apiRequest("PUT", `/api/matches/${matchData.id}`, matchData);
    },
    onSuccess: () => {
      toast({
        title: "Match completed",
        description: "The match has been marked as completed.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error completing match",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Debounced save function for TwoManTeamBestBallScorecard
  const debouncedSaveBestBallScores = useCallback((playerScores: any[]) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = setTimeout(() => {
      console.log('Debounced best ball save triggered for:', playerScores);
      
      if (!playerScores || !Array.isArray(playerScores) || playerScores.length === 0) return;
      
      // Group players by team using dynamic team logic
      const aviatorTeamId = getAviatorTeamId();
      const producerTeamId = getProducerTeamId();
      
      const aviatorPlayers = playerScores.filter(p => p.teamId === aviatorTeamId);
      const producerPlayers = playerScores.filter(p => p.teamId === producerTeamId);
      
      // For each hole, calculate the best ball score for each team
      const holeCount = playerScores[0]?.scores?.length || 18;
      
      for (let holeIndex = 0; holeIndex < holeCount; holeIndex++) {
        // Get best aviator net score for this hole (best ball uses net scores)
        const aviatorNetScores = aviatorPlayers
          .map(p => p.netScores?.[holeIndex])
          .filter(score => score !== null && score !== undefined) as number[];
        
        // Get best producer net score for this hole
        const producerNetScores = producerPlayers
          .map(p => p.netScores?.[holeIndex])
          .filter(score => score !== null && score !== undefined) as number[];
        
        const aviatorBestScore = aviatorNetScores.length > 0 ? Math.min(...aviatorNetScores) : null;
        const producerBestScore = producerNetScores.length > 0 ? Math.min(...producerNetScores) : null;
        
        // Check if this hole's scores have changed from what's currently saved
        const existingScore = scores?.find(s => s.holeNumber === holeIndex + 1);
        const hasChanged = !existingScore || 
          existingScore.aviatorScore !== aviatorBestScore || 
          existingScore.producerScore !== producerBestScore;
        
        // Only save if scores have changed and at least one team has a score
        if (hasChanged && (aviatorBestScore !== null || producerBestScore !== null)) {
          const scoreData = {
            matchId: id,
            holeNumber: holeIndex + 1, // API expects 1-based hole numbers
            aviatorScore: aviatorBestScore,
            producerScore: producerBestScore,
          };
          
          console.log(`Saving best ball score for hole ${holeIndex + 1}:`, scoreData);
          updateScoreMutation.mutate(scoreData);
        }
      }
    }, 1000); // Wait 1 second after last change before saving
  }, [id, scores, updateScoreMutation, getAviatorTeamId, getProducerTeamId]);

  // Debounced save function for legacy scorecards
  const debouncedSaveScores = useCallback((playerScores: any[]) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = setTimeout(() => {
      console.log('Debounced save triggered for:', playerScores);
      
      // Group players by team using dynamic team logic
      const aviatorTeamId = getAviatorTeamId();
      const producerTeamId = getProducerTeamId();
      
      const aviatorPlayers = playerScores.filter(p => p.team === getTeamIdentifier(aviatorTeamId));
      const producerPlayers = playerScores.filter(p => p.team === getTeamIdentifier(producerTeamId));
      
      // For each hole, calculate the best ball score for each team
      const holeCount = playerScores[0]?.scores?.length || 0;
      
      for (let holeIndex = 0; holeIndex < holeCount; holeIndex++) {
        // Get best aviator score for this hole
        const aviatorScores = aviatorPlayers
          .map(p => p.scores[holeIndex])
          .filter(score => score !== null && score !== undefined) as number[];
        
        // Get best producer score for this hole
        const producerScores = producerPlayers
          .map(p => p.scores[holeIndex])
          .filter(score => score !== undefined) as number[];
        
        const aviatorBestScore = aviatorScores.length > 0 ? Math.min(...aviatorScores) : null;
        const producerBestScore = producerScores.length > 0 ? Math.min(...producerScores) : null;
        
        // Check if this hole's scores have changed from what's currently saved
        const existingScore = scores?.find(s => s.holeNumber === holeIndex + 1);
        const hasChanged = !existingScore || 
          existingScore.aviatorScore !== aviatorBestScore || 
          existingScore.producerScore !== producerBestScore;
        
        // Only save if scores have changed and at least one team has a score
        if (hasChanged && (aviatorBestScore !== null || producerBestScore !== null)) {
          const scoreData = {
            matchId: id,
            holeNumber: holeIndex + 1, // API expects 1-based hole numbers
            aviatorScore: aviatorBestScore,
            producerScore: producerBestScore,
          };
          
          console.log(`Saving score for hole ${holeIndex + 1}:`, scoreData);
          updateScoreMutation.mutate(scoreData);
        }
      }
    }, 1000); // Wait 1 second after last change before saving
  }, [id, scores, updateScoreMutation]);

  // Toggle lock mutation
  const toggleLockMutation = useMutation({
    mutationFn: async (locked: boolean) => {
      if (!match) return;
      return apiRequest("PUT", `/api/matches/${match.id}`, {
        locked: locked,
      });
    },
    onSuccess: () => {
      setIsLocked(!isLocked);
      queryClient.invalidateQueries({ queryKey: [`/api/matches/${id}`] });
      toast({
        title: isLocked ? "Match unlocked" : "Match locked",
        description: isLocked 
          ? "The match has been unlocked for editing." 
          : "The match has been locked to prevent further edits.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error updating match lock status",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const isLoading =
    isMatchLoading || isScoresLoading || isHolesLoading || isRoundLoading || isPlayersLoading || isParticipantsLoading || isTeamsLoading;

  // Calculate proper match play result (e.g., "3&2", "4&3", "1 UP")
  const calculateMatchPlayResult = (completedScores: ScoreData[]): string => {
    if (!completedScores.length) return "";

    let aviatorPoints = 0;
    let producerPoints = 0;
    let ties = 0;

    // Sort scores by hole number
    const sortedScores = [...completedScores].sort(
      (a, b) => a.holeNumber - b.holeNumber,
    );

    // Calculate wins and ties for each hole
    sortedScores.forEach((score) => {
      if (score.aviatorScore === null || score.producerScore === null) return;

      if (score.aviatorScore < score.producerScore) {
        aviatorPoints += 1;
      } else if (score.producerScore < score.aviatorScore) {
        producerPoints += 1;
      } else {
        aviatorPoints += 0.5;
        producerPoints += 0.5;
        ties++;
      }
    });

    // Calculate lead and holes remaining
    const lead = Math.abs(aviatorPoints - producerPoints);
    const highestHolePlayed = Math.max(
      ...sortedScores.map((s) => s.holeNumber),
    );
    const holesRemaining = 18 - highestHolePlayed;
    const totalCompleted = sortedScores.length;

    // Match play result format
    if (lead === 0 && totalCompleted === 18) {
      // Tied match after all holes
      return "AS";
    } else if (lead > holesRemaining) {
      // Match clinched before 18 holes
      const leadingTeam = aviatorPoints > producerPoints ? "aviators" : "producers";
      return `${lead} UP`;
    } else if (lead > 0 && totalCompleted === 18) {
      // Match completed with a winner after 18 holes
      return `${lead} UP`;
    }

    return "";
  };

  // Check if match is completed or should be completed
  useEffect(() => {
    if (!scores || !match || match.status === "completed") return;

    // Calculate completedHoles and check for match completion conditions
    const completedScores = scores.filter(
      (score) => score.aviatorScore !== null && score.producerScore !== null,
    );

    // If all 18 holes are filled or match is clinched
    if (
      completedScores.length === 18 ||
      match.leadAmount >
        18 - Math.max(...completedScores.map((s) => s.holeNumber), 0)
    ) {
      // Calculate totals for the summary
      let aviatorTotal = 0;
      let producerTotal = 0;
      completedScores.forEach((score) => {
        if (score.aviatorScore) aviatorTotal += score.aviatorScore;
        if (score.producerScore) producerTotal += score.producerScore;
      });

      // Calculate the match play result
      const matchPlayResult = calculateMatchPlayResult(completedScores);

      // Set match summary data
      setMatchSummary({
        aviatorTotal,
        producerTotal,
        result: matchPlayResult,
        leadingTeam: match.leadingTeam || "tied",
        matchPlayResult,
      });

      // Mark match as completed and update result in database
      updateMatchMutation.mutate({
        id: match.id,
        status: "completed",
        result: matchPlayResult,
        leadingTeam: match.leadingTeam,
        leadAmount: match.leadAmount,
      });

      // Show completion dialog
      setShowCompletionDialog(true);
    }
  }, [scores, match]);

  // Handle score update
  const handleScoreUpdate = (
    holeNumber: number,
    aviatorScore: number | null,
    producerScore: number | null,
  ) => {
    // Check if the match is locked
    if (isLocked) {
      toast({
        title: "Match locked",
        description: "Cannot update scores for a locked match",
        variant: "destructive",
      });
      return;
    }

    // Allow updates even if one of the scores is null
    const scoreData = {
      matchId: id,
      holeNumber,
      aviatorScore,
      producerScore,
    };

    updateScoreMutation.mutate(scoreData);
  };

  // Update match status from "upcoming" to "in_progress" when first score is entered
  useEffect(() => {
    if (!match || !scores || match.status !== "upcoming") return;

    // Check if any scores exist
    const hasScores = scores.some(
      (score) => score.aviatorScore !== null || score.producerScore !== null,
    );

    // If scores exist, update match status to in_progress
    if (hasScores) {
      updateMatchMutation.mutate({
        id: match.id,
        status: "in_progress",
      });
    }
  }, [scores, match]);

  // Handle editing match - Load participants into selected players
  useEffect(() => {
    if (match) {
      setEditMatchData({
        name: match.name,
      });
    }

    if (participants && participants.length > 0 && players && players.length > 0) {
      const aviatorTeamIdentifier = getTeamIdentifier(getAviatorTeamId());
      const producerTeamIdentifier = getTeamIdentifier(getProducerTeamId());
      
      const aviators = participants
        .filter((p: any) => p.team === aviatorTeamIdentifier)
        .map((p: any) => players.find((player: any) => player.id === p.playerId))
        .filter(Boolean);

      const producers = participants
        .filter((p: any) => p.team === producerTeamIdentifier)
        .map((p: any) => players.find((player: any) => player.id === p.playerId))
        .filter(Boolean);

      setSelectedAviatorPlayers(aviators);
      setSelectedProducerPlayers(producers);
    }
  }, [match, participants, players]);

  // Handle lock toggle
  const handleToggleLock = () => {
    toggleLockMutation.mutate(!isLocked);
  };

  const handleOpenEditDialog = () => {
    setShowEditDialog(true);
  };

  // Create a mutation for adding match participants
  const addParticipantMutation = useMutation({
    mutationFn: async (participantData: any) => {
      return apiRequest("POST", "/api/match-players", participantData);
    },
  });

  // Create a mutation for deleting match participants
  const deleteParticipantMutation = useMutation({
    mutationFn: async (participantId: number) => {
      return apiRequest("DELETE", `/api/match-players/${participantId}`);
    },
  });

  const handleEditMatchSubmit = async () => {
    if (!match) return;

    try {
      // First update match name
      await updateMatchMutation.mutateAsync({
        id: match.id,
        name: editMatchData.name,
      });

      // Find which players are new vs. existing
      const existingAviatorPlayerIds = participants
        .filter((p: any) => p.team === "aviators")
        .map((p: any) => p.playerId);

      const existingProducerPlayerIds = participants
        .filter((p: any) => p.team === "producers")
        .map((p: any) => p.playerId);

      // Players to add
      const newAviatorPlayers = selectedAviatorPlayers
        .filter((p: any) => !existingAviatorPlayerIds.includes(p.id));

      const newProducerPlayers = selectedProducerPlayers
        .filter((p: any) => !existingProducerPlayerIds.includes(p.id));

      // Players to remove
      const aviatorTeamIdentifier = getTeamIdentifier(getAviatorTeamId());
      const producerTeamIdentifier = getTeamIdentifier(getProducerTeamId());
      
      const aviatorPlayersToRemove = participants
        .filter((p: any) => 
          p.team === aviatorTeamIdentifier && 
          !selectedAviatorPlayers.some((s: any) => s.id === p.playerId)
        );

      const producerPlayersToRemove = participants
        .filter((p: any) => 
          p.team === producerTeamIdentifier && 
          !selectedProducerPlayers.some((s: any) => s.id === p.playerId)
        );

      // Remove players that are no longer selected
      for (const player of [...aviatorPlayersToRemove, ...producerPlayersToRemove]) {
        await deleteParticipantMutation.mutateAsync(player.id);
      }

      // Add new aviator players
      for (const player of newAviatorPlayers) {
        await addParticipantMutation.mutateAsync({
          matchId: match.id,
          playerId: player.id,
          team: aviatorTeamIdentifier
        });
      }

      // Add new producer players
      for (const player of newProducerPlayers) {
        await addParticipantMutation.mutateAsync({
          matchId: match.id,
          playerId: player.id,
          team: producerTeamIdentifier
        });
      }

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: [`/api/matches/${match.id}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/match-players?matchId=${match.id}`] });

      setShowEditDialog(false);
      toast({
        title: "Match updated",
        description: "The match details have been updated successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Failed to update match",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleBackToAdminMatches = () => {
    if (match && match.roundId) {
      window.location.href = `/rounds/${match.roundId}`;
    } else {
      window.location.href = "/";
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      {isLoading || !match ? (
        <>
          <div className="mb-6">
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-36 w-full" />
          </div>
          <Skeleton className="h-64 w-full mb-6" />
          <Skeleton className="h-48 w-full" />
        </>
      ) : (
        <>
          {/* Updated header section - now visible for all users, but with admin features conditional */}
            <div className="mb-4 flex items-center justify-end">

            <div className="flex items-center space-x-2">
              {isAdminMode && (
                <div className="bg-amber-100 text-amber-800 px-3 py-1 rounded text-xs font-medium">
                  Admin View
                </div>
              )}

              {isAdmin && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleToggleLock}
                  className="ml-2"
                >
                  {isLocked ? (
                    <>
                      <Unlock className="mr-2 h-4 w-4" />
                      Unlock Match
                    </>
                  ) : (
                    <>
                      <Lock className="mr-2 h-4 w-4" />
                      Lock Match
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>

          {/* Match Header */}
          <MatchHeader
            id={match.id}
            name={match.name}
            roundId={match.roundId}
            roundName={round?.name}
            matchType={round?.matchType}
            leadingTeam={match.leadingTeam}
            leadAmount={match.leadAmount}
            currentHole={match.currentHole}
            status={match.status}
            result={match.result}
          />

          {/* Match Scorecard */}
          {round?.matchType === "2-man Team Best Ball" && (
            <TwoManTeamBestBallScorecard
              matchId={id}
              holes={holes || []}
              aviatorPlayersList={(() => {
                if (!teams || teams.length === 0) return [];
                const aviatorTeamId = getAviatorTeamId();
                return (participants || [])
                  .filter(p => p.team === 'aviators')
                  .map(p => {
                    const player = players.find(player => player.id === p.playerId);
                    return {
                      id: p.playerId,
                      name: player?.name || `Player ${p.playerId}`,
                      teamId: aviatorTeamId,
                      team: 'aviator' as const
                    };
                  })
                  .filter(p => p.name && !p.name.startsWith('Player '));
              })()}
              producerPlayersList={(() => {
                if (!teams || teams.length === 0) return [];
                const producerTeamId = getProducerTeamId();
                return (participants || [])
                  .filter(p => p.team === 'producers')
                  .map(p => {
                    const player = players.find(player => player.id === p.playerId);
                    return {
                      id: p.playerId,
                      name: player?.name || `Player ${p.playerId}`,
                      teamId: producerTeamId,
                      team: 'producer' as const
                    };
                  })
                  .filter(p => p.name && !p.name.startsWith('Player '));
              })()}
              participants={participants || []}
              allPlayers={(() => {
                if (!teams || teams.length === 0) return [];
                return (participants || []).map(p => {
                  const player = players.find(player => player.id === p.playerId);
                  const teamId = p.team === 'aviators' ? getAviatorTeamId() : getProducerTeamId();
                  return {
                    id: p.playerId,
                    name: player?.name || `Player ${p.playerId}`,
                    teamId: teamId,
                    team: p.team === 'aviators' ? 'aviator' : 'producer'
                  };
                }).filter(p => p.name && !p.name.startsWith('Player '));
              })()}
              matchData={match}
              roundHandicapData={[]}
              onScoreUpdate={debouncedSaveBestBallScores}
            />
          )}
          {round?.matchType === "2-man gross" && (
            <TwoManTeamGrossScorecard
              holes={(holes || []).map(hole => ({
                hole_number: hole.number,
                par: hole.par,
                ...(hole.id !== undefined ? { id: hole.id } : {})
              }))}
              scores={(scores || []).map(score => ({
                holeNumber: score.holeNumber,
                aviatorScore: score.aviatorScore,
                producerScore: score.producerScore
              }))}
              locked={isLocked}
            />
          )}
          {round?.matchType === "2-man Team Scramble" && (
            <TwoManTeamScrambleScorecard
              matchId={id}
              holes={holes || []}
              aviatorPlayersList={(() => {
                if (!teams || teams.length === 0) return [];
                const aviatorTeamId = getAviatorTeamId();
                return (participants || [])
                  .filter(p => p.team === 'aviators')
                  .map(p => {
                    const player = players.find(player => player.id === p.playerId);
                    return {
                      id: p.playerId,
                      name: player?.name || `Player ${p.playerId}`,
                      teamId: aviatorTeamId,
                      team: 'aviator' as const
                    };
                  })
                  .filter(p => p.name && !p.name.startsWith('Player '));
              })()}
              producerPlayersList={(() => {
                if (!teams || teams.length === 0) return [];
                const producerTeamId = getProducerTeamId();
                return (participants || [])
                  .filter(p => p.team === 'producers')
                  .map(p => {
                    const player = players.find(player => player.id === p.playerId);
                    return {
                      id: p.playerId,
                      name: player?.name || `Player ${p.playerId}`,
                      teamId: producerTeamId,
                      team: 'producer' as const
                    };
                  })
                  .filter(p => p.name && !p.name.startsWith('Player '));
              })()}
              participants={participants || []}
              allPlayers={(() => {
                if (!teams || teams.length === 0) return [];
                return (participants || []).map(p => {
                  const player = players.find(player => player.id === p.playerId);
                  const teamId = p.team === 'aviators' ? getAviatorTeamId() : getProducerTeamId();
                  return {
                    id: p.playerId,
                    name: player?.name || `Player ${p.playerId}`,
                    teamId: teamId,
                    team: p.team === 'aviators' ? 'aviator' : 'producer'
                  };
                }).filter(p => p.name && !p.name.startsWith('Player '));
              })()}
              matchData={match}
              onScoreUpdate={() => {
                // For Scramble, we don't need to do additional processing
                // The component handles its own score saving via mutations
              }}
            />
          )}
          {round?.matchType === "4-man scramble" && (
            <FourManTeamScrambleScorecard
              holes={(holes || []).map(hole => ({
                hole_number: hole.number,
                par: hole.par,
                ...(hole.id !== undefined ? { id: hole.id } : {})
              }))}
              scores={(scores || []).map(score => ({
                holeNumber: score.holeNumber,
                aviatorScore: score.aviatorScore,
                producerScore: score.producerScore
              }))}
              locked={isLocked}
              onUpdateScores={(updatedScores) => {
                updatedScores.forEach(score => {
                  handleScoreUpdate(score.holeNumber, score.aviatorScore, score.producerScore);
                });
              }}
            />
          )}
        </>
      )}

      {/* Match Completion Dialog */}
      <AlertDialog
        open={showCompletionDialog}
        onOpenChange={setShowCompletionDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Match Complete</AlertDialogTitle>
            <AlertDialogDescription>
              <div className="space-y-4">
                <p className="text-lg font-semibold">Final Score:</p>
                <div className="flex justify-between items-center">
                  <div className="bg-aviator text-white px-4 py-2 rounded">
                    <p className="font-bold">{teams.find(t => t.id === getAviatorTeamId())?.name || "The Aviators"}</p>
                    <p className="text-2xl text-center">
                      {matchSummary.aviatorTotal}
                    </p>
                  </div>
                  <div className="text-xl font-bold">vs</div>
                  <div className="bg-producer text-white px-4 py-2 rounded">
                    <p className="font-bold">{teams.find(t => t.id === getProducerTeamId())?.name || "The Producers"}</p>
                    <p className="text-2xl text-center">
                      {matchSummary.producerTotal}
                    </p>
                  </div>
                </div>

                <div className="mt-4 text-center">
                  <p className="text-lg font-semibold">Match Play Result:</p>
                  <p className="text-xl mt-2">
                    {matchSummary.leadingTeam === "aviators"
                      ? teams.find(t => t.id === getAviatorTeamId())?.name || "The Aviators"
                      : matchSummary.leadingTeam === "producers"
                        ? teams.find(t => t.id === getProducerTeamId())?.name || "The Producers"
                        : "Match"}{" "}
                    {matchSummary.matchPlayResult !== "AS" ? "won" : "tied"}{" "}
                    <span className="font-bold">
                      {matchSummary.matchPlayResult !== "AS" && match ? 
                        `${matchSummary.matchPlayResult.split(" ")[0]}&${18 - (match.currentHole || 1)}` : 
                        matchSummary.matchPlayResult}
                    </span>
                  </p>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction>Close</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Match Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Match</DialogTitle>
            <DialogDescription>
              Update the match details below.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="match-name">Match Name</Label>
              <Input
                id="match-name"
                value={editMatchData.name}
                onChange={(e) =>
                  setEditMatchData({ ...editMatchData, name: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Aviator Players</Label>
              <div className="grid grid-cols-1 gap-2">
                {players
                  ?.filter((p: any) => p.teamId === getAviatorTeamId())
                  .map((player: any) => (
                    <div key={player.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`aviator-${player.id}`}
                        checked={selectedAviatorPlayers.some(p => p.id === player.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedAviatorPlayers([...selectedAviatorPlayers, player]);
                          } else {
                            setSelectedAviatorPlayers(
                              selectedAviatorPlayers.filter((p) => p.id !== player.id)
                            );
                          }
                        }}
                      />
                      <Label htmlFor={`aviator-${player.id}`} className="cursor-pointer">
                        {player.name}
                      </Label>
                    </div>
                  ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Producer Players</Label>
              <div className="grid grid-cols-1 gap-2">
                {players
                  ?.filter((p: any) => p.teamId === getProducerTeamId())
                  .map((player: any) => (
                    <div key={player.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`producer-${player.id}`}
                        checked={selectedProducerPlayers.some(p => p.id === player.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedProducerPlayers([...selectedProducerPlayers, player]);
                          } else {
                            setSelectedProducerPlayers(
                              selectedProducerPlayers.filter((p) => p.id !== player.id)
                            );
                          }
                        }}
                      />
                      <Label htmlFor={`producer-${player.id}`} className="cursor-pointer">
                        {player.name}
                      </Label>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditMatchSubmit}>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Match;