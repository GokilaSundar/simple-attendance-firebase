import { AddBox, Edit } from "@mui/icons-material";
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  TextField,
  useMediaQuery
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers";
import dayjs from "dayjs";
import { ref, set } from "firebase/database";
import { useFormik } from "formik";
import PropTypes from "prop-types";
import { useCallback, useState } from "react";
import * as Yup from "yup";
import { database } from "../../Firebase";

const getInitialData = () => ({
  date: dayjs().format("YYYY-MM-DD"),
  reason: "",
});

const validationSchema = Yup.object().shape({
  date: Yup.string().required("Date is required"),
  reason: Yup.string().required("Reason is required"),
});

export const HolidayEditor = ({ disabled, existingData, onSubmit }) => {
  const isMobile = useMediaQuery((theme) => theme.breakpoints.down("md"));

  const [open, setOpen] = useState(false);

  const {
    errors,
    touched,
    values,
    handleBlur,
    handleChange,
    handleSubmit,
    resetForm,
    setFieldValue,
    setFieldTouched,
    isSubmitting,
  } = useFormik({
    initialValues: existingData || getInitialData(),
    validationSchema,
    onSubmit: async (values) => {
      try {
        await set(ref(database, `/holidays/${values.date}`), values.reason);

        if (typeof onSubmit === "function") {
          onSubmit();
        }

        onClose();
      } catch (error) {
        console.error("Error saving holiday:", error);
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
          {isMobile ? "" : "Add Holiday"}
        </Button>
      )}

      <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
        <DialogTitle>
          {existingData ? "Edit Holiday" : "Add Holiday"}
        </DialogTitle>
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
            <DatePicker
              label="Date"
              value={dayjs(values.date)}
              onChange={(value) => {
                setFieldValue("date", value.format("YYYY-MM-DD"), true);
                setFieldTouched("date", true, true);
              }}
              format="DD/MM/YYYY"
              renderInput={(params) => (
                <TextField
                  {...params}
                  error={Boolean(touched.date && errors.date)}
                  helperText={touched.date && errors.date}
                />
              )}
            />
            <TextField
              label="Reason"
              name="reason"
              value={values.reason}
              onChange={handleChange}
              onBlur={handleBlur}
              error={Boolean(touched.reason && errors.reason)}
              helperText={touched.reason && errors.reason}
              fullWidth
            />
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

HolidayEditor.propTypes = {
  disabled: PropTypes.bool,
  existingData: PropTypes.object,
  onSubmit: PropTypes.func.isRequired,
};
