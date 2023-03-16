import { useState } from "react";
import { unixNow } from "Util";

export default function useTimelineWindow(opt: { window?: number }) {
  const [now] = useState(unixNow());
  const [window] = useState(opt.window ?? 60 * 60);
  const [until, setUntil] = useState(now);
  const [since, setSince] = useState(now - window);

  return {
    now,
    since,
    until,
    setUntil,
    older: () => {
      setUntil(s => s - window);
      setSince(s => s - window);
    },
  };
}
