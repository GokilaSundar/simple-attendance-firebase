import "./App.css";

import { createTheme, ThemeProvider } from "@mui/material";
import { useLayoutEffect } from "react";

import { AuthProvider, ConfigProvider } from "./components";
import { Pages } from "./pages";

const theme = createTheme();

export const App = () => {
  useLayoutEffect(() => {
    const preloader = document.getElementById("preloader");

    if (preloader) {
      preloader.remove();
    }
  }, []);

  return (
    <AuthProvider>
      <ConfigProvider>
        <ThemeProvider theme={theme}>
          <Pages />
        </ThemeProvider>
      </ConfigProvider>
    </AuthProvider>
  );
};
