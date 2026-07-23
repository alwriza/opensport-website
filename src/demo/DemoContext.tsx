import { createContext, useContext, ReactNode } from "react";
import { DEMO_DATA, DemoData } from "./demoData";

const DemoContext = createContext<DemoData | undefined>(undefined);

export function DemoProvider({ children }: { children: ReactNode }) {
  return (
    <DemoContext.Provider value={DEMO_DATA}>
      {children}
    </DemoContext.Provider>
  );
}

export function useDemoContext(): DemoData | undefined {
  return useContext(DemoContext);
}
