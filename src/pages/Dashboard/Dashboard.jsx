import {
  Alarm,
  AlarmOff,
  Dashboard as DashboardIcon,
} from "@mui/icons-material";
import {
  Avatar,
  Box,
  Button,
  styled,
  Typography,
  useMediaQuery,
} from "@mui/material";
import dayjs from "dayjs";
import { get, onValue, ref, set } from "firebase/database";
import humanizeDuration from "humanize-duration";
import { useCallback, useEffect, useMemo, useState } from "react";

import { LoadingOverlay, useAuth, useConfig } from "../../components/index.js";
import { database } from "../../Firebase.js";
import { fetchHoliday } from "../../Utils.js";
import { useNavigate } from "react-router-dom";

const ClockInOutButton = styled(Button)(() => ({
  display: "flex",
  justifyContent: "center",
  flexDirection: "column",
  alignItems: "center",
  gap: "0.5rem",
  minWidth: 0,
  padding: "1rem",
  width: 150,
  "> svg": {
    fontSize: 40,
  },
}));

export const Dashboard = () => {
  const navigate = useNavigate();

  const { user } = useAuth();
  const config = useConfig();

  const isMobile = useMediaQuery("(max-width:600px)");
  const avatarSize = useMemo(() => (isMobile ? 64 : 128), [isMobile]);

  const clockDataRef = useMemo(
    () =>
      ref(
        database,
        `/attendance/${dayjs(config.currentDate).format("YYYY-MM-DD")}/${
          user.uid
        }`
      ),
    [config.currentDate, user]
  );

  const [clockData, setClockData] = useState({
    clockIn: null,
    clockOut: null,
  });
  const [loading, setLoading] = useState(true);
  const [clockingIn, setClockingIn] = useState(false);
  const [clockingOut, setClockingOut] = useState(false);

  const [holiday, setHoliday] = useState(null);
  const [todayTasks, setTodayTasks] = useState([]);

  const statusText = useMemo(() => {
    if (clockData.clockIn && !clockData.clockOut) {
      return `${humanizeDuration(
        dayjs().diff(dayjs(clockData.clockIn), {
          largest: 2,
          round: true,
        }),
        {
          units: ["h", "m"],
          round: true,
        }
      )} elapsed`;
    } else if (clockData.clockIn && clockData.clockOut) {
      return `${humanizeDuration(
        dayjs(clockData.clockOut).diff(dayjs(clockData.clockIn), {
          largest: 2,
          round: true,
        }),
        {
          units: ["h", "m"],
          round: true,
        }
      )} worked`;
    } else {
      return "";
    }
  }, [clockData]);

  const onClockIn = useCallback(async () => {
    const clockInTime = dayjs().toISOString();

    setClockingIn(true);

    try {
      await set(clockDataRef, {
        clockIn: clockInTime,
        clockOut: null,
      });
    } catch (error) {
      console.error("Error clocking in:", error);
    }

    setClockingIn(false);
  }, [clockDataRef]);

  const onClockOut = useCallback(async () => {
    if (!clockData.clockIn) return;

    const clockOutTime = dayjs().toISOString();

    setClockingOut(true);

    try {
      await set(clockDataRef, {
        clockIn: clockData.clockIn,
        clockOut: clockOutTime,
      });
    } catch (error) {
      console.error("Error clocking out:", error);
    }

    setClockingOut(false);
  }, [clockData, clockDataRef]);

  useEffect(() => {
    onValue(clockDataRef, (snapshot) => {
      setLoading(false);

      if (snapshot.exists()) {
        const data = snapshot.val();
        setClockData({
          clockIn: data.clockIn,
          clockOut: data.clockOut,
        });
      } else {
        setClockData({
          clockIn: null,
          clockOut: null,
        });
      }
    });
  }, [clockDataRef]);

  useEffect(() => {
    fetchHoliday(config.currentDate).then(setHoliday);
  }, [config.currentDate]);

  useEffect(() => {
    const fetchTasks = async () => {
      setLoading(true);
      try {
        const snapshot = await get(
          ref(database, `/tasks/${user.uid}/${config.currentDate}`)
        );

        if (snapshot.exists()) {
          setTodayTasks(Object.values(snapshot.val()));
        }
      } catch (error) {
        console.error("Error fetching tasks:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, [config.currentDate, user.uid]);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        flexGrow: 1,
        gap: 2,
        position: "relative",
      }}
    >
      <Avatar
        sx={{
          width: avatarSize,
          height: avatarSize,
        }}
        src={user?.photoURL}
      />
      <Typography variant="h4" textAlign="center" sx={{ ml: 2 }}>
        Welcome back, {user?.displayName || user?.email}!
      </Typography>
      <Typography variant="h6" sx={{ mt: 2 }}>
        Today is {dayjs(config.currentDate).format("dddd, MMMM D, YYYY")}
      </Typography>
      {holiday && (
        <Typography variant="h6" color="error">
          Holiday - {holiday}
        </Typography>
      )}
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 5,
        }}
      >
        <ClockInOutButton
          variant="contained"
          color="primary"
          size="large"
          disabled={!!clockData.clockIn || clockingIn}
          onClick={onClockIn}
        >
          <Alarm />

          <Typography variant="subtitle1">
            {clockData.clockIn
              ? dayjs(clockData.clockIn).format("h:mm A")
              : "N/A"}
          </Typography>

          <Typography variant="h6">Clock In</Typography>
        </ClockInOutButton>
        <ClockInOutButton
          variant="contained"
          color="secondary"
          size="large"
          disabled={!clockData.clockIn || !!clockData.clockOut || clockingOut}
          onClick={onClockOut}
        >
          <AlarmOff />

          <Typography variant="subtitle1">
            {clockData.clockOut
              ? dayjs(clockData.clockOut).format("h:mm A")
              : "N/A"}
          </Typography>

          <Typography variant="h6">Clock Out</Typography>
        </ClockInOutButton>
      </Box>
      {statusText && (
        <Typography variant="h6" sx={{ mt: 2 }}>
          {statusText}
        </Typography>
      )}

      {todayTasks.length > 0 && (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 2,
            width: "100%",
            maxWidth: 400,
            mt: 5,
          }}
        >
          <Typography variant="h5" textAlign="center">
            Today&apos;s Tasks
          </Typography>

          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 2,
              maxHeight: 400,
              overflowY: "auto",
            }}
          >
            {todayTasks.map((task) => (
              <Box
                key={task.id}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  padding: 2,
                  border: "1px solid #ccc",
                }}
              >
                <Box sx={{ flex: "1 1 1px", overflow: "hidden" }}>
                  <Typography
                    variant="body1"
                    sx={{
                      maxWidth: "100%",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {task.description}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    Status: {task.status}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Hours: {task.hours} hours
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>

          <Button
            variant="contained"
            color="primary"
            sx={{
              alignSelf: "center",
            }}
            onClick={() => {
              navigate("/my-tasks");
            }}
          >
            Manage Tasks
          </Button>
        </Box>
      )}

      {loading && <LoadingOverlay />}
    </Box>
  );
};

Dashboard.linkLabel = "Dashboard";
Dashboard.linkPath = "/dashboard";
Dashboard.linkIcon = DashboardIcon;
Dashboard.isProtected = true; // This page is protected
Dashboard.isDefault = true; // This page is the default page when user is logged in
