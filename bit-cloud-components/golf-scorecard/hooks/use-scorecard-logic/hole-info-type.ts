/**
 * Represents information about a single hole on the course.
 * @property {number} holeNumber - The sequential number of the hole (e.g., 1 through 18).
 * @property {number} handicapRating - The difficulty rating of the hole (stroke index), typically 1 (hardest) to 18 (easiest).
 */
export type HoleInfo = {
  holeNumber: number;
  handicapRating: number;
};