import React, { useRef } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import clsx from 'clsx';

interface ArtworkCardProps {
  artwork: {
    id: number;
    title: string;
    image: string;
  };
  index: number;
  onClick: () => void;
  onVote: () => void;
  canVote: boolean;
  isLoaded: boolean;
  dimensions?: { width: number; height: number };
  voteCount: number;
}

export function ArtworkCard({ artwork, index, onClick, onVote, canVote, isLoaded, dimensions, voteCount }: ArtworkCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useTransform(mouseY, [-100, 100], [10, -10]);
  const rotateY = useTransform(mouseX, [-100, 100], [-10, 10]);
  const scale = useTransform(
    [mouseX, mouseY],
    ([latestX, latestY]) => {
      const dist = Math.sqrt(latestX * latestX + latestY * latestY);
      return 1 + Math.min(dist / 1000, 0.1);
    }
  );

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    mouseX.set(e.clientX - centerX);
    mouseY.set(e.clientY - centerY);
  };

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        delay: index * 0.1,
        type: "spring",
        damping: 15,
        stiffness: 150
      }}
      className="group relative aspect-square bg-black rounded-xl sm:rounded-2xl overflow-hidden border border-white/10 hover:border-white/20 transition-all cursor-pointer perspective-1000"
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => {
        mouseX.set(0);
        mouseY.set(0);
      }}
      style={{
        rotateX,
        rotateY,
        scale,
        transformStyle: "preserve-3d"
      }}
    >
      {isLoaded ? (
        <motion.div
          className="w-full h-full flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <img
            src={artwork.image}
            alt={artwork.title}
            className="w-full h-full object-cover"
          />
        </motion.div>
      ) : (
        <motion.div 
          className="w-full h-full bg-white/10"
          animate={{ 
            background: [
              "linear-gradient(90deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0.1) 100%)",
              "linear-gradient(90deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.2) 100%)"
            ]
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "linear"
          }}
        />
      )}
      <div className="artwork-info absolute inset-x-0 bottom-0 p-3 sm:p-6 bg-gradient-to-t from-black/80 via-black/50 to-transparent">
        <h2 className="text-lg sm:text-2xl font-bold mb-2 sm:mb-4">{artwork.title}</h2>
        <div className="flex items-center justify-between">
          <span className="text-sm text-white/80">{voteCount} votes</span>
          <motion.button
            onClick={(e) => {
              e.stopPropagation();
              onVote();
            }}
            className={clsx(
              "px-4 sm:px-6 py-2 sm:py-3 rounded-full text-sm sm:text-base",
              canVote
                ? "bg-gradient-to-r from-red-500 to-blue-500 hover:from-red-600 hover:to-blue-600"
                : "bg-gray-600 cursor-not-allowed"
            )}
            disabled={!canVote}
            whileHover={canVote ? { scale: 1.02 } : {}}
            whileTap={canVote ? { scale: 0.98 } : {}}
          >
            Vote
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}