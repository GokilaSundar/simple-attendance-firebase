import { Box, Typography } from "@mui/material";

export const Unauthorized = () => {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        flexGrow: 1,
      }}
    >
      <Typography variant="h4" component="h1" gutterBottom>
        Unauthorized Access
      </Typography>
      <Typography variant="body1" component="p">
        You do not have permission to view this page.
      </Typography>
    </Box>
  );
};
