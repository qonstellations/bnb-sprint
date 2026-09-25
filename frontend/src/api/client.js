import axios from "axios";

export const TOKEN_KEY = "stockpulse_token";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

// Base mirrors API.md: VITE_API_BASE_URL should end with /api/v1
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "/api/v1",
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Force logout on 401 so route guards redirect to /login.
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401) {
      setToken(null);
      if (!window.location.pathname.startsWith("/login")) {
        window.location.assign("/login");
      }
    }
    return Promise.reject(err);
  }
);
