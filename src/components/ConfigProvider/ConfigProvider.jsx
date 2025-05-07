import dayjs from "dayjs";
import { get, ref } from "firebase/database";
import PropTypes from "prop-types";
import { useEffect, useMemo, useState } from "react";

import { database } from "../../Firebase.js";
import { ConfigContext } from "./ConfigContext.js";
import { useAuth } from "../AuthProvider/AuthContext.js";

export const ConfigProvider = ({ children }) => {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState({
    startDate: "2025-01-01",
    currentDate: dayjs().format("YYYY-MM-DD"),
  });

  const value = useMemo(() => ({ ...config, loading }), [config, loading]);

  useEffect(() => {
    const fetchConfig = async () => {
      setLoading(true);

      try {
        if (!user) {
          console.warn("User is not authenticated. Skipping config fetch.");
          setLoading(false);
          return;
        }

        const snapshot = await get(ref(database, "/config"));

        if (snapshot.exists()) {
          setConfig(snapshot.val());
        } else {
          console.error("No config data found in the database.");
        }
      } catch (error) {
        console.error("Error fetching config data:", error);
      }

      setLoading(false);
    };

    fetchConfig();
  }, [user]);

  return (
    <ConfigContext.Provider value={value}>{children}</ConfigContext.Provider>
  );
};

ConfigProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
