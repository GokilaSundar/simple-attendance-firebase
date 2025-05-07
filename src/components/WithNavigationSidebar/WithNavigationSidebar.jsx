import { Logout, Menu as MenuIcon } from "@mui/icons-material";
import {
  AppBar,
  Box,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { signOut } from "firebase/auth";
import PropTypes from "prop-types";
import { useCallback, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { auth } from "../../Firebase";

const drawerWidth = 240;

export const WithNavigationSidebar = ({ pages }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const activeColor = useTheme().palette.primary.main;
  const drawerZIndex = useTheme().zIndex.drawer;
  const isMobile = useMediaQuery("(max-width:600px)");

  const [mobileOpen, setMobileOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const onDrawerClose = useCallback(() => {
    setIsClosing(true);
    setMobileOpen(false);
  }, []);

  const onDrawerTransitionEnd = useCallback(() => {
    setIsClosing(false);
  }, []);

  const onDrawerToggle = useCallback(() => {
    if (!isClosing) {
      setMobileOpen((mobileOpen) => !mobileOpen);
    }
  }, [isClosing]);

  return (
    <Box sx={{ display: "flex", flexGrow: 1 }}>
      <AppBar
        position="fixed"
        style={{
          zIndex: drawerZIndex + 1,
        }}
      >
        <Toolbar>
          {isMobile && (
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={onDrawerToggle}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
          )}
          <Typography variant="h6" noWrap component="div">
            Simple Attendance
          </Typography>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant={isMobile ? "temporary" : "permanent"}
          open={isMobile ? mobileOpen : true}
          onTransitionEnd={isMobile ? onDrawerTransitionEnd : undefined}
          onClose={isMobile ? onDrawerClose : undefined}
          sx={{
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: drawerWidth,
            },
          }}
          slotProps={
            isMobile
              ? {
                  root: {
                    keepMounted: true,
                  },
                }
              : undefined
          }
        >
          <Toolbar />
          <Divider />
          <List>
            {pages.map((page) => (
              <ListItem
                key={page.linkPath}
                slotProps={{
                  root: {
                    style: {
                      borderLeft: "4px solid transparent",
                      borderColor:
                        location.pathname === page.linkPath
                          ? activeColor
                          : "transparent",
                    },
                  },
                }}
                onClick={() => {
                  if (page.linkPath) {
                    navigate(page.linkPath);
                  }
                }}
                disablePadding
              >
                <ListItemButton>
                  {page.linkIcon && (
                    <ListItemIcon>
                      <page.linkIcon />
                    </ListItemIcon>
                  )}
                  <ListItemText primary={page.linkLabel} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
          <Box sx={{ flexGrow: 1 }} />
          <Divider />
          <List>
            <ListItem disablePadding>
              <ListItemButton
                disabled={loggingOut}
                onClick={() => {
                  setLoggingOut(true);
                  signOut(auth).catch((error) => {
                    console.error("Error signing out: ", error);
                    setLoggingOut(false);
                  });
                }}
              >
                <ListItemIcon>
                  <Logout />
                </ListItemIcon>
                <ListItemText primary="Logout" />
              </ListItemButton>
            </ListItem>
          </List>
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
        }}
      >
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
};

WithNavigationSidebar.propTypes = {
  pages: PropTypes.array,
};
