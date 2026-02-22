export type AuthTokenPair = {
  accessToken: string;
  refreshToken: string;
};

export type AuthGateway = {
  login: (username: string, password: string) => Promise<AuthTokenPair | null>;
  refresh: (refreshToken: string) => Promise<AuthTokenPair | null>;
  verify: (token: string) => Promise<boolean>;
};
