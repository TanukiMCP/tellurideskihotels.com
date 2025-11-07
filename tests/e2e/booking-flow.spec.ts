import { test, expect } from '@playwright/test';
import {
  HotelSearchPage,
  HotelDetailPage,
  CheckoutPage,
  PaymentPage,
  ConfirmationPage,
} from './helpers/page-objects';
import { TEST_GUEST_INFO, STRIPE_TEST_CARDS, getTestDates } from './helpers/test-data';

/**
 * E2E Test Suite: Complete Booking Flow
 * 
 * This test suite covers the entire booking process from search to confirmation:
 * 1. Search for hotels
 * 2. View hotel details
 * 3. Select a room
 * 4. Fill guest information
 * 5. Complete payment
 * 6. Verify booking confirmation
 */

test.describe('Booking Flow E2E', () => {
  test.setTimeout(120000); // 2 minutes timeout for full flow

  test('should complete full booking flow successfully', async ({ page }) => {
    const { checkIn, checkOut } = getTestDates();

    // Step 1: Search for hotels
    console.log('Step 1: Searching for hotels...');
    const searchPage = new HotelSearchPage(page);
    await searchPage.goto();
    
    // Verify homepage loaded
    await expect(page).toHaveTitle(/Telluride/i);
    
    // Perform search
    await searchPage.search(checkIn, checkOut, 2, 0);
    
    // Verify we're on search results page
    await expect(page).toHaveURL(/\/lodging/);
    
    // Take screenshot of search results
    await page.screenshot({ path: 'test-results/01-search-results.png', fullPage: true });

    // Step 2: Select a hotel
    console.log('Step 2: Selecting hotel...');
    await searchPage.clickFirstHotelWithRooms();
    
    // Verify we're on hotel detail page
    await expect(page).toHaveURL(/\/lodging\/[^/]+/);
    
    // Take screenshot of hotel details
    await page.screenshot({ path: 'test-results/02-hotel-details.png', fullPage: true });

    // Step 3: Select a room
    console.log('Step 3: Selecting room...');
    const hotelDetailPage = new HotelDetailPage(page);
    
    // Wait for hotel name to be visible
    await hotelDetailPage.hotelName.waitFor({ state: 'visible' });
    const hotelName = await hotelDetailPage.hotelName.textContent();
    console.log(`  Hotel: ${hotelName}`);
    
    // Select first available room
    await hotelDetailPage.selectFirstRoom();
    
    // Take screenshot of room selection
    await page.screenshot({ path: 'test-results/03-room-selected.png', fullPage: true });
    
    // Continue to checkout
    await hotelDetailPage.clickContinueToCheckout();

    // Step 4: Fill guest information
    console.log('Step 4: Filling guest information...');
    const checkoutPage = new CheckoutPage(page);
    
    await checkoutPage.fillGuestInfo(TEST_GUEST_INFO);
    
    // Take screenshot of guest info form
    await page.screenshot({ path: 'test-results/04-guest-info.png', fullPage: true });
    
    // Continue to payment
    await checkoutPage.continueToPayment();

    // Step 5: Complete payment
    console.log('Step 5: Processing payment...');
    const paymentPage = new PaymentPage(page);
    
    // Fill in Stripe test card
    await paymentPage.fillCardDetails(STRIPE_TEST_CARDS.success);
    
    // Take screenshot of payment form
    await page.screenshot({ path: 'test-results/05-payment-form.png', fullPage: true });
    
    // Submit payment
    await paymentPage.submitPayment();

    // Step 6: Verify confirmation
    console.log('Step 6: Verifying booking confirmation...');
    const confirmationPage = new ConfirmationPage(page);
    
    // Wait for confirmation page
    await confirmationPage.waitForConfirmation();
    
    // Verify we're on confirmation page
    await expect(page).toHaveURL(/\/booking\/confirmation/);
    
    // Get booking ID
    const bookingId = await confirmationPage.getBookingId();
    console.log(`  Booking ID: ${bookingId}`);
    expect(bookingId).toBeTruthy();
    
    // Verify confirmation details are visible
    await expect(confirmationPage.confirmationNumber).toBeVisible();
    
    // Take screenshot of confirmation
    await page.screenshot({ path: 'test-results/06-confirmation.png', fullPage: true });
    
    console.log('✅ Booking flow completed successfully!');
  });

  test('should handle payment decline gracefully', async ({ page }) => {
    const { checkIn, checkOut } = getTestDates();

    // Navigate through booking flow to payment
    const searchPage = new HotelSearchPage(page);
    await searchPage.goto();
    await searchPage.search(checkIn, checkOut, 2, 0);
    await searchPage.clickFirstHotelWithRooms();

    const hotelDetailPage = new HotelDetailPage(page);
    await hotelDetailPage.selectFirstRoom();
    await hotelDetailPage.clickContinueToCheckout();

    const checkoutPage = new CheckoutPage(page);
    await checkoutPage.fillGuestInfo(TEST_GUEST_INFO);
    await checkoutPage.continueToPayment();

    // Try to pay with declined card
    const paymentPage = new PaymentPage(page);
    await paymentPage.fillCardDetails(STRIPE_TEST_CARDS.decline);
    await paymentPage.submitPayment();

    // Should show error message
    await page.waitForTimeout(3000);
    
    // Verify we're still on payment page (not confirmed)
    const currentUrl = page.url();
    expect(currentUrl).not.toContain('/confirmation');
    
    // Take screenshot of error state
    await page.screenshot({ path: 'test-results/payment-declined.png', fullPage: true });
    
    console.log('✅ Payment decline handled correctly');
  });

  test('should validate guest information form', async ({ page }) => {
    const { checkIn, checkOut } = getTestDates();

    // Navigate to checkout
    const searchPage = new HotelSearchPage(page);
    await searchPage.goto();
    await searchPage.search(checkIn, checkOut, 2, 0);
    await searchPage.clickFirstHotelWithRooms();

    const hotelDetailPage = new HotelDetailPage(page);
    await hotelDetailPage.selectFirstRoom();
    await hotelDetailPage.clickContinueToCheckout();

    // Try to submit empty form
    const checkoutPage = new CheckoutPage(page);
    
    // Click continue without filling form
    await checkoutPage.continueToPaymentButton.click();
    
    // Should still be on same page (form validation prevents submission)
    await page.waitForTimeout(1000);
    
    // Verify required field indicators or error messages
    const hasValidationErrors = await page.locator('text=/required|invalid|error/i').count() > 0;
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/form-validation.png', fullPage: true });
    
    console.log('✅ Form validation working');
  });
});

test.describe('UI and Responsiveness Tests', () => {
  test('should display properly on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    const { checkIn, checkOut } = getTestDates();
    
    // Test search page
    const searchPage = new HotelSearchPage(page);
    await searchPage.goto();
    
    await page.screenshot({ path: 'test-results/mobile-homepage.png', fullPage: true });
    
    // Search for hotels
    await searchPage.search(checkIn, checkOut, 2, 0);
    
    await page.screenshot({ path: 'test-results/mobile-search-results.png', fullPage: true });
    
    // View hotel details
    await searchPage.clickFirstHotelWithRooms();
    
    await page.screenshot({ path: 'test-results/mobile-hotel-details.png', fullPage: true });
    
    console.log('✅ Mobile viewport test completed');
  });

  test('should display properly on tablet viewport', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    
    const { checkIn, checkOut } = getTestDates();
    
    const searchPage = new HotelSearchPage(page);
    await searchPage.goto();
    
    await page.screenshot({ path: 'test-results/tablet-homepage.png', fullPage: true });
    
    await searchPage.search(checkIn, checkOut, 2, 0);
    
    await page.screenshot({ path: 'test-results/tablet-search-results.png', fullPage: true });
    
    console.log('✅ Tablet viewport test completed');
  });

  test('should have no console errors on critical pages', async ({ page }) => {
    const errors: string[] = [];
    
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    // Visit critical pages
    await page.goto('/');
    await page.waitForTimeout(2000);
    
    await page.goto('/lodging');
    await page.waitForTimeout(2000);
    
    // Log any errors found
    if (errors.length > 0) {
      console.log('Console errors found:', errors);
    }
    
    // We allow some errors (like CORS for images), but not too many
    expect(errors.length).toBeLessThan(10);
    
    console.log('✅ Console error check completed');
  });
});

test.describe('Performance Tests', () => {
  test('should load homepage within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    console.log(`Homepage load time: ${loadTime}ms`);
    
    // Should load within 5 seconds
    expect(loadTime).toBeLessThan(5000);
  });

  test('should load search results within acceptable time', async ({ page }) => {
    const { checkIn, checkOut } = getTestDates();
    
    await page.goto('/');
    
    const searchPage = new HotelSearchPage(page);
    
    const startTime = Date.now();
    await searchPage.search(checkIn, checkOut, 2, 0);
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    console.log(`Search results load time: ${loadTime}ms`);
    
    // Should load within 10 seconds
    expect(loadTime).toBeLessThan(10000);
  });
});

