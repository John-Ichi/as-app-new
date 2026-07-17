import { ScrollView, Text, View } from "react-native";

interface DataTableRow {
  label: string;
  values: string[];
}

interface DataTableProps {
  columns: string[];
  rows: DataTableRow[];
  colWidth: number;
  headerPy?: string;
  rowPy?: string;
  nestedScroll?: boolean;
}

const DataTable = ({
  columns,
  rows,
  colWidth,
  headerPy = "py-1.5",
  rowPy = "py-1.5",
  nestedScroll = false,
}: DataTableProps) => {
  const header = (
    <View className="flex-row bg-primary">
      <Text
        style={{ width: colWidth }}
        className={`text-sm text-center text-white font-poppins-bold ${headerPy}`}
      >
        Time
      </Text>
      {columns.map((col) => (
        <Text
          key={col}
          style={{ width: colWidth }}
          className={`text-sm text-center text-white font-poppins-bold ${headerPy}`}
        >
          {col}
        </Text>
      ))}
    </View>
  );

  const body = rows.map((row, i) => (
    <View
      key={i}
      className={`flex-row ${i % 2 === 0 ? "bg-white" : "bg-background"} border-b border-border`}
    >
      <Text
        style={{ width: colWidth }}
        className={`text-sm text-center text-primary font-poppins-bold ${rowPy}`}
      >
        {row.label}
      </Text>
      {row.values.map((val, j) => (
        <Text
          key={j}
          style={{ width: colWidth }}
          className={`text-sm text-center text-primary font-poppins-regular ${rowPy}`}
        >
          {val}
        </Text>
      ))}
    </View>
  ));

  const table = (
    <View
      className={`${nestedScroll ? "flex-1" : ""} border border-border rounded-sm overflow-hidden`}
    >
      {header}
      {nestedScroll ? <ScrollView className="flex-1">{body}</ScrollView> : body}
    </View>
  );

  return (
    <ScrollView horizontal className={nestedScroll ? "flex-1" : ""}>
      {table}
    </ScrollView>
  );
};

export default DataTable;
