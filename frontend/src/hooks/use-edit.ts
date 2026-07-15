"use client";

import { useState } from "react";

export function useEdit() {
  const [editing, setEditing] = useState(false);
  const start = () => setEditing(true);
  const stop = () => setEditing(false);
  return { editing, start, stop };
}
