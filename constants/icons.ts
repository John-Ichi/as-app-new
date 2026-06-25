import bell from "@/assets/icons/bell.png";
import graph from "@/assets/icons/graph.png";
import home from "@/assets/icons/home.png";
import logo from "@/assets/icons/logo.png";
import setting from "@/assets/icons/setting.png";

export const icons = {
  bell,
  graph,
  home,
  logo,
  setting,
} as const;

export type IconKey = keyof typeof icons;
