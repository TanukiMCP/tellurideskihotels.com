import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

export interface LiteAPIPaymentProps {
  secretKey: string;
  transactionId: string;
  amount: number;
  currency: string;
  returnUrl: string;
  onPaymentSuccess: (transactionId: string) => void;
}

export function LiteAPIPayment({
  secretKey,
  transactionId,
  amount,
  currency,
  returnUrl,
  onPaymentSuccess,
}: LiteAPIPaymentProps) {
  const [sdkLoaded, setSdkLoaded] = useState(false);
  const [paymentInitialized, setPaymentInitialized] = useState(false);

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

      // Determine environment based on secretKey prefix
      const publicKey = secretKey.startsWith('pi_test_') ? 'sandbox' : 'live';
      
      console.log('[LiteAPI Payment] Initializing payment portal:', {
        publicKey,
        hasSecretKey: !!secretKey,
        hasTransactionId: !!transactionId,
        amount,
        currency,
      });

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
        returnUrl,
      };

      const liteAPIPayment = new LiteAPIPaymentClass(config);
      liteAPIPayment.handlePayment();
      
      setPaymentInitialized(true);
      console.log('[LiteAPI Payment] Payment portal initialized');

      // Listen for payment success events (if SDK provides them)
      // The SDK will redirect to returnUrl on success
    } catch (error) {
      console.error('[LiteAPI Payment] Error initializing payment:', error);
      alert('Failed to initialize payment. Please try again.');
    }
  }, [sdkLoaded, secretKey, transactionId, amount, currency, returnUrl, paymentInitialized]);

  // Check if we're returning from payment (payment completed)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tid = urlParams.get('tid');
    const pid = urlParams.get('pid');
    
    if (tid && pid && tid === transactionId) {
      console.log('[LiteAPI Payment] Payment success detected');
      onPaymentSuccess(transactionId);
    }
  }, [transactionId, onPaymentSuccess]);

  if (!sdkLoaded) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center gap-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
            <p className="text-neutral-600">Loading secure payment portal...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment</CardTitle>
        <p className="text-sm text-neutral-600 mt-2">
          Secure payment powered by liteAPI. Your card details are encrypted and never stored on our servers.
        </p>
      </CardHeader>
      <CardContent>
        <div className="mb-4 p-4 bg-primary-50 border border-primary-200 rounded-lg">
          <p className="text-sm font-semibold text-primary-900">
            Total Amount: {new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount)}
          </p>
        </div>
        
        {/* This div will be replaced by liteAPI payment portal */}
        <div id="liteapi-payment-portal"></div>

        <div className="mt-6 text-xs text-neutral-500 space-y-1">
          <p>🔒 Secure payment processing by liteAPI</p>
          <p>💳 Accepts credit cards, Google Pay, and more</p>
          <p>✓ No additional processing fees</p>
        </div>
      </CardContent>
    </Card>
  );
}

