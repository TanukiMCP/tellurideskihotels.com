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
  const [confirmedDetails, setConfirmedDetails] = useState(false);

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
      
      // Determine public key based on environment variable or fallback
      const configuredMode = import.meta.env.PUBLIC_PAYMENT_MODE;
      let publicKey = configuredMode === 'production' ? 'live' : 'sandbox';
      
      // If explicit mode not set, infer from secret key format
      if (!configuredMode) {
        if (secretKey.startsWith('pi_test_')) {
            publicKey = 'sandbox';
        } else if (secretKey.startsWith('pi_live_')) {
            publicKey = 'live';
        } else {
            // Fallback to existing logic
            publicKey = isProductionDomain && !isSandboxSecretKey ? 'live' : 'sandbox';
        }
      }
      
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
  // This useEffect should run immediately on component mount
  useEffect(() => {
    console.log('[LiteAPI Payment] Checking for payment redirect on mount');
    const urlParams = new URLSearchParams(window.location.search);
    const tid = urlParams.get('tid');
    const pid = urlParams.get('pid');
    const returnFromPayment = urlParams.get('returnFromPayment');
    
    console.log('[LiteAPI Payment] URL params:', { 
      tid, 
      pid, 
      returnFromPayment,
      fullUrl: window.location.href,
      hasTransactionId: !!transactionId,
      transactionId
    });
    
    // LiteAPI redirects back with tid and pid params
    // Check for payment redirect - if we have tid and pid, payment was successful
    if (tid && pid) {
      console.log('[LiteAPI Payment] ✓ Payment redirect detected! Processing...', { 
        tid, 
        pid, 
        returnFromPayment,
        currentTransactionId: transactionId,
        willCallOnPaymentSuccess: true
      });
      
      // Small delay to ensure component is fully mounted
      setTimeout(() => {
        // Call onPaymentSuccess with the tid from the URL
        // This is the actual transaction ID from LiteAPI
        console.log('[LiteAPI Payment] Calling onPaymentSuccess with tid:', tid);
        try {
          onPaymentSuccess(tid);
        } catch (error) {
          console.error('[LiteAPI Payment] ❌ Error calling onPaymentSuccess:', error);
        }
      }, 100);
    } else if (tid || pid) {
      console.warn('[LiteAPI Payment] ⚠️ Incomplete payment redirect params:', { 
        tid, 
        pid, 
        returnFromPayment,
        message: 'Missing required parameters for payment confirmation'
      });
    } else {
      console.log('[LiteAPI Payment] No payment redirect detected, showing payment form');
    }
  }, []); // Run only once on mount

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

  const formattedAmount = amount && amount > 0 
    ? new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount)
    : null;

  return (
    <Card className="shadow-lg border-neutral-200">
      <CardHeader className="border-b border-neutral-100 bg-white pb-6">
        <CardTitle className="text-2xl font-bold text-[#2C2C2C]">Complete Your Payment</CardTitle>
        <p className="text-base text-[#666] mt-2">
          Your reservation is almost confirmed
        </p>
      </CardHeader>
      <CardContent className="pt-8">
        {/* Security Messaging - Prominent at Top */}
        <div className="mb-8 p-4 bg-[#F8F9F8] border border-[#E5E8E5] rounded-lg">
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-[#2D5F4F]">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span className="font-medium">256-bit SSL Encryption</span>
            </div>
            <span className="text-[#999]">•</span>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span className="font-medium">PCI Compliant</span>
            </div>
            <span className="text-[#999]">•</span>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-medium">Secure Payment Processing</span>
            </div>
          </div>
          <p className="text-xs text-[#666] text-center mt-3">
            Your payment information is encrypted and secure
          </p>
        </div>

        {/* Accepted Payment Methods */}
        <div className="mb-6">
          <p className="text-xs text-[#666] mb-3">We accept</p>
          <div className="flex items-center gap-3">
            <div className="w-12 h-8 bg-white border border-[#E5E5E5] rounded flex items-center justify-center">
              <span className="text-xs font-bold text-[#1A1F71]">VISA</span>
            </div>
            <div className="w-12 h-8 bg-white border border-[#E5E5E5] rounded flex items-center justify-center">
              <span className="text-xs font-bold text-[#EB001B]">MC</span>
            </div>
            <div className="w-12 h-8 bg-white border border-[#E5E5E5] rounded flex items-center justify-center">
              <span className="text-xs font-bold text-[#006FCF]">AMEX</span>
            </div>
            <div className="w-12 h-8 bg-white border border-[#E5E5E5] rounded flex items-center justify-center">
              <span className="text-xs font-bold text-[#FF6000]">DISC</span>
            </div>
          </div>
        </div>

        {/* Total Amount Display - Redesigned */}
        {formattedAmount ? (
          <div className="mb-8 p-5 bg-[#F8F9F8] border border-[#E5E8E5] rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#666] mb-1">Total Amount</p>
                <div className="flex items-center gap-2">
                  <p className="text-3xl font-bold text-[#2D5F4F]">
                    {formattedAmount}
                  </p>
                  <svg className="w-6 h-6 text-[#2D5F4F]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <p className="text-xs text-[#666] italic mt-2">All taxes and fees included</p>
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
        <div className="mb-6">
          <h3 className="text-base font-semibold text-[#2C2C2C] mb-4">Select Payment Method</h3>
        </div>
        
        {/* This div will be replaced by liteAPI payment portal */}
        <div id="liteapi-payment-portal" className="min-h-[400px] w-full">
          {!paymentInitialized && (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="animate-spin rounded-full h-14 w-14 border-b-4 border-[#2D5F4F] mb-6"></div>
              <p className="text-[#2C2C2C] font-medium text-lg">Loading payment options...</p>
              <p className="text-[#666] text-sm mt-2">This should only take a moment</p>
            </div>
          )}
        </div>

        {/* Final Confirmation Checkbox */}
        <div className="mt-8 flex items-start gap-3 p-4 bg-white border border-[#E5E5E5] rounded-lg">
          <input
            type="checkbox"
            id="confirm-booking"
            checked={confirmedDetails}
            onChange={(e) => setConfirmedDetails(e.target.checked)}
            className="mt-1 h-5 w-5 border-[#D5D5D5] focus:ring-2 focus:ring-[#2D5F4F]/20 transition-all duration-200 cursor-pointer"
            style={{
              accentColor: '#2D5F4F',
              borderRadius: '3px',
            }}
          />
          <label htmlFor="confirm-booking" className="text-sm text-[#2C2C2C] leading-relaxed cursor-pointer flex-1">
            I have reviewed my booking details and agree to the{' '}
            <a 
              href="/cancellation-policy" 
              target="_blank" 
              className="text-[#2D5F4F] hover:text-[#255040] font-medium underline transition-colors"
            >
              cancellation policy
            </a>
            {' '}and{' '}
            <a 
              href="/terms" 
              target="_blank" 
              className="text-[#2D5F4F] hover:text-[#255040] font-medium underline transition-colors"
            >
              terms of service
            </a>
          </label>
        </div>

        {/* Note about confirmation */}
        {!confirmedDetails && paymentInitialized && (
          <p className="text-xs text-[#666] mt-2 text-center">
            Please confirm your booking details to proceed with payment
          </p>
        )}

        {/* What Happens Next Section */}
        <div className="mt-8 p-5 bg-[#F8F6F3] border-l-4 border-[#2D5F4F] rounded-lg">
          <h4 className="text-base font-semibold text-[#2C2C2C] mb-4">What happens next?</h4>
          <ul className="space-y-3 text-sm text-[#666]">
            <li className="flex items-start gap-2">
              <svg className="w-4 h-4 text-[#2D5F4F] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Instant confirmation sent to your email</span>
            </li>
            <li className="flex items-start gap-2">
              <svg className="w-4 h-4 text-[#2D5F4F] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Your card will be charged immediately</span>
            </li>
            <li className="flex items-start gap-2">
              <svg className="w-4 h-4 text-[#2D5F4F] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>View and manage your booking anytime</span>
            </li>
            <li className="flex items-start gap-2">
              <svg className="w-4 h-4 text-[#2D5F4F] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Check-in instructions sent 48 hours before arrival</span>
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

