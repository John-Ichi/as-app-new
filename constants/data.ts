import { icons } from "./icons";

export const DrawerRoutes = [
  {
    name: "index",
    title: "Home",
    label: "Dashboard",
    description: "Predictive monitoring for aquaculture safety.",
    icon: icons.home,
  },
  {
    name: "graphs",
    title: "Graphs",
    label: "Data Graphs",
    description: "Real-time water quality trend visualization.",
    icon: icons.graph,
  },
  {
    name: "parameters",
    title: "Parameters",
    label: "Water Quality Parameters",
    description: "Live metrics for water quality.",
    icon: icons.setting,
  },
  {
    name: "notifications",
    title: "Notifications",
    label: "Alert Notifications",
    description: "Instant notifications for ammonia risks.",
    icon: icons.bell,
  },
];
