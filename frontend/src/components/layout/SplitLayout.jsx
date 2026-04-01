import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export const SplitLayout = ({ leftPanel, rightPanel, showRightPanel }) => {
  return (
    <div className="flex flex-col lg:flex-row gap-6 w-full h-[calc(100vh-140px)]">
      {/* Left Panel (Always visible, expands if right is hidden) */}
      <motion.div 
        layout
        className="flex flex-col flex-1 min-w-0"
        transition={{ type: "spring", bounce: 0, duration: 0.5 }}
      >
        {leftPanel}
      </motion.div>

      {/* Right Panel (Dashboard) */}
      <AnimatePresence>
        {showRightPanel && (
          <motion.div
            initial={{ opacity: 0, maxWidth: 0 }}
            animate={{ opacity: 1, maxWidth: "450px", width: "100%" }}
            exit={{ opacity: 0, maxWidth: 0 }}
            transition={{ type: "spring", bounce: 0, duration: 0.5 }}
            className="hidden lg:flex flex-col h-full overflow-hidden"
          >
            <div className="w-full h-full overflow-y-auto pr-2 pb-4">
              {rightPanel}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
