import { DateRange } from "@mui/icons-material";

export const AllAttendance = () => {
  return <>All Attendance</>;
};

AllAttendance.linkLabel = "All Attendance";
AllAttendance.linkPath = "/all-attendance";
AllAttendance.linkIcon = DateRange;
AllAttendance.role = "admin"; // Only admin can access this page
AllAttendance.isProtected = true; // This page is protected
