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

      // Determine environment - check secretKey format first (most reliable)
      // Sandbox secretKeys start with 'pi_test_' according to docs
      // Also check if we're on a development/staging domain
      const isSandboxSecretKey = secretKey.startsWith('pi_test_');
      const isDevDomain = typeof window !== 'undefined' && 
        (window.location.hostname.includes('localhost') || 
         window.location.hostname.includes('netlify.app'));
      
      // Use sandbox if secretKey indicates sandbox OR we're on dev domain
      // Default to sandbox for safety (user is using sandbox API key based on logs)
      const publicKey = isSandboxSecretKey || isDevDomain ? 'sandbox' : 'live';
      
      console.log('[LiteAPI Payment] Initializing payment portal:', {
        publicKey,
        isSandboxSecretKey,
        isDevDomain,
        hasSecretKey: !!secretKey,
        secretKeyPreview: secretKey ? secretKey.substring(0, 20) + '...' : null,
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
    
    if (returnFromPayment && tid && pid) {
      console.log('[LiteAPI Payment] Payment success detected from redirect:', { tid, pid, transactionId });
      // Verify the transactionId matches
      if (tid === transactionId) {
        console.log('[LiteAPI Payment] Transaction IDs match, calling onPaymentSuccess');
        onPaymentSuccess(transactionId);
      } else {
        console.warn('[LiteAPI Payment] Transaction ID mismatch:', { expected: transactionId, received: tid });
      }
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
        <CardTitle className="text-2xl">Payment</CardTitle>
        <p className="text-sm text-neutral-600 mt-2">
          Secure payment powered by liteAPI. Your card details are encrypted and never stored on our servers.
        </p>
      </CardHeader>
      <CardContent className="pt-8">
        {amount && amount > 0 ? (
          <div className="mb-6 p-5 bg-primary-50 border-2 border-primary-200 rounded-xl">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-primary-900">Amount Due</span>
              <span className="text-2xl font-bold text-primary-700">
                {new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount)}
              </span>
            </div>
          </div>
        ) : (
          <div className="mb-6 p-5 bg-amber-50 border-2 border-amber-200 rounded-xl">
            <div className="flex items-center gap-2 text-amber-900">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-semibold">Loading payment amount...</span>
            </div>
          </div>
        )}
        
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-xl">
            <p className="text-sm text-red-800 font-medium">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-2 text-sm text-red-600 hover:text-red-700 underline"
            >
              Refresh page
            </button>
          </div>
        )}
        
        {/* This div will be replaced by liteAPI payment portal */}
        <div id="liteapi-payment-portal" className="min-h-[400px] w-full">
          {!paymentInitialized && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-3 border-primary-600 mb-4"></div>
              <p className="text-neutral-600">Initializing secure payment portal...</p>
            </div>
          )}
        </div>

        <div className="mt-8 pt-6 border-t border-neutral-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div className="flex flex-col items-center p-3 bg-neutral-50 rounded-lg">
              <svg className="w-6 h-6 text-primary-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <p className="text-xs font-semibold text-neutral-900">Secure Payment</p>
              <p className="text-xs text-neutral-600">256-bit encryption</p>
            </div>
            <div className="flex flex-col items-center p-3 bg-neutral-50 rounded-lg">
              <svg className="w-6 h-6 text-primary-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              <p className="text-xs font-semibold text-neutral-900">Multiple Options</p>
              <p className="text-xs text-neutral-600">Cards & digital wallets</p>
            </div>
            <div className="flex flex-col items-center p-3 bg-neutral-50 rounded-lg">
              <svg className="w-6 h-6 text-primary-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-xs font-semibold text-neutral-900">No Extra Fees</p>
              <p className="text-xs text-neutral-600">What you see is what you pay</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

