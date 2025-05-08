import { useTheme } from "@emotion/react";
import { CalendarMonth, Download, InfoOutline } from "@mui/icons-material";
import {
  Avatar,
  Box,
  Button,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers";
import dayjs from "dayjs";
import { endAt, get, orderByKey, query, ref, startAt } from "firebase/database";
import PropTypes from "prop-types";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";

import { LoadingOverlay, useConfig } from "../../components";
import { database } from "../../Firebase";
import { fetchHolidays } from "../../Utils";

const AttendanceCell = ({ date, user, attendanceMap, holidaysMap }) => {
  const config = useConfig();

  const status = useMemo(() => {
    const attendance = attendanceMap[date]?.[user.uid];

    if (attendance) {
      if (attendance.clockIn && attendance.clockOut) {
        return {
          value: "Present",
          tooltip: (
            <table>
              <tbody>
                <tr>
                  <td>Clocked In</td>
                  <td>:</td>
                  <td>{dayjs(attendance.clockIn).format("h:mm A")}</td>
                </tr>
                <tr>
                  <td>Clocked Out</td>
                  <td>:</td>
                  <td>{dayjs(attendance.clockOut).format("h:mm A")}</td>
                </tr>
                <tr>
                  <td>Total Hours</td>
                  <td>:</td>
                  <td>
                    {dayjs(attendance.clockOut).diff(
                      dayjs(attendance.clockIn),
                      "hour",
                      false
                    )}{" "}
                    hours
                  </td>
                </tr>
              </tbody>
            </table>
          ),
          color: "success.main",
        };
      } else if (attendance.clockIn) {
        if (date === config.currentDate) {
          return {
            value: "Present",
            tooltip: (
              <table>
                <tbody>
                  <tr>
                    <td>Clocked In</td>
                    <td>:</td>
                    <td>{dayjs(attendance.clockIn).format("h:mm A")}</td>
                  </tr>
                </tbody>
              </table>
            ),
            color: "warning.main",
          };
        } else {
          return {
            value: "Incomplete",
            tooltip: (
              <table>
                <tbody>
                  <tr>
                    <td>Clocked In</td>
                    <td>:</td>
                    <td>{dayjs(attendance.clockIn).format("h:mm A")}</td>
                  </tr>
                </tbody>
              </table>
            ),
            color: "warning.main",
          };
        }
      }
    }

    if (holidaysMap[date]) {
      return {
        value: "",
      };
    }

    return { value: "Absent", tooltip: "Absent", color: "error.main" };
  }, [config.currentDate, date, user, attendanceMap, holidaysMap]);

  return (
    <TableCell key={user.uid} align="left">
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
        }}
      >
        <Tooltip title={status.tooltip} arrow placement="top">
          <Typography
            variant="body2"
            sx={{
              color: status.color,
              fontWeight: 500,
            }}
          >
            {status.value}
          </Typography>
        </Tooltip>
        {status.note && (
          <Tooltip title={status.note} arrow placement="top">
            <InfoOutline
              sx={{
                fontSize: "1rem",
              }}
            />
          </Tooltip>
        )}
      </Box>
    </TableCell>
  );
};

AttendanceCell.propTypes = {
  date: PropTypes.string.isRequired,
  user: PropTypes.object.isRequired,
  attendanceMap: PropTypes.object.isRequired,
  holidaysMap: PropTypes.object.isRequired,
};

const AttendanceRow = ({ date, users, attendanceMap, holidaysMap }) => {
  const dateInstance = useMemo(() => dayjs(date), [date]);

  return (
    <TableRow key={date}>
      <TableCell>{dateInstance.format("DD/MM/YYYY (dddd)")}</TableCell>

      {users.map((user) => (
        <AttendanceCell
          key={user.uid}
          date={date}
          user={user}
          attendanceMap={attendanceMap}
          holidaysMap={holidaysMap}
        />
      ))}
    </TableRow>
  );
};

AttendanceRow.propTypes = {
  date: PropTypes.string.isRequired,
  users: PropTypes.array.isRequired,
  attendanceMap: PropTypes.object.isRequired,
  holidaysMap: PropTypes.object.isRequired,
};

export const AllAttendance = () => {
  const isMobile = useMediaQuery("(max-width: 600px)");

  const config = useConfig();
  const theme = useTheme();

  const tableRef = useRef(null);

  const [month, setMonth] = useState(() => dayjs().startOf("month"));

  const [loadingUsers, setLoadingUsers] = useState(true);
  const [users, setUsers] = useState([]);
  const [loadingAttendance, setLoadingAttendance] = useState(true);
  const [attendanceMap, setAttendanceMap] = useState({});
  const [loadingHolidays, setLoadingHolidays] = useState(true);
  const [holidaysMap, setHolidaysMap] = useState({});

  const { minDate, maxDate } = useMemo(
    () => ({
      minDate: dayjs(config.startDate).startOf("month"),
      maxDate: dayjs(config.currentDate).endOf("month"),
    }),
    [config]
  );

  const { startDate, endDate, dates } = useMemo(() => {
    const startOfMonth = month.clone().startOf("month");
    let endOfMonth = month.clone().endOf("month");

    if (endOfMonth.isAfter(dayjs())) {
      endOfMonth = dayjs();
    }

    const dates = [];

    for (let i = startOfMonth.date(); i <= endOfMonth.date(); i++) {
      dates.push(startOfMonth.clone().date(i).format("YYYY-MM-DD"));
    }

    return {
      startDate: startOfMonth.format("YYYY-MM-DD"),
      endDate: endOfMonth.format("YYYY-MM-DD"),
      dates,
    };
  }, [month]);

  const totalPresentMap = useMemo(
    () =>
      users.reduce((obj, user) => {
        obj[user.uid] = dates.reduce((total, date) => {
          const attendance = attendanceMap[date]?.[user.uid];

          if (attendance) {
            if (attendance.clockIn && attendance.clockOut) {
              return total + 1;
            } else if (attendance.clockIn) {
              if (date === config.currentDate) {
                return total + 1;
              }
            }
          }
          return total;
        }, 0);

        return obj;
      }, {}),
    [config.currentDate, users, dates, attendanceMap]
  );

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

  useEffect(() => {
    const fetchUsers = async () => {
      setLoadingUsers(true);

      try {
        const usersRef = ref(database, "/users");

        const snapshot = await get(usersRef);

        if (snapshot.exists()) {
          const usersData = snapshot.val();

          const usersArray = Object.values(usersData).sort((a, b) =>
            a.displayName.localeCompare(b.displayName)
          );

          setUsers(usersArray);
        } else {
          console.log("No data available");
        }
      } catch (error) {
        console.error("Error fetching users:", error);
      }

      setLoadingUsers(false);
    };

    fetchUsers();
  }, []);

  useEffect(() => {
    if (!users.length) return;

    const fetchAttendance = async () => {
      setLoadingAttendance(true);

      try {
        const attendanceRef = ref(database, "attendance");
        const attendanceQuery = query(
          attendanceRef,
          orderByKey(),
          startAt(startDate),
          endAt(endDate)
        );

        const snapshot = await get(attendanceQuery);

        if (snapshot.exists()) {
          setAttendanceMap(snapshot.val());
        } else {
          console.log("No attendance data available");
          setAttendanceMap({});
        }
      } catch (error) {
        console.error("Error fetching attendance:", error);
      }

      setLoadingAttendance(false);
    };

    fetchAttendance();
  }, [startDate, endDate, users]);

  useEffect(() => {
    setLoadingHolidays(true);
    fetchHolidays(
      startDate,
      dayjs(startDate).endOf("month").format("YYYY-MM-DD")
    )
      .then((holidays) => {
        setHolidaysMap(
          Object.fromEntries(
            holidays.map((holiday) => [holiday.date, holiday.reason])
          )
        );
      })
      .finally(() => {
        setLoadingHolidays(false);
      });
  }, [startDate]);

  const dateSummary = (
    <>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Typography variant="body2" color="text.secondary">
          Total Days
        </Typography>
        <Typography variant="body1" color="text.primary">
          {month.daysInMonth()}
        </Typography>
      </Box>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Typography variant="body2" color="text.secondary">
          Total Holidays
        </Typography>
        <Typography variant="body1" color="text.primary">
          {Object.keys(holidaysMap).length}
        </Typography>
      </Box>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Typography variant="body2" color="text.secondary">
          Total Working Days
        </Typography>
        <Typography variant="body1" color="text.primary">
          {month.daysInMonth() - Object.keys(holidaysMap).length}
        </Typography>
      </Box>
    </>
  );

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 2,
        flex: "1 1 1px",
        paddingTop: 1,
        width: "100%",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          display: "flex",
          gap: 2,
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
        {!isMobile && dateSummary}
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
      {isMobile && (
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          {dateSummary}
        </Box>
      )}
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
        <Table sx={{ width: "100%" }} ref={tableRef} stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              {users.map((user) => (
                <TableCell
                  key={user.uid}
                  align="left"
                  sx={{
                    whiteSpace: "nowrap",
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                    }}
                  >
                    <Avatar
                      sx={{
                        width: 24,
                        height: 24,
                      }}
                      src={user.photoURL}
                    />
                    <span>{user.displayName || user.uid}</span>
                  </Box>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {dates.map((date) => (
              <AttendanceRow
                key={date}
                date={date}
                users={users}
                attendanceMap={attendanceMap}
                holidaysMap={holidaysMap}
              />
            ))}
          </TableBody>

          <TableFooter>
            <TableRow>
              <TableCell>
                <Typography variant="body2" color="primary" noWrap>
                  Total Present
                </Typography>
              </TableCell>
              {users.map((user) => (
                <TableCell key={user.uid} align="left">
                  <Typography variant="body2" color="primary" fontWeight={600}>
                    {totalPresentMap[user.uid] || 0}
                  </Typography>
                </TableCell>
              ))}
            </TableRow>
          </TableFooter>
        </Table>
        {(loadingAttendance || loadingUsers || loadingHolidays) && (
          <LoadingOverlay
            loadingText={
              loadingUsers
                ? "Loading Users..."
                : loadingHolidays
                ? "Loading Holidays..."
                : "Loading Attendance..."
            }
          />
        )}
      </Box>
    </Box>
  );
};

AllAttendance.linkLabel = "All Attendance";
AllAttendance.linkPath = "/all-attendance";
AllAttendance.linkIcon = CalendarMonth;
AllAttendance.role = "admin"; // Only admin can access this page
AllAttendance.isProtected = true; // This page is protected
