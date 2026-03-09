import { createBrowserRouter } from "react-router";
import { Root } from "./components/Root";
import { Dashboard } from "./components/Dashboard";
import { History } from "./components/History";
import { Settings } from "./components/Settings";
import { Onboarding } from "./components/Onboarding";
import { SignIn } from "./components/SignIn";
import { DietPlan } from "./components/DietPlan";
import { GymRoutine } from "./components/GymRoutine";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      { index: true, Component: Dashboard },
      { path: "diet", Component: DietPlan },
      { path: "gym", Component: GymRoutine },
      { path: "history", Component: History },
      { path: "settings", Component: Settings },
    ],
  },
  {
    path: "/signin",
    Component: SignIn,
  },
  {
    path: "/onboarding",
    Component: Onboarding,
  },
]);