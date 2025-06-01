import React from 'react';
import classNames from 'classnames';
import { Card } from '@shanyewest/best-ball-scorecard.content.card';
import { Table, type ColumnDefinition } from '@shanyewest/best-ball-scorecard.data-display.table';
import { Heading } from '@shanyewest/best-ball-scorecard.typography.heading';
import { Text } from '@shanyewest/best-ball-scorecard.typography.text';

import type { ScoreTableHoleType } from './score-table-hole-type.js';
import type { ScoreTablePlayerType } from './score-table-player-type.js';
import type { ScoreTableTeamType } from './score-table-team-type.js';
import styles from './score-table.module.scss';

/**
 * Represents the processed data structure for each row (hole) in the ScoreTable.
 */
interface ProcessedHoleData {
  key: string; // Unique key for React rendering, e.g., `hole-${holeNumber}`
  holeNumber: number;
  par?: number;
  strokeIndex: number;
  // Dynamically added player scores: { [playerId_gross]: number | '-', [playerId_net]: number | '-' }
  // Dynamically added team scores: { [teamId_bestGross]: number | '-', [teamId_bestNet]: number | '-' }
  // Store raw calculation results for accessors
  _playerScores: {
    [playerId: string]: {
      gross: number | null;
      net: number | null;
      receivesStroke: boolean;
    };
  };
  _teamScores: {
    [teamId: string]: {
      bestGross: number | null;
      bestNet: number | null;
    };
  };
}

export interface ScoreTableProps {
  /**
   * Optional title for the score table card.
   * @default "Scorecard"
   */
  title?: string;
  /**
   * Array of hole data, defining number, par (optional), and stroke index for each hole.
   */
  holes: ScoreTableHoleType[];
  /**
   * Array of player data, including ID, name, team affiliation, handicap, and gross scores per hole.
   */
  players: ScoreTablePlayerType[];
  /**
   * Array of team data, typically two teams for a 2v2 match, defining team ID, name, and player IDs.
   * It is expected that this array contains exactly two teams for 2v2 match play logic.
   */
  teams: ScoreTableTeamType[];
  /**
   * Optional CSS class name to apply to the root Card component.
   */
  className?: string;
  /**
   * Optional inline styles to apply to the root Card component.
   */
  style?: React.CSSProperties;
}

function isValidScore(score: number | null | undefined): score is number {
  return typeof score === 'number' && !Number.isNaN(score);
}

/**
 * The ScoreTable component displays detailed golf scores in a tabular format,
 * suitable for 2v2 match play net scoring. It shows individual gross scores,
 * calculated net scores, and team best ball scores per hole.
 */
export function ScoreTable({
  title = 'Scorecard',
  holes,
  players,
  teams,
  className,
  style,
}: ScoreTableProps): React.JSX.Element {
  // Calculate strokes received by each player
  const strokesGivenMap: { [playerId: string]: number } = React.useMemo(() => {
    if (players.length === 0) return {};
    const minHandicap = Math.min(...players.map((p) => p.courseHandicap));
    return players.reduce((acc, player) => {
      acc[player.id] = player.courseHandicap - minHandicap;
      return acc;
    }, {} as { [playerId: string]: number });
  }, [players]);

  // Process data for table rows
  const tableData: ProcessedHoleData[] = React.useMemo(() => {
    return holes.map((hole, holeIndex) => {
      const processedHole: ProcessedHoleData = {
        key: `hole-${hole.holeNumber}`,
        holeNumber: hole.holeNumber,
        par: hole.par,
        strokeIndex: hole.strokeIndex,
        _playerScores: {},
        _teamScores: {},
      };

      players.forEach((player) => {
        const grossScore = player.holeScores[holeIndex]?.gross;
        const strokesForThisPlayer = strokesGivenMap[player.id] || 0;
        const receivesStrokeOnThisHole = hole.strokeIndex <= strokesForThisPlayer;
        let netScore: number | null = null;
        if (isValidScore(grossScore)) {
          netScore = grossScore - (receivesStrokeOnThisHole ? 1 : 0);
        }
        processedHole._playerScores[player.id] = {
          gross: grossScore,
          net: netScore,
          receivesStroke: receivesStrokeOnThisHole,
        };
      });

      teams.forEach((team) => {
        const teamPlayerIds = team.playerIds;
        const teamPlayerScores = teamPlayerIds
          .map((pid) => processedHole._playerScores[pid])
          .filter(Boolean); // Filter out if a player ID is somehow missing

        const validGrossScores = teamPlayerScores
          .map((ps) => ps.gross)
          .filter(isValidScore);
        const validNetScores = teamPlayerScores
          .map((ps) => ps.net)
          .filter(isValidScore);

        processedHole._teamScores[team.id] = {
          bestGross: validGrossScores.length > 0 ? Math.min(...validGrossScores) : null,
          bestNet: validNetScores.length > 0 ? Math.min(...validNetScores) : null,
        };
      });
      return processedHole;
    });
  }, [holes, players, teams, strokesGivenMap]);

  // Define table columns
  const columns: ColumnDefinition<ProcessedHoleData>[] = React.useMemo(() => {
    const cols: ColumnDefinition<ProcessedHoleData>[] = [];

    cols.push({
      id: 'holeNumber',
      header: 'Hole',
      accessor: 'holeNumber',
      width: '60px',
      headerStyle: { textAlign: 'center' },
      cellStyle: { textAlign: 'center', position: 'sticky', left: 0, backgroundColor: 'inherit', zIndex: 1 }, // Added sticky for data cell
      headerClassName: classNames(styles.holeInfoColumnHeader, styles.stickyHeaderCell), // Ensure header is sticky
    });

    if (holes.some(h => h.par !== undefined)) {
      cols.push({
        id: 'par',
        header: 'Par',
        accessor: (item) => item.par ?? '-',
        width: '50px',
        headerStyle: { textAlign: 'center' },
        cellStyle: { textAlign: 'center' },
        headerClassName: styles.holeInfoColumnHeader,
      });
    }

    cols.push({
      id: 'strokeIndex',
      header: 'SI',
      accessor: 'strokeIndex',
      width: '50px',
      headerStyle: { textAlign: 'center' },
      cellStyle: { textAlign: 'center' },
      headerClassName: styles.holeInfoColumnHeader,
    });

    players.forEach((player) => {
      cols.push({
        id: `player-${player.id}-gross`,
        header: `${player.name.split(' ')[0]} Gross`, // Shorten header
        accessor: (item) => item._playerScores[player.id]?.gross ?? '-',
        width: '85px', // Adjust as needed
        headerStyle: { textAlign: 'center' },
        cellStyle: { textAlign: 'center' },
        headerClassName: styles.playerScoreColumnHeader,
      });
      cols.push({
        id: `player-${player.id}-net`,
        header: `${player.name.split(' ')[0]} Net`, // Shorten header
        accessor: (item) => {
          const scoreData = item._playerScores[player.id];
          if (!scoreData) return '-';
          return (
            <Text as="span" className={styles.netScoreCellText}>
              {isValidScore(scoreData.net) ? scoreData.net : '-'}
              {scoreData.receivesStroke && isValidScore(scoreData.gross) && (
                <span className={styles.strokeAppliedIndicator}>*</span>
              )}
            </Text>
          );
        },
        width: '85px', // Adjust as needed
        headerStyle: { textAlign: 'center' },
        cellStyle: { textAlign: 'center' },
        headerClassName: styles.playerScoreColumnHeader,
      });
    });

    teams.forEach((team) => {
      cols.push({
        id: `team-${team.id}-bestGross`,
        header: `${team.name} Gross`, // Shorten header
        accessor: (item) => item._teamScores[team.id]?.bestGross ?? '-',
        width: '100px', // Adjust as needed
        headerStyle: { textAlign: 'center' },
        cellStyle: { textAlign: 'center', fontWeight: 'var(--typography-font-weight-bold)' },
        headerClassName: styles.teamScoreColumnHeader,
      });
      cols.push({
        id: `team-${team.id}-bestNet`,
        header: `${team.name} Net`, // Shorten header
        accessor: (item) => item._teamScores[team.id]?.bestNet ?? '-',
        width: '100px', // Adjust as needed
        headerStyle: { textAlign: 'center' },
        cellStyle: { textAlign: 'center', fontWeight: 'var(--typography-font-weight-bold)' },
        headerClassName: styles.teamScoreColumnHeader,
      });
    });

    return cols;
  }, [holes, players, teams, styles]); // Added styles to dependency array for classNames

  return (
    <div className={styles.scoreTableRoot}>
      <Card className={classNames(styles.scoreTableCard, className)} style={style}>
        {title && <Heading level={3} className={styles.titleHeading}>{title}</Heading>}
        <Table<ProcessedHoleData>
          columns={columns}
          data={tableData}
          keyExtractor={(item) => item.key}
          className={styles.scoreTable}
          emptyStateMessage={<Text>No hole data available to display scores.</Text>}
        />
      </Card>
    </div>
  );
}