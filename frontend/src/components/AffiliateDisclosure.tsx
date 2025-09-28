'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface AffiliateDisclosureProps {
  className?: string;
  position?: 'top' | 'bottom';
  showOnPages?: string[]; // Array of page paths where disclosure should show
}

export default function AffiliateDisclosure({ 
  className = '',
  position = 'bottom',
  showOnPages = ['/'] // Default to homepage
}: AffiliateDisclosureProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [currentPath, setCurrentPath] = useState('');

  useEffect(() => {
    // Get current path
    setCurrentPath(window.location.pathname);
    
    // Check if we should show disclosure on this page
    const shouldShow = showOnPages.some(page => 
      currentPath.startsWith(page) || currentPath === page
    );

    // Check if user has already acknowledged
    const hasAcknowledged = localStorage.getItem('affiliate-disclosure-acknowledged');
    
    if (shouldShow && !hasAcknowledged) {
      setIsVisible(true);
    }
  }, [currentPath, showOnPages]);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('affiliate-disclosure-acknowledged', 'true');
  };

  if (!isVisible) return null;

  const positionClasses = position === 'top' 
    ? 'top-0' 
    : 'bottom-0';

  return (
    <div className={`
      fixed left-0 right-0 z-50 ${positionClasses}
      bg-blue-50 border-t border-blue-200 shadow-lg
      ${className}
    `}>
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-start gap-3">
              <div className="text-blue-600 mt-0.5">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="text-sm text-blue-900">
                <span className="font-medium">Affiliate Disclosure:</span>{' '}
                Spontra may earn commission from flight bookings made through our partner links. 
                This helps us provide our service free of charge. Prices remain the same for you.{' '}
                <a 
                  href="/privacy-policy" 
                  className="underline hover:no-underline font-medium"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Learn more
                </a>
              </div>
            </div>
          </div>
          
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded"
            aria-label="Dismiss affiliate disclosure"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// Compact version for use in search results or flight cards
export function CompactAffiliateNotice({ className = '' }: { className?: string }) {
  return (
    <div className={`text-xs text-gray-500 ${className}`}>
      <span className="inline-flex items-center gap-1">
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
        Ad · Sponsored Link
      </span>
    </div>
  );
}

// Hook for checking consent status
export function useAffiliateConsent() {
  const [hasConsent, setHasConsent] = useState(false);
  
  useEffect(() => {
    const acknowledged = localStorage.getItem('affiliate-disclosure-acknowledged');
    setHasConsent(!!acknowledged);
  }, []);

  const giveConsent = () => {
    localStorage.setItem('affiliate-disclosure-acknowledged', 'true');
    setHasConsent(true);
  };

  const revokeConsent = () => {
    localStorage.removeItem('affiliate-disclosure-acknowledged');
    setHasConsent(false);
  };

  return { hasConsent, giveConsent, revokeConsent };
}