import PropTypes from "prop-types";
import { useEffect, useState } from "react";

import { AuthContext } from "./AuthContext.js";
import { auth } from "../../Firebase.js";

export const AuthProvider = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    auth.onAuthStateChanged((user) => {
      if (user) {
        setUser(user);
      } else {
        setUser(null);
      }

      setLoading(false);
    });
  }, []);

  return (
    <AuthContext.Provider value={{ loading, setLoading, user, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
