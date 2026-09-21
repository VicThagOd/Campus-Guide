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

import { PageantRegister } from "./components/PageantRegister";
import { PageantVoting } from "./components/PageantVoting";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Landing />,
  },
  {
    path: "/pageant",
    element: <PageantVoting />,
  },
  {
    path: "/pageant/vote",
    element: <PageantVoting />,
  },
  {
    path: "/vote",
    element: <PageantVoting />,
  },
  {
    path: "/pageant/register",
    element: <PageantRegister />,
  },
  {
    path: "/register",
    element: <PageantRegister />,
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/reset-password",
    element: <ResetPassword />,
  },
  {
    path: "/dashboard",
    element: (
      <ProtectedRoute>
        <Dashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: "/post-utme",
    element: (
      <ProtectedRoute>
        <PostUtmeHub />
      </ProtectedRoute>
    ),
  },
  {
    path: "/aspirant-services",
    element: (
      <ProtectedRoute>
        <AspirantServices />
      </ProtectedRoute>
    ),
  },
  {
    path: "/accommodation",
    element: (
      <ProtectedRoute>
        <Accommodation />
      </ProtectedRoute>
    ),
  },
  {
    path: "/accommodation/:id",
    element: (
      <ProtectedRoute>
        <AccommodationDetail />
      </ProtectedRoute>
    ),
  },
  {
    path: "/events",
    element: (
      <ProtectedRoute>
        <Events />
      </ProtectedRoute>
    ),
  },
  {
    path: "/organizers",
    element: <OrganizerDashboard />,
  },
  {
    path: "/admin",
    element: <OrganizerDashboard />,
  },
  {
    path: "/updates",
    element: (
      <ProtectedRoute>
        <Updates />
      </ProtectedRoute>
    ),
  },
  {
    path: "/dates",
    element: (
      <ProtectedRoute>
        <ImportantDates />
      </ProtectedRoute>
    ),
  },
  {
    path: "/freshers",
    element: (
      <ProtectedRoute>
        <FreshersHub />
      </ProtectedRoute>
    ),
  },
  {
    path: "/ask",
    element: (
      <ProtectedRoute>
        <AskCampusGuide />
      </ProtectedRoute>
    ),
  },
  {
    path: "/about",
    element: <About />,
  },
  {
    path: "/payment/confirm",
    element: <PaymentConfirmation />,
  },
  {
    path: "/contact",
    element: <Contact />,
  },
  {
    path: "/test-warning",
    element: <TestWarning />,
  },
  {
    path: "/test",
    element: <TestInterface />,
  },
  {
    path: "/results",
    element: <Results />,
  },
  {
    path: "/review/:resultId",
    element: <ExamReview />,
  },
  {
    path: "*",
    element: <NotFound />,
  },
]);
