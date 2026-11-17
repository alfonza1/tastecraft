import { useEffect, useRef, useState } from "react";
import {
  LIBRARY_KEY,
  parseLibrary,
  readLibrary,
  writeLibrary,
  type Library,
} from "./library";

export function useLibrary() {
  const [initial] = useState(() =>
    readLibrary({
      getItem: (key) => localStorage.getItem(key),
      setItem: (key, value) => localStorage.setItem(key, value),
    }),
  );
  const [library, setLibrary] = useState(initial.library);
  const [storageError, setStorageError] = useState(initial.error);
  const expected = useRef(initial.baseline);
  const paused = useRef(Boolean(initial.error));
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let cancelled = false;
    if (paused.current) return;
    async function save() {
      try {
        if (!navigator.locks)
          throw new Error(
            "Safe browser storage is unavailable. Export a library backup before closing this tab.",
          );
        await navigator.locks.request(LIBRARY_KEY, () => {
          if (cancelled || paused.current) return;
          expected.current = writeLibrary(
            localStorage,
            library,
            expected.current,
          );
          setStorageError("");
        });
      } catch (error) {
        paused.current = true;
        setStorageError(
          error instanceof Error && error.message.includes("Another tab")
            ? error.message
            : "Browser storage is unavailable or full. Your edits are in this tab only. Export a library backup before closing.",
        );
      }
    }
    void save();
    return () => {
      cancelled = true;
    };
  }, [library, retry]);
  useEffect(() => {
    function changed(event: StorageEvent) {
      if (
        (event.key === LIBRARY_KEY || event.key === null) &&
        event.newValue !== expected.current
      ) {
        paused.current = true;
        setStorageError(
          "Another tab changed this library. Saving is paused to protect both versions. Back up this tab before loading the latest library.",
        );
      }
    }
    window.addEventListener("storage", changed);
    return () => window.removeEventListener("storage", changed);
  }, []);
  function loadLatest(): Library {
    const raw = localStorage.getItem(LIBRARY_KEY);
    if (!raw)
      throw new Error(
        "No saved library is available. Export your current work before replacing browser storage.",
      );
    const latest = parseLibrary(raw);
    expected.current = raw;
    paused.current = false;
    setStorageError("");
    setLibrary(latest);
    return latest;
  }
  function replaceStorage() {
    expected.current = localStorage.getItem(LIBRARY_KEY);
    paused.current = false;
    setRetry((value) => value + 1);
  }
  return { library, setLibrary, storageError, loadLatest, replaceStorage };
}
