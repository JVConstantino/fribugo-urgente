import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { getSetting } from "@/services/supabase";

interface SettingsContextValue {
  showViews: boolean;
}

const SettingsContext = createContext<SettingsContextValue>({ showViews: true });

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [showViews, setShowViews] = useState(true);

  useEffect(() => {
    getSetting("show_views")
      .then((val) => { if (val !== null) setShowViews(val === "true"); })
      .catch(() => {});
  }, []);

  return (
    <SettingsContext.Provider value={{ showViews }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
