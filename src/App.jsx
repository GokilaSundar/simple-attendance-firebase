import "./App.css";

import { useLayoutEffect } from "react";

import { AuthProvider, ConfigProvider } from "./components";
import { Pages } from "./pages";

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
        <Pages />
      </ConfigProvider>
    </AuthProvider>
  );
};
