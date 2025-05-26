import React, { useEffect } from "react";
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
  useEffect(() => {
    const updatedScores = playerScores.map(player => {
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

    onUpdateScores?.(updatedScores);
  }, [playerScores, holes, onUpdateScores]);

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
                <td className="text-center font-bold">{hole.hole_number}</td>
                {playerScores.map((player, j) => (
                  <td key={j} className={`text-center ${player.isBestBall[i] ? 'bg-green-100 font-bold' : ''}`}>
                    <Input
                      type="number"
                      value={player.scores[i] ?? ''}
                      disabled={locked}
                      onChange={(e) => handleScoreChange(j, i, e.target.value)}
                    />
                    {player.handicapStrokes[i] > 0 && (
                      <div className="text-xs text-gray-500">-{player.handicapStrokes[i]}</div>
                    )}
                    {player.netScores[i] !== null && (
                      <div className="text-xs text-blue-600">Net: {player.netScores[i]}</div>
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
