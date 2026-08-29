import React from "react";
import { createBrowserRouter } from "react-router-dom";
import { Landing } from "./components/Landing";
import { Login } from "./components/Login";
import { Dashboard } from "./components/Dashboard";
import { PostUtmeHub } from "./components/PostUtmeHub";
import { AspirantServices } from "./components/AspirantServices";
import { Accommodation } from "./components/Accommodation";
import { AccommodationDetail } from "./components/AccommodationDetail";
import { Events } from "./components/Events";
import { About } from "./components/About";
import { ProtectedRoute } from "../components/ProtectedRoute";
import { TestInterface } from "./components/TestInterface";
import { Results } from "./components/Results";
import { Contact } from "./components/Contact";
import { TestWarning } from "./components/TestWarning";
import { ExamReview } from "./components/ExamReview";
import { PaymentConfirmation } from "./components/PaymentConfirmation";
import { Updates } from "./components/Updates";
import { ImportantDates } from "./components/ImportantDates";
import { FreshersHub } from "./components/FreshersHub";
import { AskCampusGuide } from "./components/AskCampusGuide";
import { NotFound } from "./components/NotFound";
import { OrganizerDashboard } from "./components/OrganizerDashboard";
import { ResetPassword } from "./components/ResetPassword";

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
    path: "/reset-password",
    Component: ResetPassword,
  },
  {
    path: "/dashboard",
    Component: () => React.createElement(ProtectedRoute, null, React.createElement(Dashboard)),
  },
  {
    path: "/post-utme",
    Component: () => React.createElement(ProtectedRoute, null, React.createElement(PostUtmeHub)),
  },
  {
    path: "/aspirant-services",
    Component: () => React.createElement(ProtectedRoute, null, React.createElement(AspirantServices)),
  },
  {
    path: "/accommodation",
    Component: () => React.createElement(ProtectedRoute, null, React.createElement(Accommodation)),
  },
  {
    path: "/accommodation/:id",
    Component: () => React.createElement(ProtectedRoute, null, React.createElement(AccommodationDetail)),
  },
  {
    path: "/events",
    Component: () => React.createElement(ProtectedRoute, null, React.createElement(Events)),
  },
  {
    path: "/organizers",
    Component: OrganizerDashboard,
  },
  {
    path: "/updates",
    Component: () => React.createElement(ProtectedRoute, null, React.createElement(Updates)),
  },
  {
    path: "/dates",
    Component: () => React.createElement(ProtectedRoute, null, React.createElement(ImportantDates)),
  },
  {
    path: "/freshers",
    Component: () => React.createElement(ProtectedRoute, null, React.createElement(FreshersHub)),
  },
  {
    path: "/ask",
    Component: () => React.createElement(ProtectedRoute, null, React.createElement(AskCampusGuide)),
  },
  {
    path: "/about",
    Component: About,
  },
  {
    path: "/payment/confirm",
    Component: () => React.createElement(ProtectedRoute, null, React.createElement(PaymentConfirmation)),
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
  {
    path: "*",
    Component: NotFound,
  },
]);
