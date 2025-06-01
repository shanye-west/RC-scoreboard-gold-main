import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useTeams } from "@/hooks/useTeams";

interface HoleScore {
  holeNumber: number;
  aviatorScore: number | null;
  producerScore: number | null;
}

interface ScorecardProps {
  holes: { hole_number: number }[];
  scores: HoleScore[];
  locked?: boolean;
  onUpdateScores?: (scores: HoleScore[]) => void;
}

const TwoManTeamScrambleScorecard: React.FC<ScorecardProps> = ({
  holes = [],
  scores = [],
  locked = false,
  onUpdateScores,
}) => {
  const { data: teams = [] } = useTeams();

  // Helper functions to get team IDs dynamically
  const getAviatorTeamId = () => {
    const aviatorTeam = teams.find(team =>
      team.name.toLowerCase().includes('aviator') ||
      team.name.toLowerCase().includes('aviators')
    );
    return aviatorTeam?.id || 1;
  };

  const getProducerTeamId = () => {
    const producerTeam = teams.find(team =>
      team.name.toLowerCase().includes('producer') ||
      team.name.toLowerCase().includes('producers')
    );
    return producerTeam?.id || 2;
  };

  const handleScoreChange = (holeIndex: number, team: 'aviator' | 'producer', value: string) => {
    const newScores = [...scores];
    const score = parseInt(value, 10);
    if (!isNaN(score)) {
      if (team === 'aviator') newScores[holeIndex].aviatorScore = score;
      else newScores[holeIndex].producerScore = score;
      onUpdateScores?.(newScores);
    }
  };

  // Get team names dynamically
  const aviatorTeamName = teams.find(team => team.id === getAviatorTeamId())?.name || 'Aviators';
  const producerTeamName = teams.find(team => team.id === getProducerTeamId())?.name || 'Producers';

  return (
    <Card className="rounded-2xl shadow p-4">
      <CardHeader>
        <CardTitle>2-Man Team Scramble Scorecard</CardTitle>
      </CardHeader>
      <CardContent>
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th>Hole</th>
              <th>{aviatorTeamName}</th>
              <th>{producerTeamName}</th>
            </tr>
          </thead>
          <tbody>
            {holes.map((hole, i) => (
              <tr key={i} className="border-t">
                <td className="text-center">{hole.hole_number}</td>
                <td>
                  <Input
                    type="number"
                    className="text-center"
                    value={scores[i]?.aviatorScore ?? ''}
                    disabled={locked}
                    onChange={(e) => handleScoreChange(i, 'aviator', e.target.value)}
                  />
                </td>
                <td>
                  <Input
                    type="number"
                    className="text-center"
                    value={scores[i]?.producerScore ?? ''}
                    disabled={locked}
                    onChange={(e) => handleScoreChange(i, 'producer', e.target.value)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
};

export default TwoManTeamScrambleScorecard;
