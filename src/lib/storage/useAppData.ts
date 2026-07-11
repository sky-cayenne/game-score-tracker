"use client";

import { useEffect, useMemo, useState } from "react";
import { emptyData, loadData, saveData, seedDemoData } from "@/lib/storage/localDb";
import type { AppData } from "@/types/domain";

export function useAppData() {
  const [data, setData] = useState<AppData>(emptyData);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setData(seedDemoData());
    setReady(true);
  }, []);

  const api = useMemo(
    () => ({
      data,
      ready,
      setData(nextData: AppData) {
        setData(nextData);
        saveData(nextData);
      },
      reload() {
        setData(loadData());
      }
    }),
    [data, ready]
  );

  return api;
}
