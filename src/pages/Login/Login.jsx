import { signInWithEmailAndPassword } from "firebase/auth";
import { useCallback, useEffect, useState } from "react";
import { auth } from "../../Firebase";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../components";

export const Login = () => {
  const navigate = useNavigate();

  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const onSubmit = useCallback(
    (e) => {
      e.preventDefault();

      setLoading(true);
      setError(null);

      signInWithEmailAndPassword(auth, email, password)
        .then((userCredentials) => {
          console.log("User signed in:", userCredentials);

          navigate("/");
        })
        .catch((err) => {
          console.error("Error signing in:", err);

          setError(err.message);
        })
        .finally(() => {
          setLoading(false);
        });
    },
    [email, password, navigate]
  );

  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  return (
    <div className="login-page">
      <form onSubmit={onSubmit}>
        <input
          type="email"
          placeholder="Email"
          disabled={loading}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          disabled={loading}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? "Loading..." : "Login"}
        </button>
      </form>
      {error && <p className="error-message">{error}</p>}
    </div>
  );
};

Login.linkPath = "/login";
