/** Request body for user registration */
export interface RegisterBody {
  email: string;
  password: string;
  name: string;
}

/** Request body for user login */
export interface LoginBody {
  email: string;
  password: string;
}

/** Response after successful authentication */
export interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
    picture: string | null;
  };
}
