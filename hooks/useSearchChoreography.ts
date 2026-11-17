import { useDrawerStatus } from "@react-navigation/drawer";
import { useFocusEffect } from "expo-router";
import { Keyboard, Platform } from "react-native";
import { Dispatch, SetStateAction, useCallback, useEffect, useRef, useState } from "react";

type SectionKey = "locations" | "observations";

interface Options {
  scrollToSection: (key: SectionKey) => void;
  setLocationQuery: Dispatch<SetStateAction<string>>;
  setObservationQuery: Dispatch<SetStateAction<string>>;
  setLocOpen: Dispatch<SetStateAction<boolean>>;
  setObsOpen: Dispatch<SetStateAction<boolean>>;
}

/**
 * Search dropdown + keyboard choreography for the weather screen:
 * - only one dropdown open at a time (focus swaps them)
 * - blur dismisses the dropdowns after a short grace period (web)
 * - keyboard appearance is tracked so a focused search can scroll its
 *   section into view after the keyboard contract settles
 * - leaving the screen (blur) or opening the drawer dismisses everything
 */
export function useSearchChoreography({
  scrollToSection,
  setLocationQuery,
  setObservationQuery,
  setLocOpen,
  setObsOpen,
}: Options): {
  keyboardHeight: number;
  handleSearchFocus: (key: SectionKey) => void;
  handleSearchBlur: () => void;
  dismissSearch: () => void;
  resetSearch: () => void;
} {
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const keyboardVisible = useRef(false);
  const pendingSection = useRef<SectionKey | null>(null);
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const show = Keyboard.addListener("keyboardDidShow", (e) => {
      keyboardVisible.current = true;
      setKeyboardHeight(e.endCoordinates.height);
      if (pendingSection.current) {
        scrollToSection(pendingSection.current);
        pendingSection.current = null;
      }
    });
    const hide = Keyboard.addListener("keyboardDidHide", () => {
      keyboardVisible.current = false;
      setKeyboardHeight(0);
      pendingSection.current = null;
    });
    return () => {
      show.remove();
      hide.remove();
    };
  }, [scrollToSection]);

  useEffect(
    () => () => {
      if (blurTimer.current) clearTimeout(blurTimer.current);
    },
    [],
  );

  const handleSearchFocus = (key: SectionKey) => {
    if (blurTimer.current) {
      clearTimeout(blurTimer.current);
      blurTimer.current = null;
    }
    if (key === "locations") {
      setLocOpen(true);
      setObsOpen(false);
    } else {
      setObsOpen(true);
      setLocOpen(false);
    }
    if (keyboardVisible.current) scrollToSection(key);
    else pendingSection.current = key;
  };

  const dismissSearch = useCallback(() => {
    Keyboard.dismiss();
    setLocOpen(false);
    setObsOpen(false);
  }, [setLocOpen, setObsOpen]);

  const handleSearchBlur = () => {
    if (Platform.OS !== "web") return;
    if (blurTimer.current) clearTimeout(blurTimer.current);
    // Web-only: a small grace period lets clicking a result register before
    // the blur dismisses the dropdown.
    blurTimer.current = setTimeout(() => dismissSearch(), 150);
  };

  const resetSearch = useCallback(() => {
    dismissSearch();
    setLocationQuery("");
    setObservationQuery("");
  }, [dismissSearch, setLocationQuery, setObservationQuery]);

  useFocusEffect(useCallback(() => () => resetSearch(), [resetSearch]));

  const drawerStatus = useDrawerStatus();
  useEffect(() => {
    if (drawerStatus === "open") dismissSearch();
  }, [drawerStatus, dismissSearch]);

  return {
    keyboardHeight,
    handleSearchFocus,
    handleSearchBlur,
    dismissSearch,
    resetSearch,
  };
}
