import type { LayoutChangeEvent } from "react-native";
import { ScrollView } from "react-native";
import { useCallback, useRef } from "react";

type SectionKey = "locations" | "observations";

/**
 * Scroll-into-view helper for the weather screen's sections. One shared
 * ScrollView ref plus per-section layout positions recorded via
 * `recordSection(key)`. Focusing a search bar scrolls its section into view
 * (so the keyboard never hides the results); a slight -8 offset keeps the
 * section header visible under any offset.
 * Not navigation — the sections are always in view on the screen.
 */
export function useSectionScroll() {
  const scrollRef = useRef<ScrollView>(null);
  const sectionY = useRef<Record<SectionKey, number>>({
    locations: 0,
    observations: 0,
  });

  const scrollToSection = useCallback((key: SectionKey) => {
    scrollRef.current?.scrollTo({
      y: Math.max(sectionY.current[key] - 8, 0),
      animated: true,
    });
  }, []);

  const recordSection =
    (key: SectionKey) => (e: LayoutChangeEvent) => {
      sectionY.current[key] = e.nativeEvent.layout.y;
    };

  return { scrollRef, recordSection, scrollToSection };
}
