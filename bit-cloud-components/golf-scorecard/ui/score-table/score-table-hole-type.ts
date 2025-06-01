/**
 * Defines the structure for individual hole data used in the ScoreTable.
 */
export interface ScoreTableHoleType {
  /**
   * The official number of the hole (e.g., 1, 2, ..., 18).
   */
  holeNumber: number;
  /**
   * The par value for the hole. Optional.
   */
  par?: number;
  /**
   * The stroke index (handicap rating) of the hole, used to determine where handicap strokes are applied.
   * Lower numbers indicate harder holes.
   */
  strokeIndex: number;
}