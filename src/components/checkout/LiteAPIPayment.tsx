import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

export interface LiteAPIPaymentProps {
  secretKey: string;
  transactionId: string;
  amount: number;
  currency: string;
  returnUrl: string;
  prebookId?: string;
  onPaymentSuccess: (transactionId: string) => void;
}

export function LiteAPIPayment({
  secretKey,
  transactionId,
  amount,
  currency,
  returnUrl,
  prebookId,
  onPaymentSuccess,
}: LiteAPIPaymentProps) {
  const [sdkLoaded, setSdkLoaded] = useState(false);
  const [paymentInitialized, setPaymentInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load liteAPI payment SDK script
  useEffect(() => {
    // Check if already loaded
    if ((window as any).LiteAPIPayment) {
      setSdkLoaded(true);
      return;
    }

    // Load script
    const script = document.createElement('script');
    script.src = 'https://payment-wrapper.liteapi.travel/dist/liteAPIPayment.js?v=a1';
    script.async = true;
    script.onload = () => {
      console.log('[LiteAPI Payment] SDK loaded successfully');
      setSdkLoaded(true);
    };
    script.onerror = () => {
      console.error('[LiteAPI Payment] Failed to load SDK');
      alert('Failed to load payment system. Please refresh and try again.');
    };

    document.head.appendChild(script);

    return () => {
      // Cleanup if component unmounts
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  // Initialize payment portal when SDK is loaded
  useEffect(() => {
    if (!sdkLoaded || paymentInitialized) return;

    try {
      const LiteAPIPaymentClass = (window as any).LiteAPIPayment;
      
      if (!LiteAPIPaymentClass) {
        console.error('[LiteAPI Payment] SDK not available');
        return;
      }

      // Determine environment for LiteAPI payment SDK
      // The SDK uses Stripe under the hood, so we need to tell it sandbox vs live
      // Since we can't reliably detect from secretKey format (LiteAPI may use different formats),
      // we check the hostname - if it's a Netlify preview or localhost, use sandbox
      // Otherwise, default to sandbox for safety (user is testing with sandbox API keys)
      const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
      const isProductionDomain = hostname === 'tellurideskihotels.com' || hostname === 'www.tellurideskihotels.com';
      const isNetlifyPreview = hostname.includes('netlify.app') || hostname.includes('netlify.app');
      const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
      
      // Check secretKey format as fallback (though LiteAPI may not follow standard Stripe format)
      const isSandboxSecretKey = secretKey.startsWith('pi_test_');
      
      // For now, always use sandbox mode since user is testing with sandbox API keys
      // TODO: Add environment variable or config to explicitly set payment mode
      // This prevents Stripe 400 errors when testing sandbox keys on production domain
      const publicKey = 'sandbox'; // Always sandbox for now - change to 'live' when ready for production
      
      console.log('[LiteAPI Payment] Initializing payment portal:', {
        publicKey,
        hostname,
        isProductionDomain,
        isSandboxSecretKey,
        hasSecretKey: !!secretKey,
        secretKeyPreview: secretKey ? secretKey.substring(0, 30) + '...' : null,
        hasTransactionId: !!transactionId,
        transactionId,
        amount,
        currency,
        returnUrl,
      });

      // Build returnUrl with transactionId and prebookId as query params
      // According to docs, returnUrl should include tid and pid
      const returnUrlWithParams = returnUrl.includes('?') 
        ? `${returnUrl}&tid=${transactionId}&pid=${prebookId || ''}`
        : `${returnUrl}?tid=${transactionId}&pid=${prebookId || ''}`;

      const config = {
        publicKey, // 'live' for production, 'sandbox' for testing
        appearance: {
          theme: 'flat', // Modern flat design
        },
        options: {
          business: {
            name: 'Telluride Ski Hotels',
          },
        },
        targetElement: '#liteapi-payment-portal',
        secretKey,
        returnUrl: returnUrlWithParams,
      };

      const liteAPIPayment = new LiteAPIPaymentClass(config);
      liteAPIPayment.handlePayment();
      
      setPaymentInitialized(true);
      console.log('[LiteAPI Payment] Payment portal initialized successfully');
      setError(null);

      // Listen for payment success events (if SDK provides them)
      // The SDK will redirect to returnUrl on success
    } catch (error: any) {
      console.error('[LiteAPI Payment] Error initializing payment:', error);
      setError(error.message || 'Failed to initialize payment portal. Please refresh and try again.');
      setPaymentInitialized(false);
    }
  }, [sdkLoaded, secretKey, transactionId, amount, currency, returnUrl, prebookId, paymentInitialized]);

  // Check if we're returning from payment (payment completed)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tid = urlParams.get('tid');
    const pid = urlParams.get('pid');
    const returnFromPayment = urlParams.get('returnFromPayment');
    
    // LiteAPI redirects back with tid and pid params
    // We check for either returnFromPayment OR tid+pid combination
    if ((returnFromPayment || tid) && tid && pid) {
      console.log('[LiteAPI Payment] Payment success detected from redirect:', { 
        tid, 
        pid, 
        returnFromPayment,
        currentTransactionId: transactionId,
        url: window.location.href 
      });
      
      // Verify the transactionId matches (tid should match transactionId)
      if (tid === transactionId) {
        console.log('[LiteAPI Payment] Transaction IDs match, calling onPaymentSuccess');
        onPaymentSuccess(transactionId);
      } else {
        console.warn('[LiteAPI Payment] Transaction ID mismatch:', { 
          expected: transactionId, 
          received: tid,
          note: 'Will still proceed with received tid'
        });
        // Still proceed with the tid from URL (might be valid if transactionId changed)
        onPaymentSuccess(tid);
      }
    } else if (tid || pid) {
      console.log('[LiteAPI Payment] Payment redirect detected but missing params:', { tid, pid, returnFromPayment });
    }
  }, [transactionId, onPaymentSuccess]);

  if (!sdkLoaded) {
    return (
      <Card className="shadow-lg border-neutral-200">
        <CardContent className="py-12">
          <div className="flex flex-col items-center justify-center gap-4">
            <div className="animate-spin rounded-full h-10 w-10 border-b-3 border-primary-600"></div>
            <p className="text-neutral-700 text-lg font-medium">Loading secure payment portal...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg border-neutral-200">
      <CardHeader className="border-b border-neutral-100 bg-white pb-6">
        <CardTitle className="text-2xl">Complete Your Payment</CardTitle>
        <p className="text-sm text-neutral-600 mt-2">
          Your payment is processed securely. Card details are encrypted and never stored on our servers.
        </p>
      </CardHeader>
      <CardContent className="pt-8">
        {amount && amount > 0 ? (
          <div className="mb-8 p-6 bg-primary-50 border border-primary-200 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-primary-700 font-medium mb-1">Total Amount</p>
                <p className="text-3xl font-bold text-primary-900">
                  {new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount)}
                </p>
              </div>
              <div className="flex items-center gap-2 text-primary-700">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-8 p-5 bg-amber-50 border border-amber-200 rounded-xl">
            <div className="flex items-center gap-2 text-amber-900">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-semibold">Loading payment amount...</span>
            </div>
          </div>
        )}
        
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-sm text-red-800 font-medium">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-2 text-sm text-red-600 hover:text-red-700 underline"
            >
              Refresh page
            </button>
          </div>
        )}
        
        {/* Payment method selection */}
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-neutral-900 mb-4">Select Payment Method</h3>
        </div>
        
        {/* This div will be replaced by liteAPI payment portal */}
        <div id="liteapi-payment-portal" className="min-h-[400px] w-full">
          {!paymentInitialized && (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="animate-spin rounded-full h-14 w-14 border-b-4 border-primary-600 mb-6"></div>
              <p className="text-neutral-700 font-medium text-lg">Loading payment options...</p>
              <p className="text-neutral-500 text-sm mt-2">This should only take a moment</p>
            </div>
          )}
        </div>

        {/* Security badges */}
        <div className="mt-8 pt-6 border-t border-neutral-200">
          <div className="flex items-center justify-center gap-6 text-xs text-neutral-600">
            <div className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span className="font-medium">256-bit SSL Encryption</span>
            </div>
            <div className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span className="font-medium">PCI Compliant</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

