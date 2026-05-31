import React, { useState } from 'react';

// Fill these in after creating products in Dodo Payments (dodopayments.com).
// Dashboard → Products → Share link, set success_url to:
//   https://YOUR_WORKER.workers.dev/success?payment_id={payment_id}
const PAYMENT_LINKS = {
  monthly:  'https://checkout.dodopayments.com/buy/YOUR_MONTHLY_LINK',
  annual:   'https://checkout.dodopayments.com/buy/YOUR_ANNUAL_LINK',
  lifetime: 'https://checkout.dodopayments.com/buy/YOUR_LIFETIME_LINK',
};

const PLANS = [
  {
    id: 'monthly',
    label: 'Monthly',
    price: '$3.99',
    was: '$5.99',
    sub: 'per month · launch price',
    badge: null,
  },
  {
    id: 'annual',
    label: 'Annual',
    price: '$24',
    was: '$35',
    sub: 'per year  ·  $2/mo',
    badge: '🚀 LAUNCH WEEK · BEST VALUE',
  },
  {
    id: 'lifetime',
    label: 'Lifetime',
    price: '$39',
    was: '$59',
    sub: 'one-time, forever',
    badge: null,
  },
];

const FEATURES = [
  'Speed up to 1200 WPM',
  '2 & 3-word chunk mode',
  'PDF reader',
  'All fonts incl. Dyslexic',
  'Session resume',
  'Priority support',
];

export function UpgradeModal({ onClose, lockedWpm }) {
  const [selected, setSelected] = useState('annual');

  const handleUpgrade = () => {
    const link = PAYMENT_LINKS[selected];
    if (link.includes('YOUR_')) {
      alert('Payment links not configured yet — replace YOUR_*_LINK in UpgradeModal.jsx with your Dodo checkout URLs.');
      return;
    }
    window.open(link, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm pointer-events-auto">
      <div
        className="relative w-[420px] overflow-hidden rounded-2xl shadow-2xl"
        style={{ background: '#111', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-600 hover:text-white transition z-10"
        >
          ✕
        </button>

        {/* Header */}
        <div className="px-8 pt-8 pb-5 text-center">
          <div
            className="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center text-xl"
            style={{ background: 'linear-gradient(135deg, #FF3B30, #ff6b35)' }}
          >
            ⚡
          </div>

          {lockedWpm ? (
            <>
              <h2 className="text-xl font-bold text-white mb-1">
                You hit <span style={{ color: '#FF3B30' }}>{lockedWpm} WPM</span>
              </h2>
              <p className="text-sm text-gray-500">
                Your trial ended. Upgrade to keep reading at full speed.
              </p>
            </>
          ) : (
            <>
              <h2 className="text-xl font-bold text-white mb-1">
                Unlock <span style={{ color: '#FF3B30' }}>Red Point Pro</span>
              </h2>
              <p className="text-sm text-gray-500">
                Remove the 400 WPM cap and unlock every feature.
              </p>
            </>
          )}
        </div>

        {/* Plan selector */}
        <div className="px-6 space-y-2 mb-5">
          {PLANS.map(plan => (
            <button
              key={plan.id}
              onClick={() => setSelected(plan.id)}
              className="w-full text-left rounded-xl px-4 py-3 transition-all relative"
              style={{
                background: selected === plan.id ? 'rgba(255,59,48,0.12)' : '#1a1a1a',
                border: selected === plan.id ? '1px solid #FF3B30' : '1px solid #2a2a2a',
              }}
            >
              {plan.badge && (
                <span
                  className="absolute -top-2.5 left-4 text-[9px] font-bold px-2 py-0.5 rounded-full tracking-widest"
                  style={{ background: '#FF3B30', color: '#fff' }}
                >
                  {plan.badge}
                </span>
              )}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                    style={{ borderColor: selected === plan.id ? '#FF3B30' : '#444' }}
                  >
                    {selected === plan.id && (
                      <div className="w-2 h-2 rounded-full" style={{ background: '#FF3B30' }} />
                    )}
                  </div>
                  <span className="text-sm font-medium text-white">{plan.label}</span>
                </div>
                <div className="text-right">
                  {plan.was && <span className="text-gray-600 text-xs line-through mr-1">{plan.was}</span>}
                  <span className="text-white font-bold">{plan.price}</span>
                  <span className="text-gray-600 text-xs ml-1">{plan.sub}</span>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Features */}
        <div className="px-6 mb-6">
          <div className="grid grid-cols-2 gap-1.5">
            {FEATURES.map(f => (
              <div key={f} className="flex items-center gap-2 text-xs text-gray-400">
                <span style={{ color: '#FF3B30' }}>✓</span> {f}
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="px-6 pb-6">
          <button
            onClick={handleUpgrade}
            className="w-full py-3 rounded-xl font-bold text-sm uppercase tracking-widest transition-all"
            style={{ background: '#FF3B30', color: '#fff' }}
            onMouseEnter={e => e.currentTarget.style.background = '#e0322a'}
            onMouseLeave={e => e.currentTarget.style.background = '#FF3B30'}
          >
            Upgrade to Pro →
          </button>
          <p className="text-center text-xs text-gray-700 mt-2">
            Cancel anytime · No account needed · Instant access
          </p>
        </div>
      </div>
    </div>
  );
}
