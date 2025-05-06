import Icon from "../../assets/icons/dashboard.png";

export const Dashboard = () => {
  return <>Dashboard</>;
};

Dashboard.linkLabel = "Dashboard";
Dashboard.linkPath = "/dashboard";
Dashboard.linkIcon = Icon;
Dashboard.isProtected = true; // This page is protected
Dashboard.isDefault = true; // This page is the default page when user is logged in