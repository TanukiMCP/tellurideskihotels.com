/**
 * Test data and utilities for E2E tests
 */

export const TEST_GUEST_INFO = {
  firstName: 'John',
  lastName: 'Doe',
  email: 'test@tellurideskihotels.com',
  phone: '+1 (555) 123-4567',
  specialRequests: 'Early check-in if possible',
};

export const STRIPE_TEST_CARDS = {
  success: '4242424242424242',
  decline: '4000000000009995',
  requiresAuth: '4000002500003155',
};

/**
 * Get test dates (tomorrow and 3 days from tomorrow)
 */
export function getTestDates() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const checkOut = new Date(tomorrow);
  checkOut.setDate(checkOut.getDate() + 3);
  
  return {
    checkIn: tomorrow.toISOString().split('T')[0],
    checkOut: checkOut.toISOString().split('T')[0],
  };
}

/**
 * Format date for display (e.g., "Nov 8, 2025")
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Calculate number of nights between two dates
 */
export function calculateNights(checkIn: string, checkOut: string): number {
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

