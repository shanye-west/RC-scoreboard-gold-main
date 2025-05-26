import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

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
  const handleScoreChange = (playerIndex: number, holeIndex: number, value: string) => {
    const newScores = [...playerScores];
    const score = parseInt(value, 10);
    newScores[playerIndex].scores[holeIndex] = isNaN(score) ? null : score;
    onUpdateScores?.(newScores);
  };

  return (
    <Card className="rounded-2xl shadow p-4">
      <CardHeader>
        <CardTitle>2-Man Team Best Ball Scorecard</CardTitle>
      </CardHeader>
      <CardContent>
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th>Hole</th>
              {playerScores.map((player, i) => (
                <th key={i} className="text-center">
                  {player.playerName}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {holes.map((hole, i) => (
              <tr key={i} className="border-t">
                <td className="text-center">{hole.hole_number}</td>
                {playerScores.map((player, j) => (
                  <td key={j} className="text-center">
                    <Input
                      type="number"
                      value={player.scores[i] ?? ''}
                      disabled={locked}
                      onChange={(e) => handleScoreChange(j, i, e.target.value)}
                    />
                    {player.handicapStrokes[i] > 0 && (
                      <div className="text-xs text-gray-500">+{player.handicapStrokes[i]}</div>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
};

export default TwoManTeamBestBallScorecard;