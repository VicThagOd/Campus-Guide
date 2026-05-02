import React from "react";
import { createBrowserRouter } from "react-router-dom";
import { Landing } from "./components/Landing";
import { Login } from "./components/Login";
import { Dashboard } from "./components/Dashboard";
import { ProtectedRoute } from "../components/ProtectedRoute";
import { TestInterface } from "./components/TestInterface";
import { Results } from "./components/Results";
import { Contact } from "./components/Contact";
import { TestWarning } from "./components/TestWarning";
import { ExamReview } from "./components/ExamReview";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Landing,
  },
  {
    path: "/login",
    Component: Login,
  },
  {
    path: "/dashboard",
    Component: () => React.createElement(ProtectedRoute, null, React.createElement(Dashboard)),
  },
  {
    path: "/contact",
    Component: Contact,
  },
  {
    path: "/test-warning",
    Component: TestWarning,
  },
  {
    path: "/test",
    Component: TestInterface,
  },
  {
    path: "/results",
    Component: Results,
  },
  {
    path: "/review/:resultId",
    Component: ExamReview,
  },
]);
