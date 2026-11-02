import { createContext, useContext, useEffect, useState } from "react";
import { getToken, getSavedUser, saveLogin, clearLogin, setUnauthorizedHandler } from "../api/client.js";
import { getMe } from "../api/endpoints.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getSavedUser());
  const [checking, setChecking] = useState(Boolean(getToken()));

  function login(token, newUser) {
    saveLogin(token, newUser);
    setUser(newUser);
  }

  function logout() {
    clearLogin();
    setUser(null);
  }

  // any 401 from the API logs the user out
  useEffect(function () {
    setUnauthorizedHandler(logout);
  }, []);

  // on first load, make sure the saved token still works
  useEffect(function () {
    if (!getToken()) return;

    getMe()
      .then(function (data) {
        saveLogin(getToken(), data.user);
        setUser(data.user);
      })
      .catch(function () {
        logout();
      })
      .finally(function () {
        setChecking(false);
      });
  }, []);

  const value = { user: user, checking: checking, login: login, logout: logout };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
