"use client";

import { useEffect, useRef, useState } from "react";

export default function CountUp({
  value,
  duration = 800,
  formatter = (v) => v,
  className,
}) {
  const [display, setDisplay] = useState(0);
  const frameRef = useRef();
  const startRef = useRef();

  useEffect(() => {
    const target = Number(value) || 0;
    startRef.current = null;

    function step(timestamp) {
      if (!startRef.current) startRef.current = timestamp;
      const progress = Math.min((timestamp - startRef.current) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(target * eased);
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(step);
      } else {
        setDisplay(target);
      }
    }

    frameRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frameRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, duration]);

  return <span className={className}>{formatter(display)}</span>;
}
