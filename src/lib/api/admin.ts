import { api } from "./client";
import type { Page, User } from "./types";

export const admin = {
  listUsers: (page = 0, size = 10) =>
    api.get<Page<User>>(`/api/admin/users?page=${page}&size=${size}`),
  block: (id: string | number) => api.put<unknown>(`/api/admin/users/${id}/block`),
  unblock: (id: string | number) => api.put<unknown>(`/api/admin/users/${id}/unblock`),
};
