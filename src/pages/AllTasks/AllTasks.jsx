import {
  Box,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers";
import dayjs from "dayjs";
import { endAt, get, orderByKey, query, ref, startAt } from "firebase/database";
import PropTypes from "prop-types";
import { Fragment, useEffect, useMemo, useState } from "react";

import { LoadingOverlay, useConfig } from "../../components";
import { database } from "../../Firebase";
import { AssignmentOutlined } from "@mui/icons-material";

const TaskRow = ({ task }) => {
  return (
    <TableRow key={task.addedOn}>
      <TableCell>
        <Typography
          variant="body2"
          sx={{
            maxWidth: "300px",
            whiteSpace: "wrap",
            width: "max-content",
          }}
        >
          {task.description}
        </Typography>
      </TableCell>
      <TableCell>
        <Typography variant="body2" noWrap>
          {task.status}
        </Typography>
      </TableCell>
      <TableCell>
        <Typography variant="body2" noWrap>
          {task.hours} hours
        </Typography>
      </TableCell>
      <TableCell>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          <Tooltip
            title={dayjs(task.addedOn).format("YYYY-MM-DD hh:mm:ss A")}
            arrow
            placement="top"
          >
            <Typography variant="body2" color="text.secondary" noWrap>
              Added on {dayjs(task.addedOn).format("h:mm A")}
            </Typography>
          </Tooltip>

          {task.updatedOn !== task.addedOn && (
            <Tooltip
              title={dayjs(task.updatedOn).format("YYYY-MM-DD hh:mm:ss A")}
              arrow
              placement="top"
            >
              <Typography variant="body2" color="text.secondary" noWrap>
                Updated on {dayjs(task.updatedOn).format("h:mm A")}
              </Typography>
            </Tooltip>
          )}
        </Box>
      </TableCell>
    </TableRow>
  );
};

TaskRow.propTypes = {
  task: PropTypes.object.isRequired,
};

export const AllTasks = () => {
  const config = useConfig();
  const theme = useTheme();

  const [month, setMonth] = useState(() => dayjs().startOf("month"));
  const [selectedUserId, setSelectedUserId] = useState(null);

  const [loadingUsers, setLoadingUsers] = useState(true);
  const [users, setUsers] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [tasksMap, setTasksMap] = useState([]);

  const { minDate, maxDate } = useMemo(
    () => ({
      minDate: dayjs(config.startDate).startOf("month"),
      maxDate: dayjs(config.currentDate).endOf("month"),
    }),
    [config]
  );

  const { startDate, endDate } = useMemo(() => {
    const startOfMonth = month.clone().startOf("month");
    let endOfMonth = month.clone().endOf("month");

    if (endOfMonth.isAfter(dayjs())) {
      endOfMonth = dayjs();
    }

    return {
      startDate: startOfMonth.format("YYYY-MM-DD"),
      endDate: endOfMonth.format("YYYY-MM-DD"),
    };
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
          setSelectedUserId(usersArray[0]?.uid || null);
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
    if (!selectedUserId) return;

    const fetchTasks = async () => {
      setLoadingTasks(true);

      try {
        const tasksRef = ref(database, `/tasks/${selectedUserId}`);

        const tasksQuery = query(
          tasksRef,
          orderByKey(),
          startAt(startDate),
          endAt(endDate)
        );

        const snapshot = await get(tasksQuery);

        if (snapshot.exists()) {
          const tasksData = snapshot.val();

          const tasksArray = Object.entries(tasksData).map(([date, tasks]) => ({
            date,
            tasks: Object.values(tasks),
          }));

          setTasksMap(tasksArray);
        } else {
          console.log("No data available");
        }
      } catch (error) {
        console.error("Error fetching tasks:", error);
      }

      setLoadingTasks(false);
    };

    fetchTasks();
  }, [selectedUserId, startDate, endDate]);

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
        <FormControl key={selectedUserId} fullWidth>
          <InputLabel id="user-select-label" htmlFor="user-select">
            User
          </InputLabel>
          <Select
            labelId="user-select-label"
            id="user-select"
            label="User"
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            disabled={loadingUsers}
          >
            {users.map((user) => (
              <MenuItem key={user.uid} value={user.uid}>
                {user.displayName}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Box sx={{ flexGrow: 1 }} />
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
        <Table sx={{ width: "100%" }} stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>Description</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Hours</TableCell>
              <TableCell width="230px">Timestamps</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {tasksMap.map(({ date, tasks }) => (
              <Fragment key={date}>
                <TableRow>
                  <TableCell colSpan={4}>
                    <Typography
                      variant="body2"
                      color="primary"
                      fontWeight={600}
                    >
                      {dayjs(date).format("MMMM D, YYYY")}
                    </Typography>
                  </TableCell>
                </TableRow>
                {tasks.map((task) => (
                  <TaskRow key={task.addedOn} task={task} />
                ))}
              </Fragment>
            ))}
          </TableBody>
        </Table>
        {(loadingTasks || loadingUsers) && (
          <LoadingOverlay
            loadingText={loadingUsers ? "Loading Users..." : "Loading Tasks..."}
          />
        )}
      </Box>
    </Box>
  );
};

AllTasks.linkLabel = "All Tasks";
AllTasks.linkPath = "/all-tasks";
AllTasks.linkIcon = AssignmentOutlined;
AllTasks.role = "admin"; // Only admin can access this page
AllTasks.isProtected = true; // This page is protected
