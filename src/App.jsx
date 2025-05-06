import { useLayoutEffect } from "react";
import "./App.css";
import { AuthProvider } from "./components";
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
      <Pages />
    </AuthProvider>
  );
};
