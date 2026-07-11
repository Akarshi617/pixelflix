import { useCallback, useState } from "react";

const USERS_KEY = "pixelflix:users";
const SESSION_KEY = "pixelflix:session";

// NOTE: this is a client-only demo (no backend in this sprint), so
// passwords are stored in plain text in localStorage. Fine for a college
// project, but never do this in a real app — a backend + hashed passwords
// would replace all of this.

function readUsers() {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function readSession() {
  try {
    return localStorage.getItem(SESSION_KEY) || null;
  } catch {
    return null;
  }
}

export function useAuth() {
  const [user, setUser] = useState(readSession);

  const signUp = useCallback((email, password) => {
    const users = readUsers();
    if (users.some((u) => u.email === email)) {
      throw new Error("An account with this email already exists.");
    }
    localStorage.setItem(USERS_KEY, JSON.stringify([...users, { email, password }]));
    localStorage.setItem(SESSION_KEY, email);
    setUser(email);
  }, []);

  const logIn = useCallback((email, password) => {
    const match = readUsers().find((u) => u.email === email && u.password === password);
    if (!match) {
      throw new Error("Email or password is incorrect.");
    }
    localStorage.setItem(SESSION_KEY, email);
    setUser(email);
  }, []);

  const logOut = useCallback(() => {
    localStorage.removeItem(SESSION_KEY);
    setUser(null);
  }, []);

  return { user, signUp, logIn, logOut };
}
