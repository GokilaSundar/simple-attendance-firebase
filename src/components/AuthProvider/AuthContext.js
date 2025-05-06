import { createContext, useContext } from "react";

export const AuthContext = createContext({
  loading: true,
  setLoading: () => null,
  user: null,
  setUser: () => null,
});

export const useAuth = () => useContext(AuthContext);
