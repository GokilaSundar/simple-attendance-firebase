import Icon from "../../assets/icons/all-attendance.png";

export const AllAttendance = () => {
  return <>All Attendance</>;
};

AllAttendance.linkLabel = "All Attendance";
AllAttendance.linkPath = "/all-attendance";
AllAttendance.linkIcon = Icon;
AllAttendance.role = "admin"; // Only admin can access this page
AllAttendance.isProtected = true; // This page is protected