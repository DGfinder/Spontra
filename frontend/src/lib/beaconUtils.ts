/**
 * Beacon Utility Functions
 * Utilities for generating tracking URLs and beacon scripts
 */

/**
 * Generate beacon tracking URL for embedding in redirects
 */
export function generateBeaconUrl(params: {
  clickId: string;
  providerId: string;
  market?: string;
  baseUrl?: string;
}): string {
  const base = params.baseUrl || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const url = new URL('/api/beacon/landed', base);
  
  url.searchParams.set('clickId', params.clickId);
  url.searchParams.set('providerId', params.providerId);
  if (params.market) {
    url.searchParams.set('market', params.market);
  }
  
  return url.toString();
}

/**
 * JavaScript beacon code for embedding in provider pages (if possible)
 */
export function generateBeaconScript(params: {
  providerId: string;
  beaconUrl?: string;
}): string {
  const beaconUrl = params.beaconUrl || '/api/beacon/landed';
  
  return `
<!-- Spontra Landing Beacon -->
<script>
(function() {
  var params = new URLSearchParams(window.location.search);
  var clickId = params.get('spontra_click') || params.get('click_id');
  var providerId = '${params.providerId}';
  
  if (clickId) {
    var beacon = new Image();
    beacon.src = '${beaconUrl}?clickId=' + clickId + '&providerId=' + providerId + 
                 '&finalUrl=' + encodeURIComponent(window.location.href) +
                 '&responseTime=' + (Date.now() - performance.navigationStart);
                 
    // Enhanced performance data (optional)
    setTimeout(function() {
      var perf = performance.getEntriesByType('navigation')[0];
      if (perf && navigator.sendBeacon) {
        navigator.sendBeacon('${beaconUrl}', JSON.stringify({
          clickId: clickId,
          providerId: providerId,
          performance: {
            loadTime: perf.loadEventEnd - perf.loadEventStart,
            domReady: perf.domContentLoadedEventEnd - perf.navigationStart,
            ttfb: perf.responseStart - perf.requestStart
          },
          viewport: {
            width: window.innerWidth,
            height: window.innerHeight
          },
          connection: navigator.connection ? {
            effectiveType: navigator.connection.effectiveType,
            downlink: navigator.connection.downlink
          } : null
        }));
      }
    }, 1000);
  }
})();
</script>
`.trim();
}

/**
 * Generate minimal beacon pixel URL (for email/image-based tracking)
 */
export function generatePixelUrl(params: {
  clickId: string;
  providerId: string;
  source?: string;
  baseUrl?: string;
}): string {
  const base = params.baseUrl || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const url = new URL('/api/beacon/landed', base);
  
  url.searchParams.set('clickId', params.clickId);
  url.searchParams.set('providerId', params.providerId);
  if (params.source) {
    url.searchParams.set('source', params.source);
  }
  
  return url.toString();
}

/**
 * Validate beacon parameters
 */
export function validateBeaconParams(params: {
  clickId?: string | null;
  providerId?: string | null;
}): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!params.clickId) {
    errors.push('clickId is required');
  }
  
  if (!params.providerId) {
    errors.push('providerId is required');
  }
  
  if (params.clickId && typeof params.clickId !== 'string') {
    errors.push('clickId must be a string');
  }
  
  if (params.providerId && typeof params.providerId !== 'string') {
    errors.push('providerId must be a string');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}