// Rolling CSV export windows offered by the download picker.
export const downloadRanges = [
  { id: "monthly", label: "Monthly", days: 30 },
  { id: "quarterly", label: "Quarterly", days: 90 },
  { id: "yearly", label: "Yearly", days: 365 },
] as const;

export type DownloadRangeId = (typeof downloadRanges)[number]["id"];
