import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface RingSegment {
  percentage: number;
  color: string;
  label?: string;
  amount?: number;
}

interface CircularRingProps {
  percentage: number;
  size?: number;
  thickness?: number;
  color?: string;
  trackColor?: string;
  children?: React.ReactNode;
  numSegments?: number;
  segments?: RingSegment[];
}

export function CircularRing({ 
  percentage, 
  size = 240, 
  thickness = 30, 
  color = '#ffffff', 
  trackColor = '#222222',
  numSegments = 40,
  tintColor,
  segments,
  children 
}: CircularRingProps & { tintColor?: string }) {
  const [hoveredSegment, setHoveredSegment] = React.useState<RingSegment | null>(null);
  const radius = (size / 2) - (thickness / 2) - 4;
  const segmentWidth = (2 * Math.PI * radius) / numSegments * 0.7; // 70% fill, 30% gap
  
  const safePercentage = Math.min(Math.max(percentage, 0), 100);
  const totalActiveCount = Math.round((safePercentage / 100) * numSegments);

  // Calculate segment mapping if segments are provided
  const segmentMapping = React.useMemo(() => {
    if (!segments || segments.length === 0) return null;
    
    const mapping: (RingSegment & { index: number })[] = [];
    let currentSegment = 0;
    
    segments.forEach((seg, idx) => {
      const count = Math.round((seg.percentage / 100) * numSegments);
      for (let i = 0; i < count && currentSegment < numSegments; i++) {
        mapping[currentSegment] = { ...seg, index: idx };
        currentSegment++;
      }
    });
    
    return mapping;
  }, [segments, numSegments]);

  return (
    <div 
      className="relative flex items-center justify-center mx-auto aspect-square" 
      style={{ width: size, maxWidth: '100%' }}
    >
      <svg 
        viewBox={`0 0 ${size} ${size}`}
        className="absolute inset-0 w-full h-full overflow-visible"
      >
        {Array.from({ length: numSegments }).map((_, i) => {
          const angle = (i / numSegments) * 360;
          const isActive = i < totalActiveCount;
          const activeSeg = segmentMapping ? segmentMapping[i] : null;
          const segmentColor = tintColor || (activeSeg ? activeSeg.color : color);
          const isHovered = hoveredSegment && activeSeg && hoveredSegment.label === activeSeg.label;
          
          return (
            <g 
              key={i} 
              transform={`translate(${size/2}, ${size/2}) rotate(${angle}) translate(0, -${radius})`}
              onMouseEnter={() => activeSeg && setHoveredSegment(activeSeg)}
              onMouseLeave={() => setHoveredSegment(null)}
              className="cursor-pointer"
            >
              <motion.rect
                x={-segmentWidth / 2}
                y={-thickness / 2}
                width={segmentWidth}
                height={thickness}
                rx={2}
                initial={{ fill: trackColor }}
                animate={{ 
                  fill: isActive 
                    ? (segmentColor || trackColor) 
                    : trackColor,
                  opacity: isActive ? (isHovered ? 1 : [0.8, 1, 0.8]) : 0.3,
                  scale: isActive ? (isHovered ? 1.15 : [1, 1.02, 1]) : 1,
                  stroke: isHovered ? '#fff' : 'transparent',
                  strokeWidth: isHovered ? 1 : 0
                }}
                transition={{ 
                  fill: { delay: i * 0.01, duration: 0.2 },
                  opacity: { 
                    repeat: isHovered ? 0 : Infinity, 
                    duration: 3 + Math.random() * 2, 
                    ease: "easeInOut",
                    delay: i * 0.1
                  },
                  scale: {
                    repeat: isHovered ? 0 : Infinity,
                    duration: 4 + Math.random() * 2,
                    ease: "easeInOut",
                    delay: i * 0.1
                  },
                  stroke: { duration: 0.2 }
                }}
                style={{ 
                  filter: isActive 
                    ? `drop-shadow(0px 0px 8px ${segmentColor}${isHovered ? '80' : '40'})` 
                    : 'none',
                }}
              />
            </g>
          );
        })}
      </svg>
      
      <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none">
        <AnimatePresence mode="wait">
          {hoveredSegment ? (
            <motion.div
              key="tooltip"
              initial={{ opacity: 0, scale: 0.9, y: 5 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 5 }}
              className="flex flex-col items-center text-center"
            >
              <span className="font-mono text-[10px] text-sys-muted uppercase tracking-widest mb-1">
                {hoveredSegment.label}
              </span>
              <span className="font-pixel text-xl text-white">
                ₹{hoveredSegment.amount?.toLocaleString()}
              </span>
            </motion.div>
          ) : (
            <motion.div
              key="content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center"
            >
              {children}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
