export interface Notification {
  id: string;
  type: "critical" | "warning";
  title: string;
  date: string;
}

export function useNotifications(): Notification[] {
  return [
    {
      id: "1",
      type: "critical",
      title: "AMMONIA SPIKE",
      date: "May 16, 2026 10:00 PM",
    },
    {
      id: "2",
      type: "warning",
      title: "TEMP FLUCTUATIONS",
      date: "May 07, 2026 10:00 PM",
    },
  ];
}
