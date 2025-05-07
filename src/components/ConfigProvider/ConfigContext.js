import dayjs from "dayjs";
import { createContext, useContext } from "react";

export const ConfigContext = createContext({
  loading: false,
  startDate: "2025-01-01",
  currentDate: dayjs().format("YYYY-MM-DD"),
});

export const useConfig = () => useContext(ConfigContext);
