# Finish ParameterCard Component

## 1. Edit `components/ParameterCard.tsx`

Replace entire file content:

```tsx
import { parameterMap, type ParameterId } from "@/constants/parameters";
import { Image, Text, View } from "react-native";

interface ParameterCardProps {
  id: ParameterId;
  value: number;
  className?: string;
}

const ParameterCard = ({ id, value, className = "" }: ParameterCardProps) => {
  const metadata = parameterMap[id];
  const wide = metadata.fullWidth;

  return (
    <View
      className={`${wide ? "w-full flex-row items-center" : "w-[48%]"} bg-white rounded-sm p-4 shadow-md shadow-slate-400/30 justify-between ${className}`}
    >
      <View className="flex-row gap-x-2 items-center">
        <Image source={metadata.icon} className="size-6" />
        <Text className={`${wide ? "tracking-wide" : ""} text-md text-primary font-poppins-bold`}>
          {metadata.label}
        </Text>
      </View>
      <Text className="text-lg text-primary font-poppins-bold">
        {value} {metadata.unit}
      </Text>
    </View>
  );
};

export default ParameterCard;
```

## 2. Edit `app/(drawer)/index.tsx`

- Replace `readings.map(...)` block (lines 47–68) with:

```tsx
{readings.map((reading) => (
  <ParameterCard key={reading.id} id={reading.id} value={reading.value} />
))}
```

- Remove `parameterMap` from the import on line 3.
- Add `import ParameterCard from "@/components/ParameterCard";` 
