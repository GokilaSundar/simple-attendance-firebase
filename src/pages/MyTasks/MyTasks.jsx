import { AssignmentTurnedInOutlined, Delete } from "@mui/icons-material";
import {
  Box,
  Divider,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers";
import dayjs from "dayjs";
import { get, ref, remove } from "firebase/database";
import PropTypes from "prop-types";
import { useCallback, useEffect, useMemo, useState } from "react";
import { LoadingOverlay, useAuth, useConfig } from "../../components";
import { database } from "../../Firebase";
import { TaskEditor } from "./TaskEditor";
import { ImportPreviousTasks } from "./ImportPreviousTasks";

const TaskRow = ({ date, task, onSubmit }) => {
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);

  const onDelete = useCallback(async () => {
    setLoading(true);

    try {
      await remove(ref(database, `/tasks/${user.uid}/${date}/${task.id}`));

      if (typeof onSubmit === "function") {
        onSubmit();
      }
    } catch (error) {
      console.error("Failed to delete holiday!", error);
    }

    setLoading(false);
  }, [date, task.id, user.uid, onSubmit]);

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
      <TableCell>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <TaskEditor
            date={date}
            existingData={task}
            disabled={false}
            onSubmit={onSubmit}
          />
          <IconButton disabled={loading} onClick={onDelete}>
            <Delete />
          </IconButton>
        </Box>
      </TableCell>
    </TableRow>
  );
};

TaskRow.propTypes = {
  date: PropTypes.string.isRequired,
  task: PropTypes.object.isRequired,
  onSubmit: PropTypes.func.isRequired,
};

export const MyTasks = () => {
  const isMobile = useMediaQuery((theme) => theme.breakpoints.down("md"));
  const theme = useTheme();

  const { user } = useAuth();
  const config = useConfig();

  const [date, setDate] = useState(() => dayjs(config.currentDate));

  const [loading, setLoading] = useState(false);
  const [tasks, setTasks] = useState([]);

  const dateString = useMemo(() => date.format("YYYY-MM-DD"), [date]);

  const { minDate, maxDate } = useMemo(
    () => ({
      minDate: dayjs(config.startDate),
      maxDate: dayjs(config.currentDate),
    }),
    [config]
  );

  const totalHours = useMemo(
    () => tasks.reduce((acc, task) => acc + (task.hours || 0), 0),
    [tasks]
  );

  const tasksRef = useMemo(
    () => ref(database, `/tasks/${user.uid}/${dateString}`),
    [dateString, user.uid]
  );

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const snapshot = await get(tasksRef);

      if (snapshot.exists()) {
        setTasks(Object.values(snapshot.val()));
      }
    } catch (error) {
      console.error("Error fetching tasks:", error);
    } finally {
      setLoading(false);
    }
  }, [tasksRef]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const summary = (
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
          Total Hours
        </Typography>
        <Typography variant="body1" color="text.primary">
          {totalHours}
        </Typography>
      </Box>
    </>
  );

  const importTasks = (
    <ImportPreviousTasks
      currentDate={dateString}
      minDate={minDate}
      maxDate={maxDate}
      onSubmit={fetchTasks}
    />
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
          label="Date"
          views={["day", "month", "year"]}
          format="DD/MM/YYYY"
          minDate={minDate}
          maxDate={maxDate}
          value={date}
          onChange={(value) => {
            if (!value) return;

            setDate(value);
          }}
          slotProps={{
            textField: {
              style: {},
            },
          }}
        />
        {!isMobile && summary}
        <Box sx={{ flexGrow: 1 }} />
        {!isMobile && importTasks}
        <TaskEditor
          date={dateString}
          disabled={loading}
          onSubmit={fetchTasks}
        />
      </Box>
      {isMobile && (
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          {summary}
          {importTasks}
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
        <Table sx={{ width: "100%" }} stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>Description</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Hours</TableCell>
              <TableCell width="230px">Timestamps</TableCell>
              <TableCell width="150px">Actions</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {tasks.map((task) => (
              <TaskRow
                key={task.addedOn}
                date={dateString}
                task={task}
                onSubmit={fetchTasks}
              />
            ))}
          </TableBody>
        </Table>
        {loading && <LoadingOverlay />}
      </Box>
    </Box>
  );
};

MyTasks.linkLabel = "My Tasks";
MyTasks.linkPath = "/my-tasks";
MyTasks.linkIcon = AssignmentTurnedInOutlined;
MyTasks.isProtected = true;
