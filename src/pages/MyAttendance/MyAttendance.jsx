import { useTheme } from "@emotion/react";
import { CalendarMonth, Download } from "@mui/icons-material";
import {
  Box,
  Button,
  CircularProgress,
  Divider,
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
import { get, ref } from "firebase/database";
import humanizeDuration from "humanize-duration";
import PropTypes from "prop-types";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";

import { useAuth, useConfig } from "../../components";
import { database } from "../../Firebase";

const AttendanceRow = ({ date, setOverallData }) => {
  const { user } = useAuth();

  const dateInstance = useMemo(() => dayjs(date), [date]);

  const [loading, setLoading] = useState(true);
  const [clockData, setClockData] = useState(null);

  const clockDataRef = useMemo(
    () => ref(database, `/attendance/${date}/${user.uid}`),
    [user, date]
  );

  const status = useMemo(() => {
    if (clockData) {
      if (clockData.clockIn && clockData.clockOut) {
        return "Present";
      } else if (clockData.clockIn) {
        return "Incomplete";
      }
    }

    return "Absent";
  }, [clockData]);

  const rowBackground = useMemo(() => {
    if (!loading) {
      if (clockData) {
        return clockData.clockOut ? "#ccffc7" : "#fff3cd";
      } else {
        return "#ffcfcf";
      }
    }

    return "inherit";
  }, [loading, clockData]);

  useEffect(() => {
    setLoading(true);

    const fetchData = async () => {
      try {
        const snapshot = await get(clockDataRef);
        if (snapshot.exists()) {
          const data = snapshot.val();

          if (data.clockIn || data.clockOut) {
            const clockData = {
              clockIn: data.clockIn
                ? dayjs(data.clockIn).format("HH:mm A")
                : "",
              clockOut: data.clockOut
                ? dayjs(data.clockOut).format("HH:mm A")
                : "",
              duration:
                data.clockIn && data.clockOut
                  ? humanizeDuration(
                      dayjs(data.clockOut).diff(dayjs(data.clockIn), {
                        largest: 2,
                        round: true,
                      }),
                      {
                        units: ["h", "m"],
                        round: true,
                      }
                    )
                  : "N/A",
            };

            setClockData(clockData);

            setOverallData((prevData) => ({
              ...prevData,
              [date]: clockData.clockIn && clockData.clockOut ? 1 : 0,
            }));

            setClockData(clockData);
          } else {
            setClockData(null);
          }
        } else {
          setClockData(null);
        }
      } catch (error) {
        console.error("Error fetching clock data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [clockDataRef, date, setOverallData]);

  return (
    <TableRow
      key={date}
      sx={{
        background: rowBackground,
      }}
    >
      <TableCell>{dateInstance.format("DD/MM/YYYY")}</TableCell>
      {loading ? (
        <TableCell colSpan={4} align="center">
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "100%",
            }}
          >
            <CircularProgress size={24} />
          </Box>
        </TableCell>
      ) : (
        <>
          <TableCell align="left">{status}</TableCell>
          <TableCell align="right">{clockData?.clockIn}</TableCell>
          <TableCell align="right">{clockData?.clockOut}</TableCell>
          <TableCell align="right">{clockData?.duration || "N/A"}</TableCell>
        </>
      )}
    </TableRow>
  );
};

AttendanceRow.propTypes = {
  date: PropTypes.string.isRequired,
  setOverallData: PropTypes.func.isRequired,
};

export const MyAttendance = () => {
  const isMobile = useMediaQuery("(max-width: 600px)");

  const config = useConfig();
  const theme = useTheme();

  const tableRef = useRef(null);

  const [month, setMonth] = useState(() => dayjs().startOf("month"));

  const { minDate, maxDate } = useMemo(
    () => ({
      minDate: dayjs(config.startDate).startOf("month"),
      maxDate: dayjs(config.currentDate).endOf("month"),
    }),
    [config]
  );

  const [overallData, setOverallData] = useState({});

  const dates = useMemo(() => {
    const startOfMonth = month.clone().startOf("month");
    let endOfMonth = month.clone().endOf("month");

    if (endOfMonth.isAfter(dayjs())) {
      endOfMonth = dayjs();
    }

    const dates = [];

    for (let i = startOfMonth.date(); i <= endOfMonth.date(); i++) {
      dates.push(startOfMonth.clone().date(i).format("YYYY-MM-DD"));
    }

    return dates;
  }, [month]);

  const { totalPresent, totalWorkingDays } = useMemo(() => {
    const totalPresent = Object.values(overallData).reduce(
      (acc, value) => acc + value,
      0
    );

    const totalWorkingDays = dates.length;

    return { totalPresent, totalWorkingDays };
  }, [overallData, dates]);

  const onDownload = useCallback(() => {
    const tableElement = tableRef.current;

    if (!tableElement) return;

    const workbook = XLSX.utils.table_to_book(tableElement);

    const buffer = XLSX.write(workbook, {
      type: "buffer",
    });

    const blob = new Blob([buffer], {
      type: "application/octet-stream",
    });

    const fileName = `Attendance_${month.format("MMMM_YYYY")}.xlsx`;

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  }, [month]);

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
            setOverallData({});
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
            Total Present
          </Typography>
          <Typography variant="body1" color="text.primary">
            {totalPresent} / {totalWorkingDays}
          </Typography>
        </Box>
        <Box sx={{ flexGrow: 1 }} />
        <Button
          variant="contained"
          color="primary"
          startIcon={<Download />}
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
          onClick={onDownload}
        >
          {isMobile ? "" : "Download"}
        </Button>
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
        }}
      >
        <Table ref={tableRef} stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell align="left">Status</TableCell>
              <TableCell align="right">In Time</TableCell>
              <TableCell align="right">Out Time</TableCell>
              <TableCell align="right">Total Hours</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {dates.map((date) => (
              <AttendanceRow
                key={date}
                date={date}
                setOverallData={setOverallData}
              />
            ))}
          </TableBody>
        </Table>
      </Box>
    </Box>
  );
};

MyAttendance.linkLabel = "My Attendance";
MyAttendance.linkPath = "/my-attendance";
MyAttendance.linkIcon = CalendarMonth;
MyAttendance.isProtected = true; // This page is protected
