import { AddBox, Edit } from "@mui/icons-material";
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  FormControl,
  FormHelperText,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  useMediaQuery,
} from "@mui/material";
import dayjs from "dayjs";
import { ref, set } from "firebase/database";
import { useFormik } from "formik";
import PropTypes from "prop-types";
import { useCallback, useState } from "react";
import { v4 as uuid } from "uuid";
import * as Yup from "yup";
import { database } from "../../Firebase";
import { useAuth } from "../../components";

const getInitialData = () => ({
  description: "",
  status: "Pending",
  hours: 0,
});

const validationSchema = Yup.object().shape({
  description: Yup.string().required("Description is required"),
  status: Yup.string().required("Status is required"),
  hours: Yup.number()
    .required("Hours are required")
    .positive("Hours must be a positive number")
    .integer("Hours must be an integer")
    .min(0, "Hours cannot be negative")
    .max(8, "Hours cannot exceed 8"),
});

export const TaskEditor = ({ date, disabled, existingData, onSubmit }) => {
  const isMobile = useMediaQuery((theme) => theme.breakpoints.down("md"));

  const { user } = useAuth();

  const [open, setOpen] = useState(false);

  const {
    errors,
    touched,
    values,
    handleBlur,
    handleChange,
    handleSubmit,
    resetForm,
    isSubmitting,
  } = useFormik({
    initialValues: existingData || getInitialData(),
    validationSchema,
    onSubmit: async (values) => {
      try {
        const currentTime = dayjs().toISOString();

        const updated = {
          ...existingData,
          ...values,
          id: existingData?.id || uuid(),
          addedOn: existingData?.addedOn || currentTime,
          updatedOn: currentTime,
        };

        await set(
          ref(database, `/tasks/${user.uid}/${date}/${updated.id}`),
          updated
        );

        if (typeof onSubmit === "function") {
          onSubmit();
        }

        onClose();
      } catch (error) {
        console.error("Error saving task:", error);
      }
    },
  });

  const onClose = useCallback(() => {
    setOpen(false);

    resetForm({
      values: existingData || getInitialData(),
    });
  }, [existingData, resetForm]);

  return (
    <>
      {existingData ? (
        <IconButton disabled={disabled} onClick={() => setOpen(true)}>
          <Edit />
        </IconButton>
      ) : (
        <Button
          variant="contained"
          color="primary"
          disabled={disabled}
          startIcon={<AddBox />}
          sx={
            isMobile
              ? {
                  ".MuiButton-icon": {
                    marginRight: 0,
                    svg: {
                      fontSize: "1.8rem",
                    },
                  },
                }
              : {}
          }
          onClick={() => setOpen(true)}
        >
          {isMobile ? "" : "Add Task"}
        </Button>
      )}

      <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
        <DialogTitle>{existingData ? "Edit Task" : "Add Task"}</DialogTitle>
        <DialogContent>
          <Box
            component="form"
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 2,
              paddingTop: 1,
            }}
            onSubmit={handleSubmit}
          >
            <TextField
              label="Description"
              name="description"
              value={values.description}
              onChange={handleChange}
              onBlur={handleBlur}
              error={Boolean(touched.description && errors.description)}
              helperText={(touched.description && errors.description) || " "}
              fullWidth
            />
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl
                  fullWidth
                  error={Boolean(touched.status && errors.status)}
                >
                  <InputLabel id="status-label">Status</InputLabel>
                  <Select
                    labelId="status-label"
                    id="status-select"
                    label="Status"
                    name="status"
                    value={values.status}
                    onBlur={handleBlur}
                    onChange={handleChange}
                  >
                    <MenuItem value="Pending">Pending</MenuItem>
                    <MenuItem value="In Progress">In Progress</MenuItem>
                    <MenuItem value="Completed">Completed</MenuItem>
                    <MenuItem value="On Hold">On Hold</MenuItem>
                    <MenuItem value="Cancelled">Cancelled</MenuItem>
                  </Select>
                  <FormHelperText>
                    {(touched.status && errors.status) || " "}
                  </FormHelperText>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Hours"
                  name="hours"
                  type="number"
                  value={values.hours}
                  slotProps={{
                    input: {
                      min: 0,
                      max: 8,
                      step: 1,
                    },
                  }}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={Boolean(touched.hours && errors.hours)}
                  helperText={touched.hours && errors.hours}
                  fullWidth
                />
              </Grid>
            </Grid>
            <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
              <Button type="submit" variant="contained" disabled={isSubmitting}>
                Submit
              </Button>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
};

TaskEditor.propTypes = {
  disabled: PropTypes.bool,
  date: PropTypes.string.isRequired,
  existingData: PropTypes.object,
  onSubmit: PropTypes.func.isRequired,
};
