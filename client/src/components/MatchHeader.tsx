import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useTeams } from "@/hooks/useTeams";
import aviatorsLogo from "../assets/aviators-logo.svg";
import producersLogo from "../assets/producers-logo.svg";

interface MatchHeaderProps {
  id: number;
  name: string;
  roundId: number;
  roundName?: string;
  matchType?: string;
  leadingTeam: string | null;
  leadAmount: number;
  currentHole: number;
  status?: string;
  result?: string | null;
}

interface Player {
  id: number;
  name: string;
  teamId: number;
}

interface MatchParticipant {
  userId: number;
  team: string;
  player: Player;
}

const MatchHeader = ({
  id,
  name,
  roundId,
  roundName = "Round",
  matchType = "",
  leadingTeam,
  leadAmount,
  currentHole,
  status = "in_progress",
  result = null,
}: MatchHeaderProps) => {
  const [_, navigate] = useLocation();
  
  // Load teams for dynamic team handling
  const { data: teams = [] } = useTeams();

  // Helper functions to get team data dynamically
  const getTeamByIdentifier = (identifier: string) => {
    if (identifier === "aviators") {
      return teams.find(team => 
        team.name.toLowerCase().includes('aviator') || 
        team.name.toLowerCase().includes('aviators')
      ) || { id: 1, name: 'Aviators', shortName: 'AVI' };
    } else if (identifier === "producers") {
      return teams.find(team => 
        team.name.toLowerCase().includes('producer') || 
        team.name.toLowerCase().includes('producers')
      ) || { id: 2, name: 'Producers', shortName: 'PROD' };
    }
    return null;
  };

  // Fetch match participants
  const { data: participants = [] } = useQuery<any[]>({
    queryKey: [`/api/match-players?matchId=${id}`],
  });

  // Fetch all players for reference
  const { data: allPlayers = [] } = useQuery<any[]>({
    queryKey: ["/api/players"],
  });

  // Split participants into teams - now keeping them as array instead of joining with comma
  const aviatorPlayers = Array.isArray(participants) 
    ? participants
        .filter((p: any) => p.team === "aviators")
        .map((p: any) => {
          const player = Array.isArray(allPlayers) 
            ? allPlayers.find((player: any) => player.id === p.playerId)
            : null;
          return player ? player.name : `Player ${p.playerId}`;
        })
    : [];

  const producerPlayers = Array.isArray(participants)
    ? participants
        .filter((p: any) => p.team === "producers")
        .map((p: any) => {
          const player = Array.isArray(allPlayers)
            ? allPlayers.find((player: any) => player.id === p.playerId)
            : null;
          return player ? player.name : `Player ${p.playerId}`;
        })
    : [];

  // Get team names dynamically
  const aviatorTeam = getTeamByIdentifier("aviators");
  const producerTeam = getTeamByIdentifier("producers");

  const handleBackClick = () => {
    navigate(`/rounds/${roundId}`);
  };

  return (
    <div className="mb-6">
      <button 
        className="mb-2 flex items-center font-semibold text-blue-600"
        onClick={handleBackClick}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Round
      </button>
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-gray-800 text-white px-4 py-3">
          <h2 className="font-heading font-bold text-xl">{name}</h2>
          <p className="text-sm text-gray-300">{matchType} • {roundName}</p>
        </div>
        
        <div className="p-4">
          <div className="flex mb-3">
            <div className="w-1/2 border-r border-gray-200 pr-3">
              <div className="flex items-center mb-1">
                <img src={aviatorsLogo} alt={aviatorTeam?.name || "Aviators"} className="w-5 h-5 mr-2" />
                <span className="font-semibold text-sm">{aviatorTeam?.shortName?.toUpperCase() || "AVIATORS"}</span>
              </div>
              <div className="text-sm font-semibold">
                {aviatorPlayers.map((player, index) => (
                  <div key={index} className="leading-tight mb-1">{player}</div>
                ))}
              </div>
            </div>
            
            <div className="w-1/2 pl-3">
              <div className="flex items-center mb-1">
                <img src={producersLogo} alt={producerTeam?.name || "Producers"} className="w-5 h-5 mr-2" />
                <span className="font-semibold text-sm">{producerTeam?.shortName?.toUpperCase() || "PRODUCERS"}</span>
              </div>
              <div className="text-sm font-semibold">
                {producerPlayers.map((player, index) => (
                  <div key={index} className="leading-tight mb-1">{player}</div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Display final match result when completed */}
          {status === "completed" && result ? (
            <div className="flex justify-center items-center">
              <div className="text-center py-2 px-4 rounded-lg font-heading font-bold bg-gray-100 text-lg">
                <span className={leadingTeam === "aviators" ? "text-aviator" : "text-producer"}>
                  {leadingTeam === "aviators" ? aviatorTeam?.name || "Aviators" : producerTeam?.name || "Producers"} win {result}
                </span>
              </div>
            </div>
          ) : status === "upcoming" ? (
            <div className="flex justify-center items-center">
              <div className="text-center py-1 px-3 rounded-lg font-heading font-bold bg-gray-100">
                MATCH PENDING
              </div>
            </div>
          ) : leadingTeam ? (
            <div className="flex justify-center items-center">
              <div className="text-center py-1 px-3 rounded-lg font-heading font-bold bg-gray-100">
                <span className={leadingTeam === "aviators" ? "text-aviator" : "text-producer"}>
                  {leadingTeam === "aviators" ? aviatorTeam?.shortName?.toUpperCase() || "AVIATORS" : producerTeam?.shortName?.toUpperCase() || "PRODUCERS"}
                </span>
                <span className="text-sm font-mono bg-white px-2 py-1 rounded ml-1">
                  {leadAmount > 0 ? `${leadAmount} UP` : "-"}
                </span>
              </div>
              <div className="text-xs text-gray-500 ml-2">
                <span>Hole {currentHole}</span>
              </div>
            </div>
          ) : (
            <div className="flex justify-center items-center">
              <div className="text-center py-1 px-3 rounded-lg font-heading font-bold bg-gray-100">
                ALL SQUARE
              </div>
              <div className="text-xs text-gray-500 ml-2">
                <span>Hole {currentHole}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MatchHeader;
