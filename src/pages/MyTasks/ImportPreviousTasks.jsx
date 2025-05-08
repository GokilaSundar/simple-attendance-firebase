import { Redo } from "@mui/icons-material";
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogContent,
  DialogContentText,
  DialogTitle,
  MenuItem,
  Select,
  styled,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers";
import dayjs from "dayjs";
import { get, ref, update } from "firebase/database";
import PropTypes from "prop-types";
import { useCallback, useEffect, useMemo, useState } from "react";
import { v4 as uuid } from "uuid";

import { LoadingOverlay, useAuth } from "../../components";
import { database } from "../../Firebase";

const SmallCheckbox = styled(Checkbox)(({ theme }) => ({
  "& .MuiSvgIcon-root": {
    fontSize: theme.typography.body2.fontSize,
  },
}));

export const ImportPreviousTasks = ({ minDate, currentDate, onSubmit }) => {
  const theme = useTheme();

  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState(() => dayjs(currentDate).subtract(1, "day"));
  const [tasks, setTasks] = useState([]);
  const [selectedTaskIds, setSelectedTaskIds] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const [open, setOpen] = useState(false);

  const maxDate = useMemo(
    () => dayjs(currentDate).subtract(1, "day"),
    [currentDate]
  );

  const onClose = useCallback(() => {
    setOpen(false);
  }, []);

  const onSubmitTasks = useCallback(async () => {
    const selectedTasks = tasks.filter((task) =>
      selectedTaskIds.includes(task.id)
    );

    if (selectedTasks.length === 0) {
      return;
    }

    const currentTime = dayjs().toISOString();

    const updatedTasks = selectedTasks.map((task) => ({
      ...task,
      id: uuid(),
      addedOn: currentTime,
      updatedOn: currentTime,
    }));

    setSubmitting(true);

    try {
      await update(
        ref(database, `/tasks/${user.uid}/${currentDate}`),
        Object.fromEntries(updatedTasks.map((task) => [task.id, task]))
      );

      if (typeof onSubmit === "function") {
        onSubmit();
      }

      onClose();
    } catch (error) {
      console.error("Error importing tasks:", error);
    } finally {
      setSubmitting(false);
    }
  }, [selectedTaskIds, tasks, currentDate, user.uid, onClose, onSubmit]);

  useEffect(() => {
    if (!open) return;

    const fetchTasks = async () => {
      setLoading(true);
      try {
        const snapshot = await get(
          ref(database, `/tasks/${user.uid}/${date.format("YYYY-MM-DD")}`)
        );

        if (snapshot.exists()) {
          setTasks(
            Object.values(snapshot.val()).filter(task => task.status === "Pending" || task.status === "In Progress").map((task) => ({
              ...task,
              oldStatus: task.status,
              oldHours: task.hours,
            }))
          );
        }
      } catch (error) {
        console.error("Error fetching tasks:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, [date, user.uid, open]);

  useEffect(() => {
    if (!open) {
      setDate(dayjs(currentDate).subtract(1, "day"));
    }
  }, [currentDate, open]);

  return (
    <>
      <Button
        variant="contained"
        color="primary"
        startIcon={<Redo />}
        onClick={() => setOpen(true)}
      >
        Import Previous Tasks
      </Button>

      <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg">
        <DialogTitle>Import Previous Tasks</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Select a date to list tasks from. Only tasks with <b>Pending</b> &{" "}
            <b>In Progress</b> status will be shown.
          </DialogContentText>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 2,
              marginTop: 2,
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
            />

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
                maxHeight: "400px",
                minHeight: "200px",
              }}
            >
              <Table sx={{ width: "100%" }} stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell width={50}>
                      <SmallCheckbox
                        checked={
                          tasks.length &&
                          selectedTaskIds.length === tasks.length
                        }
                        onClick={() => {
                          if (selectedTaskIds.length === tasks.length) {
                            setSelectedTaskIds([]);
                          } else {
                            setSelectedTaskIds(tasks.map((task) => task.id));
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell width={150}>Previous Status</TableCell>
                    <TableCell width={150}>Previous Hours</TableCell>
                    <TableCell width={150}>New Status</TableCell>
                    <TableCell width={150}>New Hours</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {tasks.map((task) => (
                    <TableRow key={task.id}>
                      <TableCell>
                        <SmallCheckbox
                          checked={selectedTaskIds.includes(task.id)}
                          onClick={() => {
                            setSelectedTaskIds((prev) => {
                              if (prev.includes(task.id)) {
                                return prev.filter((id) => id !== task.id);
                              } else {
                                return [...prev, task.id];
                              }
                            });
                          }}
                        />
                      </TableCell>
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
                          {task.oldStatus}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" noWrap>
                          {task.oldHours} hours
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Select
                          label="New Status"
                          value={task.status}
                          onChange={(e) => {
                            setTasks((prev) =>
                              prev.map((t) =>
                                t.id === task.id
                                  ? { ...t, status: e.target.value }
                                  : t
                              )
                            );
                          }}
                          variant="standard"
                          sx={{
                            "& .MuiSelect-select": {
                              fontSize: theme.typography.body2.fontSize,
                            },
                          }}
                        >
                          <MenuItem value="Pending">Pending</MenuItem>
                          <MenuItem value="In Progress">In Progress</MenuItem>
                          <MenuItem value="Completed">Completed</MenuItem>
                          <MenuItem value="On Hold">On Hold</MenuItem>
                          <MenuItem value="Cancelled">Cancelled</MenuItem>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <TextField
                          type="number"
                          value={task.hours}
                          slotProps={{
                            input: {
                              min: 0,
                              max: 8,
                              step: 1,
                            },
                          }}
                          onChange={(e) => {
                            setTasks((prev) =>
                              prev.map((t) =>
                                t.id === task.id
                                  ? { ...t, hours: e.target.value }
                                  : t
                              )
                            );
                          }}
                          variant="standard"
                          sx={{
                            "& .MuiInputBase-input": {
                              fontSize: theme.typography.body2.fontSize,
                            },
                          }}
                          fullWidth
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {loading && <LoadingOverlay />}
            </Box>

            <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
              <Button
                variant="contained"
                disabled={loading || submitting}
                onClick={onSubmitTasks}
              >
                Submit
              </Button>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
};

ImportPreviousTasks.propTypes = {
  minDate: PropTypes.instanceOf(dayjs).isRequired,
  currentDate: PropTypes.string.isRequired,
  onSubmit: PropTypes.func,
};
