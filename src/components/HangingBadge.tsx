import React from 'react';

const HangingBadge = () => {
  return (
    /* Positioning container: absolute to top-left of the parent */
    <div className="absolute top-0 left-12 z-20 pointer-events-none select-none group">
      <div className="relative flex flex-col items-center">
        {/* The "Pin" or Nail holding the string */}
        <div className="w-1.5 h-1.5 rounded-full bg-primary/90 border border-primary/20 shadow-sm z-30" />
        
        {/* The Hanging String/Wire */}
        <div className="w-px h-16 bg-gradient-to-b from-primary/80 via-primary/40 to-transparent" />
        
        {/* The Shield Body */}
        <div
          className="relative -mt-0.5 flex flex-col items-center justify-center w-20 h-24 bg-primary shadow-[0_10px_20px_-5px_rgba(0,0,0,0.3)] transition-all duration-500 hover:scale-105"
          style={{
            clipPath: 'polygon(0% 0%, 100% 0%, 100% 85%, 50% 100%, 0% 85%)',
            background: 'linear-gradient(145deg, #DAA520 0%, #8B4513 100%)' // Branded Honey Gradient
          }}
        >
          {/* Inner Border Detail */}
          <div
            className="absolute inset-0.5 border border-white/20"
            style={{ clipPath: 'polygon(0% 0%, 100% 0%, 100% 85%, 50% 100%, 0% 85%)' }}
          />
          
          {/* Content */}
          <div className="flex flex-col items-center gap-1 z-10 px-1 text-center">
            <span className="text-[7px] font-bold text-white/80 leading-none uppercase tracking-widest">
              System by
            </span>
            <h3 className="text-base font-black text-white tracking-widest drop-shadow-lg">
              EPMO
            </h3>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HangingBadge;
