import { useEffect, useState } from "react";

export default function useSidebarState() {
  const [open, setOpen] = useState(true);
  useEffect(() => {
    const saved = localStorage.getItem("agi-cad:sidebar");
    if (saved !== null) setOpen(saved === "true");
  }, []);
  useEffect(() => {
    localStorage.setItem("agi-cad:sidebar", open);
  }, [open]);
  return { open, toggle: () => setOpen(o => !o) };
}
