import { child, get, ref, set } from "firebase/database";
import PropTypes from "prop-types";
import { useCallback, useEffect, useState } from "react";

import { auth, database } from "../../Firebase.js";
import { AuthContext } from "./AuthContext.js";

const usersRef = ref(database, "users/");

export const AuthProvider = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  const handleAuthStateChanged = useCallback(async (user) => {
    if (user) {
      try {
        const snapshot = await get(child(usersRef, user.uid));

        if (snapshot.exists()) {
          setUser(snapshot.val());
        } else {
          const userData = {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || "New User",
            role: "user",
          };

          await set(child(usersRef, user.uid), userData);

          setUser(userData);
        }
      } catch (error) {
        console.error("Error handling user data:", error);
        setUser(null);
      }
    } else {
      setUser(null);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(handleAuthStateChanged);

    return () => unsubscribe();
  }, [handleAuthStateChanged]);

  return (
    <AuthContext.Provider value={{ loading, setLoading, user, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
