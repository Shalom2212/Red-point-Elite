import React from 'react';

export function UpgradeModal({ onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm pointer-events-auto">
      <div className="bg-[#151515] border border-white/10 rounded-2xl w-[400px] overflow-hidden shadow-2xl relative">
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-gray-500 hover:text-white transition"
        >
          ✕
        </button>
        
        <div className="p-8 text-center flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-pivot-red to-orange-500 flex items-center justify-center mb-6">
            <span className="text-2xl">⚡</span>
          </div>
          
          <h2 className="text-2xl font-bold tracking-widest uppercase mb-2">Red Point <span className="text-pivot-red">Elite</span></h2>
          <p className="text-gray-400 text-sm mb-6">
            You've hit the 400 WPM speed limit. Evolve your reading speed up to 1200+ WPM with an Elite subscription.
          </p>
          
          <ul className="text-left w-full space-y-3 mb-8">
            <li className="flex items-center text-sm"><span className="text-pivot-red mr-3">✓</span> Unlimited Speed (Up to 1200 WPM)</li>
            <li className="flex items-center text-sm"><span className="text-pivot-red mr-3">✓</span> 1-Click Page Ingestion</li>
            <li className="flex items-center text-sm"><span className="text-pivot-red mr-3">✓</span> Custom Core Engine Analytics</li>
            <li className="flex items-center text-sm"><span className="text-pivot-red mr-3">✓</span> Pro Themes & Dyslexic Fonts</li>
          </ul>

          <button className="w-full bg-white text-black py-3 rounded uppercase tracking-widest font-bold hover:bg-gray-200 transition mb-3">
            Subscribe with Stripe ($4.99/mo)
          </button>
          
          <p className="text-xs text-gray-600">Cancel anytime. 7-day free trial.</p>
        </div>
      </div>
    </div>
  );
}
