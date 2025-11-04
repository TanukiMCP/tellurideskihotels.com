import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { loadStripe } from '@/lib/stripe';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

export interface CheckoutPaymentProps {
  amount: number;
  currency: string;
  onComplete: (paymentIntentId: string) => void;
}

function PaymentForm({ amount, currency, onComplete }: CheckoutPaymentProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  useEffect(() => {
    async function createPaymentIntent() {
      try {
        const response = await fetch('/api/checkout/create-payment-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount, currency }),
        });

        if (!response.ok) {
          throw new Error('Failed to create payment intent');
        }

        const data = await response.json();
        setClientSecret(data.clientSecret);
      } catch (error) {
        console.error('Error creating payment intent:', error);
        alert('Failed to initialize payment. Please try again.');
      }
    }

    createPaymentIntent();
  }, [amount, currency]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements || !clientSecret) {
      return;
    }

    setLoading(true);

    try {
      const { error: submitError } = await elements.submit();
      if (submitError) {
        throw submitError;
      }

      const returnUrl = typeof window !== 'undefined' 
        ? `${window.location.origin}/booking/confirmation`
        : '/booking/confirmation';

      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        clientSecret,
        confirmParams: {
          return_url: returnUrl,
        },
        redirect: 'if_required',
      });

      if (error) {
        throw error;
      }

      if (paymentIntent && paymentIntent.status === 'succeeded') {
        onComplete(paymentIntent.id);
      }
    } catch (err: any) {
      alert(err.message || 'Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!clientSecret) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-gray-600">Loading payment form...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <PaymentElement />
          <Button type="submit" className="w-full" size="lg" isLoading={loading} disabled={!stripe}>
            Pay {new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount)}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export function CheckoutPayment(props: CheckoutPaymentProps) {
  const [stripePromise, setStripePromise] = useState<any>(null);

  useEffect(() => {
    loadStripe().then(setStripePromise);
  }, []);

  if (!stripePromise) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-gray-600">Loading payment system...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Elements stripe={stripePromise}>
      <PaymentForm {...props} />
    </Elements>
  );
}

