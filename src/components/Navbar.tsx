import { motion } from 'framer-motion';
import { Wallet } from 'lucide-react';
import { ChromaticText } from './ChromaticText';

interface NavbarProps {
  account: string | null;
  balance: string;
  onConnect: () => void;
  logo: string;
  isLogoLoaded: boolean;
}

export function Navbar({ account, balance, onConnect, logo, isLogoLoaded }: NavbarProps) {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-lg border-b border-white/10">
      <div className="w-full px-2 sm:px-4 h-14 sm:h-20 flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-4">
          <motion.div 
            className="h-8 w-8 sm:h-12 sm:w-12 relative"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {isLogoLoaded ? (
              <motion.img 
                src={logo} 
                alt="Push Logo" 
                className="h-full w-full object-contain"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              />
            ) : (
              <div className="h-full w-full bg-white/10 rounded-lg animate-pulse" />
            )}
          </motion.div>
          <a 
            href="https://zora.co/coin/base:0xb9c09c06508613ef5f69ef1e1396f5acb476029c?referrer=0xe697b1bcf17a0edc2df872de1c7258c7cc434745"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:block"
          >
            <ChromaticText 
              text="$THE LAST DAY" 
              className="text-xl sm:text-2xl"
            />
          </a>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-4">
          {account && Number(balance) > 0 && (
            <div className="flex items-center gap-2 px-2 sm:px-4 py-1.5 sm:py-2 bg-white/5 rounded-full border border-white/10 text-[10px] sm:text-sm">
              <span className="font-mono text-white/80">
                {parseFloat(balance).toFixed(2)} $THE LAST DAY
              </span>
            </div>
          )}
          <motion.button
            onClick={onConnect}
            className="flex items-center gap-1.5 sm:gap-2 bg-gradient-to-r from-red-500 to-blue-500 text-white px-2.5 sm:px-6 py-1.5 sm:py-3 rounded-full hover:from-red-600 hover:to-blue-600 transition-all text-xs sm:text-base"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Wallet className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
            {account ? `${account.slice(0, 4)}...${account.slice(-4)}` : 'Connect'}
          </motion.button>
        </div>
      </div>
    </nav>
  );
}