import { useTheme } from "@emotion/react";
import { Box, CircularProgress, Typography } from "@mui/material";
import PropTypes from "prop-types";

export const LoadingOverlay = ({ loadingText }) => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: theme.palette.background.default,
        zIndex: 9999,
      }}
    >
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          textAlign: "center",
        }}
      >
        <CircularProgress />
        <Typography variant="h6" sx={{ mt: 2 }}>
          {loadingText || "Loading, please wait..."}
        </Typography>
      </Box>
    </Box>
  );
};

LoadingOverlay.propTypes = {
  loadingText: PropTypes.string,
};
