/** Exercise returned by the API */
export interface ExerciseResponse {
  id: string;
  name: string;
  description: string;
  category: string;
  focus: string[];
  intensity: number;
  defaultSets: number | null;
  defaultReps: number | null;
}
