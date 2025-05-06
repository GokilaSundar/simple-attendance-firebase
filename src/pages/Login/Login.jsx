import "./Login.css";

import { Button, TextField, Typography } from "@mui/material";
import { useFormik } from "formik";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as Yup from "yup";

import { useAuth } from "../../components";
import { auth } from "../../Firebase";

const initialState = {
  email: "",
  password: "",
};

const validationSchema = Yup.object().shape({
  email: Yup.string().email("Invalid email").required("Required"),
  password: Yup.string().required("Required"),
});

export const Login = () => {
  const navigate = useNavigate();

  const { user } = useAuth();

  const [error, setError] = useState(null);

  const onSubmit = useCallback(
    async (values) => {
      setError(null);

      try {
        const userCredentials = await signInWithEmailAndPassword(
          auth,
          values.email,
          values.password
        );
        console.log("User signed in:", userCredentials);
        navigate("/");
      } catch (err) {
        console.error("Error signing in:", err);
        setError(err.message);
      }
    },
    [navigate]
  );

  const {
    errors,
    touched,
    values,
    handleChange,
    handleBlur,
    handleSubmit,
    isSubmitting,
    isValid,
  } = useFormik({
    initialValues: initialState,
    validationSchema,
    onSubmit,
  });

  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  return (
    <div className="login-page">
      <form onSubmit={handleSubmit}>
        <Typography variant="h4" gutterBottom textAlign="center">
          Login
        </Typography>
        <TextField
          label="Email"
          name="email"
          onChange={handleChange}
          onBlur={handleBlur}
          value={values.email}
          disabled={isSubmitting}
          error={Boolean(errors.email && touched.email)}
          helperText={errors.email || " "}
          fullWidth
        />
        <TextField
          label="Password"
          name="password"
          type="password"
          onChange={handleChange}
          onBlur={handleBlur}
          value={values.password}
          disabled={isSubmitting}
          error={Boolean(errors.password && touched.password)}
          helperText={errors.password || " "}
          fullWidth
        />

        <Button
          type="submit"
          disabled={
            isSubmitting || !isValid || !values.email || !values.password
          }
          loading={isSubmitting}
          variant="contained"
        >
          Login
        </Button>
      </form>
      {error && <p className="error-message">{error}</p>}
    </div>
  );
};

Login.linkPath = "/login";
