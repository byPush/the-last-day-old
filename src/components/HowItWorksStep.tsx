import { motion } from 'framer-motion';
import { DivideIcon as LucideIcon } from 'lucide-react';

interface HowItWorksStepProps {
  icon: LucideIcon;
  title: string;
  description: string;
  index: number;
}

export function HowItWorksStep({ icon: Icon, title, description, index }: HowItWorksStepProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.2 }}
      className="flex flex-col items-center text-center p-3 sm:p-4 rounded-lg sm:rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm"
    >
      <div className="mb-1.5 sm:mb-2 p-1.5 sm:p-2 rounded-full bg-gradient-to-br from-red-500/20 to-blue-500/20 border border-white/10">
        <Icon className="w-4 h-4 sm:w-6 sm:h-6" />
      </div>
      <h3 className="text-sm sm:text-lg font-bold mb-0.5 sm:mb-1">{title}</h3>
      <p className="text-[11px] sm:text-sm text-white/80 leading-tight">{description}</p>
    </motion.div>
  );
}