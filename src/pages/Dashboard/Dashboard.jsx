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
import humanizeDuration from "humanize-duration";

import { LoadingOverlay, useAuth, useConfig } from "../../components/index.js";
import { useCallback, useEffect, useMemo, useState } from "react";
import { onValue, ref, set } from "firebase/database";
import { database } from "../../Firebase.js";

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
  const { user } = useAuth();
  const config = useConfig();

  const isMobile = useMediaQuery("(max-width:600px)");
  const avatarSize = useMemo(() => (isMobile ? 64 : 128), [isMobile]);

  const clockDataRef = useMemo(
    () =>
      ref(database, `/attendance/${dayjs().format("YYYY-MM-DD")}/${user.uid}`),
    [user]
  );

  const [clockData, setClockData] = useState({
    clockIn: null,
    clockOut: null,
  });
  const [loading, setLoading] = useState(true);
  const [clockingIn, setClockingIn] = useState(false);
  const [clockingOut, setClockingOut] = useState(false);

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
      {loading && <LoadingOverlay />}
    </Box>
  );
};

Dashboard.linkLabel = "Dashboard";
Dashboard.linkPath = "/dashboard";
Dashboard.linkIcon = DashboardIcon;
Dashboard.isProtected = true; // This page is protected
Dashboard.isDefault = true; // This page is the default page when user is logged in
