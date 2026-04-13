import React, { useEffect, useState } from 'react';
import { animate } from 'framer-motion';

interface CountUpProps {
  value: number;
  duration?: number;
  formatter?: (val: number) => string;
}

export function CountUp({ value, duration = 0.8, formatter = (val) => val.toLocaleString() }: CountUpProps) {
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    const controls = animate(displayValue, value, {
      duration,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (latest) => setDisplayValue(latest),
    });

    return () => controls.stop();
  }, [value, duration]);

  return <span>{formatter(Math.round(displayValue))}</span>;
}
