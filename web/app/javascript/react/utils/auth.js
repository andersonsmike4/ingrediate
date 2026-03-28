import { csrfToken } from "./csrf";

export async function checkAuthStatus() {
  const response = await fetch("/api/auth/status");
  if (!response.ok) return { authenticated: false, user: null };
  return response.json();
}

export async function login(email, password) {
  const response = await fetch("/api/auth/sign_in", {
    method: "POST",
    headers: {
      "X-CSRF-Token": csrfToken(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ user: { email, password } }),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || "Invalid email or password");
  }
  return response.json();
}

export async function signup(name, email, password, passwordConfirmation) {
  const response = await fetch("/api/auth/sign_up", {
    method: "POST",
    headers: {
      "X-CSRF-Token": csrfToken(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      user: { name, email, password, password_confirmation: passwordConfirmation },
    }),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.errors?.join(", ") || "Signup failed");
  }
  return response.json();
}

export async function logout() {
  const response = await fetch("/api/auth/sign_out", {
    method: "DELETE",
    headers: { "X-CSRF-Token": csrfToken() },
  });
  if (!response.ok) throw new Error("Logout failed");
  return response.json();
}

export function googleAuthUrl() {
  return "/api/auth/google_oauth2";
}
