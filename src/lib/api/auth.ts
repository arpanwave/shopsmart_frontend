import { api } from "./client";
import type { User } from "./types";

export const auth = {

  register: (
    username: string,
    email: string,
    password: string
  ) =>
    api.post<unknown>(
      "/api/auth/register",
      {
        username,
        email,
        password,
      }
    ),

  login: async (
    username: string,
    password: string
  ) => {

    return api.post<unknown>(
      "/api/auth/login",
      {
        username,
        password,
      }
    );
  },

  logout: async () => {

    return api.post<unknown>(
      "/api/auth/logout",
      undefined,
      { auth: false }
    );
  },

  refresh: async () => {

    return api.post<unknown>(
      "/api/auth/refresh",
      undefined,
      { auth: false }
    );
  },

  me: () =>
    api.get<User>(
      "/api/users/me"
    ),
};
