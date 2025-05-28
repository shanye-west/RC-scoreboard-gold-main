import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { useTeams, getTeamIdentifier } from "@/hooks/useTeams";

interface Player {
  id: number;
  name: string;
  teamId: number;
  wins: number;
  losses: number;
  ties: number;
}

const Teams = () => {
  const [_, navigate] = useLocation();
  const { data: teams = [], isLoading: isTeamsLoading } = useTeams();
  const [activeTeamId, setActiveTeamId] = useState<number | null>(null);

  // Set default active team to the first team when teams are loaded
  useEffect(() => {
    if (teams.length > 0 && activeTeamId === null) {
      setActiveTeamId(teams[0].id);
    }
  }, [teams, activeTeamId]);

  // Fetch players data
  const { data: players, isLoading: isPlayersLoading } = useQuery<Player[]>({
    queryKey: ['/api/players'],
  });

  const isLoading = isTeamsLoading || isPlayersLoading;

  const handleBackClick = () => {
    navigate('/');
  };

  // Group players by team and sort them by record
  const playersByTeam = players?.reduce((acc: Record<number, Player[]>, player: Player) => {
    if (!acc[player.teamId]) {
      acc[player.teamId] = [];
    }
    acc[player.teamId].push(player);
    return acc;
  }, {});
  
  // Calculate win percentage for sorting
  const calculateWinPercentage = (player: Player) => {
    const total = player.wins + player.losses + player.ties;
    if (total === 0) return 0;
    return (player.wins + player.ties * 0.5) / total;
  };
  
  // Sort players by win percentage, then by wins
  if (playersByTeam) {
    Object.keys(playersByTeam).forEach(teamId => {
      playersByTeam[Number(teamId)].sort((a, b) => {
        const aPercentage = calculateWinPercentage(a);
        const bPercentage = calculateWinPercentage(b);
        
        if (bPercentage !== aPercentage) {
          return bPercentage - aPercentage;
        }
        
        // If percentages are equal, sort by number of wins
        if (b.wins !== a.wins) {
          return b.wins - a.wins;
        }
        
        // If wins are equal, sort alphabetically
        return a.name.localeCompare(b.name);
      });
    });
  }

  // Helper function to get team logo/image
  const getTeamLogo = (teamId: number) => {
    const team = teams.find(t => t.id === teamId);
    if (!team) return null;
    
    const identifier = getTeamIdentifier(team);
    // Try to import team-specific assets
    try {
      return require(`@/assets/${identifier}-text.svg`);
    } catch {
      // Fallback if no specific asset exists
      return null;
    }
  };

  // Helper function to get team color
  const getTeamColor = (teamId: number) => {
    const team = teams.find(t => t.id === teamId);
    if (team?.colorCode) {
      // Convert hex color to rgba with opacity
      const hex = team.colorCode.replace('#', '');
      const r = parseInt(hex.substr(0, 2), 16);
      const g = parseInt(hex.substr(2, 2), 16);
      const b = parseInt(hex.substr(4, 2), 16);
      return `rgba(${r}, ${g}, ${b}, 0.05)`;
    }
    return 'rgba(128, 128, 128, 0.05)'; // Default gray
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="font-heading text-2xl font-bold mb-6">Team Rosters</h1>

      {isLoading ? (
        <div className="space-y-6">
          <div>
            <Skeleton className="h-10 w-36 mb-3" />
            <div className="space-y-2">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="flex justify-between items-center border-b-2 border-gray-200 pb-4">
            {teams.map(team => {
              const teamLogo = getTeamLogo(team.id);
              return (
                <div 
                  key={team.id}
                  className={`cursor-pointer transition-opacity ${
                    activeTeamId === team.id ? 'opacity-100' : 'opacity-30'
                  }`}
                  onClick={() => setActiveTeamId(team.id)}
                >
                  {teamLogo ? (
                    <img src={teamLogo} alt={team.name} className="h-8" />
                  ) : (
                    <div className="h-8 px-4 py-1 bg-gray-200 rounded text-center">
                      {team.name}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          
          <div className="divide-y">
            {activeTeamId && playersByTeam?.[activeTeamId]?.map((player: Player) => {
              const teamColor = getTeamColor(activeTeamId);
              return (
                <div 
                  key={player.id} 
                  className="py-3 flex justify-between items-center px-3 rounded-md"
                  style={{ backgroundColor: teamColor }}
                >
                  <span className="font-medium">{player.name}</span>
                  <div className="flex items-center space-x-3">
                    <span className={`px-3 py-1 rounded-md text-white font-mono ${
                      player.wins > player.losses 
                        ? 'bg-green-600' 
                        : player.losses > player.wins 
                          ? 'bg-red-600' 
                          : 'bg-gray-500'
                    }`}>
                      {player.wins}-{player.losses}-{player.ties}
                    </span>
                    {player.wins + player.losses + player.ties > 0 && (
                      <div className="text-xs text-muted-foreground">
                        {((player.wins / (player.wins + player.losses + player.ties)) * 100).toFixed(0)}%
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default Teams;