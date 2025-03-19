import { motion } from 'framer-motion';
import clsx from 'clsx';

interface ChromaticTextProps {
  text: string;
  className?: string;
  onClick?: () => void;
}

export function ChromaticText({ text, className = '', onClick }: ChromaticTextProps) {
  return (
    <motion.h1 
      className={clsx("font-black text-white", className)}
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {text}
    </motion.h1>
  );
}