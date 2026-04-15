/** User profile returned by the API */
export interface UserResponse {
  id: string;
  email: string;
  name: string;
  picture: string | null;
  createdAt: string;
}
