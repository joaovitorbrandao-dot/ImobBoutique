import { ReactNode } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  maxWidth?: string;
}

export default function Modal({ isOpen, onClose, title, children, maxWidth = 'max-w-lg' }: ModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className={`bg-white rounded-2xl shadow-xl w-full ${maxWidth} p-6 space-y-4 max-h-[90vh] overflow-y-auto`}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-slate-800 tracking-wide">{title}</h3>
              <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg cursor-pointer" type="button">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
