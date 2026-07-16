export const colors = {
  white: "#ffffff",
  muted: "#473f3f",
  primary: "#0b3d59",
  pressed: "rgba(0, 0, 0, 0.25)",
} as const;

export type AppColor = keyof typeof colors;
