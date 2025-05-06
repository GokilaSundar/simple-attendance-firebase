import { Navigate, Route, Routes } from "react-router-dom";

import { ProtectedRoutes, WithNavigationSidebar } from "../components";
import { AllAttendance } from "./AllAttendance/AllAttendance";
import { Dashboard } from "./Dashboard/Dashboard";
import { MyAttendance } from "./MyAttendance/MyAttendance";
import { Login } from "./Login/Login";

const pages = [Login, Dashboard, MyAttendance, AllAttendance];

const { unprotectedPages, protectedPages } = pages.reduce(
  (acc, page) => {
    if (page.isProtected) {
      acc.protectedPages.push(page);
    } else {
      acc.unprotectedPages.push(page);
    }
    return acc;
  },
  { unprotectedPages: [], protectedPages: [] }
);

const defaultPage = protectedPages.find((page) => page.isDefault);

export const Pages = () => {
  return (
    <Routes>
      {unprotectedPages.map((Page) => (
        <Route key={Page.linkPath} path={Page.linkPath} element={<Page />} />
      ))}

      <Route element={<ProtectedRoutes />}>
        <Route element={<WithNavigationSidebar pages={protectedPages} />}>
          {protectedPages.map((Page) => (
            <Route
              key={Page.linkPath}
              path={Page.linkPath}
              element={<Page />}
            />
          ))}
        </Route>
      </Route>

      <Route
        path="*"
        element={<Navigate to={defaultPage?.linkPath || "/login"} />}
      />
    </Routes>
  );
};
