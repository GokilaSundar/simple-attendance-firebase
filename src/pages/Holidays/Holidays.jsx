import { useTheme } from "@emotion/react";
import { Delete, Event, LibraryAdd } from "@mui/icons-material";
import {
  Box,
  Button,
  Divider,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers";
import dayjs from "dayjs";
import {
  ref,
  remove,
  update
} from "firebase/database";
import PropTypes from "prop-types";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { LoadingOverlay, useAuth, useConfig } from "../../components";
import { database } from "../../Firebase";
import { fetchHolidays } from "../../Utils.js";
import { HolidayEditor } from "./HolidayEditor.jsx";

const HolidayRow = ({ item, isAdmin, onSubmit }) => {
  const [loading, setLoading] = useState(false);

  const onDelete = useCallback(async () => {
    setLoading(true);

    try {
      await remove(ref(database, `/holidays/${item.date}`));

      if (typeof onSubmit === "function") {
        onSubmit();
      }
    } catch (error) {
      console.error("Failed to delete holiday!", error);
    }

    setLoading(false);
  }, [item.date, onSubmit]);

  return (
    <TableRow key={item.date}>
      <TableCell>{dayjs(item.date).format("DD/MM/YYYY (dddd)")}</TableCell>
      <TableCell>{item.reason}</TableCell>
      {isAdmin && (
        <>
          <TableCell>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              <HolidayEditor
                disabled={loading}
                existingData={item}
                onSubmit={onSubmit}
              />

              <IconButton disabled={loading} onClick={onDelete}>
                <Delete />
              </IconButton>
            </Box>
          </TableCell>
        </>
      )}
    </TableRow>
  );
};

HolidayRow.propTypes = {
  item: PropTypes.shape({
    date: PropTypes.string.isRequired,
    reason: PropTypes.string.isRequired,
  }),
  isAdmin: PropTypes.bool,
  onSubmit: PropTypes.func,
};

const AutoAddHolidays = ({ startDate, endDate, onSubmit }) => {
  const isMobile = useMediaQuery((theme) => theme.breakpoints.down("md"));

  const [loading, setLoading] = useState(false);

  const onClick = useCallback(async () => {
    setLoading(true);

    try {
      const weekends = [];

      const start = dayjs(startDate).startOf("month");
      const end = dayjs(endDate).endOf("month");

      for (
        let date = start;
        date.isBefore(end) || date.isSame(end, "date");
        date = date.add(1, "day")
      ) {
        if (date.day() === 0 || date.day() === 6) {
          weekends.push(date.format("YYYY-MM-DD"));
        }
      }

      await update(
        ref(database, `/holidays/`),
        Object.fromEntries(weekends.map((date) => [date, "Weekend"]))
      );

      if (typeof onSubmit === "function") {
        onSubmit();
      }
    } catch (error) {
      console.error("Failed to add holidays!", error);
    }

    setLoading(false);
  }, [startDate, endDate, onSubmit]);

  return (
    <Button
      variant="contained"
      color="primary"
      disabled={loading}
      startIcon={<LibraryAdd />}
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
      onClick={onClick}
    >
      {isMobile ? "" : "Add All Weekends"}
    </Button>
  );
};

AutoAddHolidays.propTypes = {
  startDate: PropTypes.string.isRequired,
  endDate: PropTypes.string.isRequired,
  onSubmit: PropTypes.func,
};

export const Holidays = () => {
  const { user } = useAuth();
  const config = useConfig();
  const theme = useTheme();

  const tableRef = useRef(null);

  const [month, setMonth] = useState(() => dayjs().startOf("month"));

  const [loading, setLoading] = useState(true);
  const [holidays, setHolidays] = useState([]);

  const isAdmin = useMemo(() => user?.role === "admin", [user]);

  const { minDate, maxDate } = useMemo(
    () => ({
      minDate: dayjs(config.startDate).startOf("month"),
      maxDate: dayjs(config.currentDate).endOf("month"),
    }),
    [config]
  );

  const { startDate, endDate } = useMemo(() => {
    const startOfMonth = month.clone().startOf("month");
    const endOfMonth = month.clone().endOf("month");

    return {
      startDate: startOfMonth.format("YYYY-MM-DD"),
      endDate: endOfMonth.format("YYYY-MM-DD"),
    };
  }, [month]);

  const fetchHolidaysForMonth = useCallback(async () => {
    setLoading(true);

    setHolidays(await fetchHolidays(startDate, endDate));

    setLoading(false);
  }, [startDate, endDate]);

  const onAddEditSubmit = useCallback(() => {
    fetchHolidaysForMonth();
  }, [fetchHolidaysForMonth]);

  useEffect(() => {
    fetchHolidaysForMonth();
  }, [fetchHolidaysForMonth]);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 2,
        flex: "1 1 1px",
        paddingTop: 1,
      }}
    >
      <Box
        sx={{
          display: "flex",
          gap: 1,
        }}
      >
        <DatePicker
          label="Month"
          views={["month", "year"]}
          minDate={minDate}
          maxDate={maxDate}
          value={month}
          onChange={(value) => {
            if (!value) return;

            setMonth(value);
          }}
          slotProps={{
            textField: {
              style: {},
            },
          }}
        />
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            marginLeft: 2,
          }}
        >
          <Typography variant="body2" color="text.secondary">
            Total Holidays
          </Typography>
          <Typography variant="body1" color="text.primary">
            {holidays.length}
          </Typography>
        </Box>
        <Box sx={{ flexGrow: 1 }} />
        {isAdmin && (
          <>
            <AutoAddHolidays
              startDate={startDate}
              endDate={endDate}
              onSubmit={onAddEditSubmit}
            />
            <HolidayEditor onSubmit={onAddEditSubmit} />
          </>
        )}
      </Box>
      <Divider />
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 2,
          flex: "1 1 1px",
          overflow: "auto",
          borderRadius: "4px",
          border: `1px solid ${theme.palette.divider}`,
          position: "relative",
        }}
      >
        <Table ref={tableRef} stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Reason</TableCell>
              {isAdmin && <TableCell width="150px">Actions</TableCell>}
            </TableRow>
          </TableHead>

          <TableBody>
            {holidays.map((item) => (
              <HolidayRow
                key={item.date}
                item={item}
                isAdmin={isAdmin}
                onSubmit={onAddEditSubmit}
              />
            ))}
          </TableBody>
        </Table>

        {loading && <LoadingOverlay />}
      </Box>
    </Box>
  );
};

Holidays.linkLabel = "Holidays";
Holidays.linkPath = "/holidays";
Holidays.linkIcon = Event;
Holidays.isProtected = true; // This page is protected
