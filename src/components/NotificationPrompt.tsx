import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

declare global {
  interface Window {
    pushalertbyiw?: any[];
    PushAlertCo?: any;
  }
}

export function NotificationPrompt() {
  const { user } = useAuth();
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    if (!user) {
      setShowPrompt(false);
      return;
    }

    const storageKey = `campus_guide_notif_prompt_${user.id}`;
    const alreadyPrompted = localStorage.getItem(storageKey);

    // Register user_id attribute with PushAlert when user is logged in
    window.pushalertbyiw = window.pushalertbyiw || [];
    window.pushalertbyiw.push(['addAttributes', { user_id: user.id }]);

    // If never prompted before, show one-time prompt modal
    if (!alreadyPrompted) {
      // Delay slightly for smooth page transition
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [user]);

  const handleAllow = () => {
    if (!user) return;
    const storageKey = `campus_guide_notif_prompt_${user.id}`;
    localStorage.setItem(storageKey, 'true');
    setShowPrompt(false);

    try {
      window.pushalertbyiw = window.pushalertbyiw || [];
      window.pushalertbyiw.push(['forceSubscribe']);
      window.pushalertbyiw.push(['addAttributes', { user_id: user.id }]);
    } catch (e) {
      console.warn('Error triggering PushAlert subscription:', e);
    }
  };

  const handleDismiss = () => {
    if (!user) return;
    const storageKey = `campus_guide_notif_prompt_${user.id}`;
    localStorage.setItem(storageKey, 'true');
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white p-6 shadow-2xl border border-gray-100 transform transition-all">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-[#2F4EA2]">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Never Miss an Update</h3>
            <p className="text-xs text-gray-500">Campus Guide Push Alerts</p>
          </div>
        </div>

        <p className="text-sm text-gray-600 mb-6 leading-relaxed">
          Enable notifications to get instant alerts on your phone whenever new events are announced, hostel accommodation spaces open up, or your questions are answered.
        </p>

        <div className="flex flex-col sm:flex-row gap-2.5">
          <button
            type="button"
            onClick={handleAllow}
            className="w-full py-2.5 px-4 rounded-xl bg-[#2F4EA2] hover:bg-[#253e82] text-white text-sm font-semibold shadow-sm transition-colors cursor-pointer text-center"
          >
            Allow Notifications
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            className="w-full py-2.5 px-4 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-600 text-sm font-medium transition-colors cursor-pointer text-center"
          >
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  );
}
