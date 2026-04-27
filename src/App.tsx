import React, { useEffect, useState } from "react";
import { Taskboard } from "./components/Taskboard";

async function enableMocking() {
  if (process.env.NODE_ENV !== "development") return;
  const { worker } = await import("./mocks/browser");
  return worker.start({ onUnhandledRequest: "bypass" });
}

export default function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    enableMocking().then(() => setReady(true));
  }, []);

  if (!ready) return null;

  return <Taskboard />;
}