"use client";

import { useState } from "react";
import IdleView from "@/components/IdleView";
import ActiveView from "@/components/ActiveView";

export default function Home() {
  const [isAwake, setIsAwake] = useState(false);

  return (
    <>
      {!isAwake ? (
        <IdleView onWakeUp={() => setIsAwake(true)} />
      ) : (
        <ActiveView onSleep={() => setIsAwake(false)} />
      )}
    </>
  );
}
