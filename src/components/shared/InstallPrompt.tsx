'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, Download, Share } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIOSPrompt, setShowIOSPrompt] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if already dismissed this session
    if (sessionStorage.getItem('install-dismissed')) {
      setDismissed(true);
      return;
    }

    // Check if already installed (standalone mode)
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return;
    }

    // Android/Chrome: intercept the beforeinstallprompt event
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);

    // iOS detection
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isInStandalone = window.matchMedia('(display-mode: standalone)').matches;
    if (isIOS && !isInStandalone) {
      setShowIOSPrompt(true);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  async function handleInstall() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  }

  function handleDismiss() {
    setDismissed(true);
    setDeferredPrompt(null);
    setShowIOSPrompt(false);
    sessionStorage.setItem('install-dismissed', 'true');
  }

  if (dismissed) return null;

  // Android install prompt
  if (deferredPrompt) {
    return (
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4">
        <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-600 text-white text-xl font-bold">
                M
              </div>
              <div>
                <h3 className="font-semibold text-lg text-gray-900">Install Masjid Manager</h3>
                <p className="text-sm text-gray-500">Add to your home screen</p>
              </div>
            </div>
            <button onClick={handleDismiss} className="text-gray-400 hover:text-gray-600">
              <X className="h-5 w-5" />
            </button>
          </div>
          <p className="text-sm text-gray-600">
            Install this app for quick access — no app store needed. Works offline too!
          </p>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={handleDismiss}>
              Not Now
            </Button>
            <Button className="flex-1 bg-green-600 hover:bg-green-700" onClick={handleInstall}>
              <Download className="mr-2 h-4 w-4" />
              Install
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // iOS install instructions
  if (showIOSPrompt) {
    return (
      <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4">
        <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl space-y-4 mb-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-600 text-white text-xl font-bold">
                M
              </div>
              <div>
                <h3 className="font-semibold text-lg text-gray-900">Install Masjid Manager</h3>
                <p className="text-sm text-gray-500">Add to your home screen</p>
              </div>
            </div>
            <button onClick={handleDismiss} className="text-gray-400 hover:text-gray-600">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="space-y-3 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-xs font-bold">1</span>
              <span>Tap the <Share className="inline h-4 w-4 text-blue-500" /> Share button below</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-xs font-bold">2</span>
              <span>Scroll down and tap <strong>&quot;Add to Home Screen&quot;</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-xs font-bold">3</span>
              <span>Tap <strong>&quot;Add&quot;</strong></span>
            </div>
          </div>
          <Button variant="outline" className="w-full" onClick={handleDismiss}>
            Got it
          </Button>
        </div>
      </div>
    );
  }

  return null;
}
