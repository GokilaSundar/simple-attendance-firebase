import "./App.css";
import { AuthProvider } from "./components";
import { Pages } from "./pages";

export const App = () => {
  return (
    <AuthProvider>
      <Pages />
    </AuthProvider>
  );
};
