import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";

export interface Team {
  id: number;
  name: string;
  shortName: string;
  colorCode: string;
}

export function useTeams() {
  return useQuery<Team[], Error>({
    queryKey: ["/api/teams"],
    queryFn: getQueryFn({ on401: "throw" }),
  });
}

export default useTeams;
