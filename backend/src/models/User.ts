/** User profile returned by the API */
export interface UserResponse {
  id: string;
  email: string;
  name: string;
  picture: string | null;
  age: number | null;
  weightKg: number | null;
  heightCm: number | null;
  restTimeSeconds: number;
  createdAt: string;
}

export interface UpdateProfileBody {
  name?: string;
  age?: number | null;
  weightKg?: number | null;
  heightCm?: number | null;
  restTimeSeconds?: number;
}
