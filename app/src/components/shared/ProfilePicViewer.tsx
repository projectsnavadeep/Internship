import { motion } from 'framer-motion';
import { X } from 'lucide-react';

interface ProfilePicViewerProps {
  imageUrl: string;
  onClose: () => void;
}

export function ProfilePicViewer({ imageUrl, onClose }: ProfilePicViewerProps) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/90 backdrop-blur-sm cursor-zoom-out"
        onClick={onClose}
      />
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="relative z-10 max-w-3xl w-full aspect-square md:aspect-auto md:h-[80vh] flex items-center justify-center"
      >
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 md:-right-12 md:top-0 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
        >
          <X size={20} />
        </button>
        <img
          src={imageUrl}
          alt="Profile Full Size"
          className="w-full h-full object-contain rounded-2xl shadow-2xl"
        />
      </motion.div>
    </div>
  );
}
