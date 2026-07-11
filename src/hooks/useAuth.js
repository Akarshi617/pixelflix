import { useCallback, useEffect, useState } from "react";

const USERS_KEY = "pixelflix:users";
const SESSION_KEY = "pixelflix:session";
const MIN_PASSWORD_LENGTH = 6;

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

// Emails are matched case-insensitively so "Test@mail.com" and
// "test@mail.com" aren't treated as two different accounts.
function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function useAuth() {
  const [user, setUser] = useState(readSession);

  // Keeps auth state in sync if the user logs in/out in another tab —
  // without this, two open tabs could disagree about who's signed in.
  useEffect(() => {
    function handleStorageChange(e) {
      if (e.key === SESSION_KEY) {
        setUser(e.newValue || null);
      }
    }
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const signUp = useCallback((email, password) => {
    const cleanEmail = normalizeEmail(email);

    if (!isValidEmail(cleanEmail)) {
      throw new Error("Please enter a valid email address.");
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      throw new Error(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
    }

    const users = readUsers();
    if (users.some((u) => u.email === cleanEmail)) {
      throw new Error("An account with this email already exists.");
    }

    localStorage.setItem(
      USERS_KEY,
      JSON.stringify([...users, { email: cleanEmail, password }])
    );
    localStorage.setItem(SESSION_KEY, cleanEmail);
    setUser(cleanEmail);
  }, []);

  const logIn = useCallback((email, password) => {
    const cleanEmail = normalizeEmail(email);
    const match = readUsers().find(
      (u) => u.email === cleanEmail && u.password === password
    );

    if (!match) {
      throw new Error("Email or password is incorrect.");
    }

    localStorage.setItem(SESSION_KEY, cleanEmail);
    setUser(cleanEmail);
  }, []);

  const logOut = useCallback(() => {
    localStorage.removeItem(SESSION_KEY);
    setUser(null);
  }, []);

  return { user, isAuthenticated: Boolean(user), signUp, logIn, logOut };
}
