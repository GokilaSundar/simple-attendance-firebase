import { Dashboard as DashboardIcon } from "@mui/icons-material";

export const Dashboard = () => {
  return <>Dashboard</>;
};

Dashboard.linkLabel = "Dashboard";
Dashboard.linkPath = "/dashboard";
Dashboard.linkIcon = DashboardIcon;
Dashboard.isProtected = true; // This page is protected
Dashboard.isDefault = true; // This page is the default page when user is logged in
