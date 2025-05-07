import { Navigate, Route, Routes } from "react-router-dom";

import { ProtectedRoutes, useAuth, WithNavigationSidebar } from "../components";
import { AllAttendance } from "./AllAttendance/AllAttendance";
import { Dashboard } from "./Dashboard/Dashboard";
import { MyAttendance } from "./MyAttendance/MyAttendance";
import { Login } from "./Login/Login";
import { useMemo } from "react";
import { Unauthorized } from "./Unauthorized/Unauthorized";

const pages = [Login, Dashboard, MyAttendance, AllAttendance];

const { unprotectedPages, protectedUserPages, protectedAdminPages } =
  pages.reduce(
    (acc, page) => {
      if (page.isProtected) {
        if (page.role === "admin") {
          acc.protectedAdminPages.push(page);
        } else {
          acc.protectedUserPages.push(page);
        }
      } else {
        acc.unprotectedPages.push(page);
      }
      return acc;
    },
    { unprotectedPages: [], protectedUserPages: [], protectedAdminPages: [] }
  );

const defaultPage = protectedUserPages.find((page) => page.isDefault);

export const Pages = () => {
  const { user } = useAuth();

  const navigationPages = useMemo(
    () =>
      user?.role === "admin"
        ? [...protectedUserPages, ...protectedAdminPages]
        : protectedUserPages,
    [user]
  );

  return (
    <Routes>
      {unprotectedPages.map((Page) => (
        <Route key={Page.linkPath} path={Page.linkPath} element={<Page />} />
      ))}

      <Route element={<ProtectedRoutes />}>
        <Route element={<WithNavigationSidebar pages={navigationPages} />}>
          {protectedUserPages.map((Page) => (
            <Route
              key={Page.linkPath}
              path={Page.linkPath}
              element={<Page />}
            />
          ))}

          <Route element={<ProtectedRoutes role="admin" />}>
            {protectedAdminPages.map((Page) => (
              <Route
                key={Page.linkPath}
                path={Page.linkPath}
                element={<Page />}
              />
            ))}
          </Route>

          <Route path="/unauthorized" element={<Unauthorized />} />
        </Route>
      </Route>

      <Route
        path="*"
        element={<Navigate to={defaultPage?.linkPath || "/login"} />}
      />
    </Routes>
  );
};
