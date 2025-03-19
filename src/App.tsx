import React, { useState, useEffect, useRef } from 'react';
import { X, AlertCircle, Vote, Palette, Coins } from 'lucide-react';
import Web3 from 'web3';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { ArtworkCard } from './components/ArtworkCard';
import { Navbar } from './components/Navbar';
import { ChromaticText } from './components/ChromaticText';
import { HowItWorksStep } from './components/HowItWorksStep';

const CONTRACT_ADDRESS = '0xb9c09c06508613ef5f69ef1e1396f5acb476029c';
const BASE_CHAIN_ID = '0x2105';

const IMAGES = {
  logo: 'https://i.ibb.co/xthn3zcP/p.png',
  hero: 'https://i.ibb.co/1GLRtJRX/1000-def.jpg',
  artworks: {
    '1': 'https://i.ibb.co/JWRqf0KP/1.jpg',
    '2': 'https://i.ibb.co/Ng8SPwYC/placeholder.gif',
    '3': 'https://i.ibb.co/Ng8SPwYC/placeholder.gif',
    '4': 'https://i.ibb.co/Ng8SPwYC/placeholder.gif',
    '5': 'https://i.ibb.co/Ng8SPwYC/placeholder.gif',
    '6': 'https://i.ibb.co/Ng8SPwYC/placeholder.gif',
    '7': 'https://i.ibb.co/Ng8SPwYC/placeholder.gif'
  }
};

const STEPS = [
  {
    icon: Vote,
    title: 'Weekly Voting',
    description: 'Holders of $THE LAST DAY can vote for ONLY 1 showcased artwork every week'
  },
  {
    icon: Palette,
    title: 'Manifold Mint',
    description: 'The most voted artworks will become a Manifold mint'
  },
  {
    icon: Coins,
    title: 'Exclusive Access',
    description: 'You will be able to mint it ONLY with $THE LAST DAY so make sure to stack up some extra'
  }
];

const artworks = [
  { id: 1, title: 'LIFE CANVAS', image: IMAGES.artworks['1'] },
  { id: 2, title: '???', image: IMAGES.artworks['2'] },
  { id: 3, title: '???', image: IMAGES.artworks['3'] },
  { id: 4, title: '???', image: IMAGES.artworks['4'] },
  { id: 5, title: '???', image: IMAGES.artworks['5'] },
  { id: 6, title: '???', image: IMAGES.artworks['6'] },
  { id: 7, title: '???', image: IMAGES.artworks['7'] }
];

const getNextMonday = () => {
  const now = new Date();
  const nextMonday = new Date();
  nextMonday.setUTCHours(0, 0, 0, 0);
  nextMonday.setUTCDate(now.getUTCDate() + ((7 - now.getUTCDay() + 1) % 7 || 7));
  return nextMonday.getTime();
};

function App() {
  const [account, setAccount] = useState<string | null>(null);
  const [balance, setBalance] = useState<string>('0');
  const [votes, setVotes] = useState<Record<number, Record<string, { timestamp: number, expiresAt: number }>>>({});
  const [selectedArtwork, setSelectedArtwork] = useState<number | null>(null);
  const [imagesLoaded, setImagesLoaded] = useState<Record<string, boolean>>({});
  const [imageDimensions, setImageDimensions] = useState<Record<string, { width: number; height: number }>>({});
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedArtwork(null);
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        setSelectedArtwork(null);
      }
    };

    window.addEventListener('keydown', handleEscape);
    if (selectedArtwork) document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('keydown', handleEscape);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [selectedArtwork]);

  useEffect(() => {
    const preloadImage = (src: string) => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = src;
        img.onload = () => {
          setImagesLoaded(prev => ({ ...prev, [src]: true }));
          setImageDimensions(prev => ({
            ...prev,
            [src]: { width: img.naturalWidth, height: img.naturalHeight }
          }));
          resolve(src);
        };
        img.onerror = (error) => {
          console.error(`Failed to load image: ${src}`, error);
          setImagesLoaded(prev => ({ ...prev, [src]: false }));
          reject(error);
        };
      });
    };

    Promise.all([
      preloadImage(IMAGES.logo),
      preloadImage(IMAGES.hero),
      ...Object.values(IMAGES.artworks).map(preloadImage)
    ]).catch(error => {
      console.error('Image preloading error:', error);
    });
  }, []);

  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: BASE_CHAIN_ID }],
          });
        } catch (switchError: any) {
          if (switchError.code === 4902) {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: BASE_CHAIN_ID,
                chainName: 'Base',
                nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
                rpcUrls: ['https://mainnet.base.org'],
                blockExplorerUrls: ['https://basescan.org']
              }]
            });
          }
        }

        setAccount(accounts[0]);
        await checkZoraBalance(accounts[0]);
      } catch (error) {
        console.error('Error connecting to MetaMask', error);
      }
    } else {
      alert('Please install MetaMask!');
    }
  };

  const checkZoraBalance = async (address: string) => {
    if (!address) {
      console.error('No address provided for balance check');
      setBalance('0');
      return;
    }

    const web3 = new Web3(window.ethereum);
    const minABI = [
      {
        constant: true,
        inputs: [{ name: "_owner", type: "address" }],
        name: "balanceOf",
        outputs: [{ name: "balance", type: "uint256" }],
        type: "function",
      },
    ];

    try {
      const contract = new web3.eth.Contract(minABI as any, CONTRACT_ADDRESS);
      const result = await contract.methods.balanceOf(address).call();
      
      if (result === undefined || result === null) {
        console.error('Invalid balance result:', result);
        setBalance('0');
        return;
      }

      const balanceStr = result.toString();
      const balanceInEth = web3.utils.fromWei(balanceStr, 'ether');
      setBalance(balanceInEth);
    } catch (error) {
      console.error('Error checking Zora balance:', error);
      setBalance('0');
    }
  };

  const handleVote = (artworkId: number) => {
    if (!account || Number(balance) === 0) {
      alert('You need $THE LAST DAY to vote!');
      return;
    }

    const now = Date.now();
    const nextMonday = getNextMonday();
    const userVotes = Object.entries(votes).reduce((acc, [id, voters]) => {
      if (voters[account] && voters[account].expiresAt > now) {
        acc.push(parseInt(id));
      }
      return acc;
    }, [] as number[]);

    if (userVotes.length > 0) {
      const expiryDate = new Date(votes[userVotes[0]][account].expiresAt);
      alert(`You've already voted this week. Your vote will reset on ${expiryDate.toLocaleString()}`);
      return;
    }

    setVotes(prev => ({
      ...prev,
      [artworkId]: {
        ...(prev[artworkId] || {}),
        [account]: {
          timestamp: now,
          expiresAt: nextMonday
        }
      }
    }));
  };

  const getVoteCount = (artworkId: number) => {
    const now = Date.now();
    return Object.values(votes[artworkId] || {}).filter(vote => vote.expiresAt > now).length;
  };

  const canVote = (artworkId: number) => {
    if (!account || Number(balance) === 0) return false;
    
    const now = Date.now();
    const userVotes = Object.entries(votes).reduce((acc, [id, voters]) => {
      if (voters[account] && voters[account].expiresAt > now) {
        acc.push(parseInt(id));
      }
      return acc;
    }, [] as number[]);

    return userVotes.length === 0;
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar 
        account={account}
        balance={balance}
        onConnect={connectWallet}
        logo={IMAGES.logo}
        isLogoLoaded={imagesLoaded[IMAGES.logo]}
      />

      {/* Hero Section */}
      <div className="relative h-[50vh] sm:h-[70vh] flex items-center justify-center">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(${IMAGES.hero})`,
            filter: 'blur(3px)'
          }}
        />
        <div 
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.4) 50%, #000000 100%)'
          }}
        />
        <div className="relative z-10 text-center flex flex-col items-center justify-center space-y-4 sm:space-y-6 px-2 sm:px-0">
          <ChromaticText 
            text="$THE LAST DAY" 
            className="text-4xl sm:text-7xl md:text-8xl whitespace-nowrap" 
          />
          <div className="flex flex-col items-center space-y-2">
            <p className="text-xs sm:text-base font-mono">Contract Address:</p>
            <a 
              href={`https://basescan.org/address/${CONTRACT_ADDRESS}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] sm:text-sm font-mono bg-black/50 px-2 sm:px-3 py-1.5 sm:py-2 rounded-full hover:bg-black/70 transition-colors"
            >
              {CONTRACT_ADDRESS}
            </a>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="relative">
        <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black to-transparent" />
        <div className="relative z-10 w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-5xl mx-auto"
          >
            <h2 className="text-lg sm:text-3xl font-bold text-center mb-3 sm:mb-6">
              How It Works
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4">
              {STEPS.map((step, index) => (
                <HowItWorksStep
                  key={index}
                  icon={step.icon}
                  title={step.title}
                  description={step.description}
                  index={index}
                />
              ))}
            </div>
          </motion.div>
        </div>
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black to-transparent" />
      </div>

      {/* Main Content */}
      <div className="relative w-full px-2 sm:px-6 lg:px-8 py-4 sm:py-16">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-8 mb-2 sm:mb-8">
          {artworks.slice(0, 4).map((artwork, index) => (
            <ArtworkCard
              key={artwork.id}
              artwork={artwork}
              index={index}
              onClick={() => setSelectedArtwork(artwork.id)}
              onVote={() => handleVote(artwork.id)}
              canVote={canVote(artwork.id)}
              isLoaded={imagesLoaded[artwork.image]}
              dimensions={imageDimensions[artwork.image]}
              voteCount={getVoteCount(artwork.id)}
            />
          ))}
        </div>
        <div className="grid grid-cols-3 gap-2 sm:gap-8">
          {artworks.slice(4).map((artwork, index) => (
            <ArtworkCard
              key={artwork.id}
              artwork={artwork}
              index={index + 4}
              onClick={() => setSelectedArtwork(artwork.id)}
              onVote={() => handleVote(artwork.id)}
              canVote={canVote(artwork.id)}
              isLoaded={imagesLoaded[artwork.image]}
              dimensions={imageDimensions[artwork.image]}
              voteCount={getVoteCount(artwork.id)}
            />
          ))}
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {selectedArtwork && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
              onClick={() => setSelectedArtwork(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", damping: 25, stiffness: 400 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-8"
            >
              <div 
                ref={modalRef}
                className="bg-black/90 border border-white/10 rounded-xl sm:rounded-2xl w-full max-w-4xl overflow-hidden relative"
              >
                <motion.button
                  onClick={() => setSelectedArtwork(null)}
                  className="absolute top-2 right-2 sm:top-4 sm:right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors z-10"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X className="w-4 h-4 sm:w-6 sm:h-6" />
                </motion.button>
                <div className="relative">
                  {imagesLoaded[artworks[selectedArtwork - 1].image] ? (
                    <div className="flex items-center justify-center">
                      <motion.img
                        src={artworks[selectedArtwork - 1].image}
                        alt={artworks[selectedArtwork - 1].title}
                        className="w-auto h-auto max-w-full max-h-[70vh] object-contain"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                  ) : (
                    <div className="w-full aspect-square bg-white/10 animate-pulse" />
                  )}
                  <div className="p-3 sm:p-8">
                    <h2 className="text-xl sm:text-3xl font-bold mb-3 sm:mb-4">{artworks[selectedArtwork - 1].title}</h2>
                    <motion.button
                      onClick={() => handleVote(selectedArtwork)}
                      className={clsx(
                        "w-full px-3 sm:px-6 py-2 sm:py-3 rounded-full text-sm sm:text-base flex items-center justify-center gap-2",
                        canVote(selectedArtwork)
                          ? "bg-gradient-to-r from-red-500 to-blue-500 hover:from-red-600 hover:to-blue-600"
                          : "bg-gray-600 cursor-not-allowed"
                      )}
                      disabled={!canVote(selectedArtwork)}
                      whileHover={canVote(selectedArtwork) ? { scale: 1.02 } : {}}
                      whileTap={canVote(selectedArtwork) ? { scale: 0.98 } : {}}
                    >
                      {!account ? (
                        "Connect wallet to vote"
                      ) : Number(balance) === 0 ? (
                        "You need $THE LAST DAY to vote"
                      ) : !canVote(selectedArtwork) ? (
                        <>
                          <AlertCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          <span>Already voted this week</span>
                        </>
                      ) : (
                        `Vote (${getVoteCount(selectedArtwork)})`
                      )}
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;