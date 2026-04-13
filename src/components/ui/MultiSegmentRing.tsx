import React from 'react';
import { motion } from 'framer-motion';

interface Segment {
  label: string;
  value: number;
  color: string;
}

interface MultiSegmentRingProps {
  segments: Segment[];
  size?: number;
  thickness?: number;
  numSegments?: number;
  children?: React.ReactNode;
}

export function MultiSegmentRing({ 
  segments, 
  size = 240, 
  thickness = 30, 
  numSegments = 40,
  children 
}: MultiSegmentRingProps) {
  const [hovered, setHovered] = React.useState<Segment | null>(null);
  const radius = (size / 2) - (thickness / 2) - 4;
  const segmentWidth = (2 * Math.PI * radius) / numSegments * 0.7;
  
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  
  // Map each of the numSegments to a category based on cumulative percentage
  const segmentData = Array.from({ length: numSegments }).map((_, i) => {
    const segmentPercentage = (i / numSegments) * 100;
    let cumulative = 0;
    let foundSegment = segments[0];
    
    for (const s of segments) {
      cumulative += (s.value / total) * 100;
      if (segmentPercentage < cumulative) {
        foundSegment = s;
        break;
      }
    }
    
    return foundSegment;
  });

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="absolute inset-0 overflow-visible">
        {segmentData.map((data, i) => {
          const angle = (i / numSegments) * 360;
          const isHovered = hovered?.label === data?.label;
          
          return (
            <g 
              key={i} 
              transform={`translate(${size/2}, ${size/2}) rotate(${angle}) translate(0, -${radius})`}
              onMouseEnter={() => setHovered(data)}
              onMouseLeave={() => setHovered(null)}
              className="cursor-pointer"
            >
              <motion.rect
                x={-segmentWidth / 2}
                y={-thickness / 2}
                width={segmentWidth}
                height={thickness}
                rx={2}
                initial={{ fill: '#1A1A1A' }}
                animate={{ 
                  fill: data?.color || '#1A1A1A',
                  scale: isHovered ? 1.2 : 1,
                }}
                transition={{ duration: 0.2 }}
                style={{ 
                  filter: isHovered ? `drop-shadow(0px 0px 8px ${data.color})` : `drop-shadow(0px 0px 4px ${data.color}20)`,
                  opacity: isHovered ? 1 : 0.8
                }}
              />
            </g>
          );
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none">
        {hovered ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center">
            <span className="font-mono text-[10px] text-sys-muted uppercase">{hovered.label}</span>
            <span className="font-pixel text-xl">₹{hovered.value.toLocaleString()}</span>
          </motion.div>
        ) : children}
      </div>
    </div>
  );
}
