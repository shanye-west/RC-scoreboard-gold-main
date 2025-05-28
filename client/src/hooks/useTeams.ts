import { useQuery } from "@tanstack/react-query";

export interface Team {
  id: number;
  name: string;
  shortName: string;
  colorCode: string;
}

export function useTeams() {
  return useQuery<Team[]>({
    queryKey: ['/api/teams'],
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
}

export function useTeamById(teamId: number | undefined) {
  const { data: teams, ...query } = useTeams();
  
  const team = teams?.find(t => t.id === teamId);
  
  return {
    ...query,
    data: team,
  };
}

export function useTeamByShortName(shortName: string | undefined) {
  const { data: teams, ...query } = useTeams();
  
  const team = teams?.find(t => t.shortName.toLowerCase() === shortName?.toLowerCase());
  
  return {
    ...query,
    data: team,
  };
}

// Helper function to get team identifier (shortName or id) from team object
export function getTeamIdentifier(team: Team): string {
  return team.shortName.toLowerCase();
}

// Helper function to get team display name
export function getTeamDisplayName(team: Team): string {
  return team.name;
}

// Helper function to get team by ID from teams array
export function getTeamById(teams: Team[], teamId: number): Team | undefined {
  return teams.find(t => t.id === teamId);
}
