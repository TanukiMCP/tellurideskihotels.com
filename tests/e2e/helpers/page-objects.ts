import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object Model for Hotel Search
 */
export class HotelSearchPage {
  readonly page: Page;
  readonly searchForm: Locator;
  readonly checkInInput: Locator;
  readonly checkOutInput: Locator;
  readonly adultsInput: Locator;
  readonly childrenInput: Locator;
  readonly searchButton: Locator;
  readonly hotelCards: Locator;

  constructor(page: Page) {
    this.page = page;
    this.searchForm = page.locator('form').filter({ hasText: 'Check-in' }).first();
    this.checkInInput = page.locator('input[name="checkIn"], input[type="date"]').first();
    this.checkOutInput = page.locator('input[name="checkOut"], input[type="date"]').nth(1);
    this.adultsInput = page.locator('input[name="adults"]');
    this.childrenInput = page.locator('input[name="children"]');
    this.searchButton = page.locator('button[type="submit"]').filter({ hasText: /search/i }).first();
    this.hotelCards = page.locator('[data-testid="hotel-card"], .hotel-card, a[href*="/lodging/"]').filter({ has: page.locator('img') });
  }

  async goto() {
    await this.page.goto('/');
  }

  async search(checkIn: string, checkOut: string, adults: number = 2, children: number = 0) {
    // Fill in search form
    await this.checkInInput.fill(checkIn);
    await this.checkOutInput.fill(checkOut);
    
    if (await this.adultsInput.isVisible()) {
      await this.adultsInput.fill(adults.toString());
    }
    
    if (await this.childrenInput.isVisible()) {
      await this.childrenInput.fill(children.toString());
    }

    // Submit search
    await this.searchButton.click();
    
    // Wait for navigation or results
    await this.page.waitForURL(/\/lodging/);
  }

  async clickFirstHotelWithRooms() {
    // Wait for hotel cards to load
    await this.hotelCards.first().waitFor({ state: 'visible', timeout: 10000 });
    
    // Click the first hotel card
    await this.hotelCards.first().click();
    
    // Wait for hotel detail page to load
    await this.page.waitForURL(/\/lodging\/[^/]+/);
  }
}

/**
 * Page Object Model for Hotel Detail & Room Selection
 */
export class HotelDetailPage {
  readonly page: Page;
  readonly hotelName: Locator;
  readonly roomCards: Locator;
  readonly roomRadioButtons: Locator;
  readonly continueButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.hotelName = page.locator('h1').first();
    this.roomCards = page.locator('[data-testid="room-card"], .room-card, div').filter({ hasText: /room/i });
    this.roomRadioButtons = page.locator('input[type="radio"][name*="room"], input[type="radio"]');
    this.continueButton = page.locator('button').filter({ hasText: /continue|checkout|book/i });
  }

  async waitForRoomsToLoad() {
    // Wait for rooms to load (may take a few seconds)
    await this.page.waitForTimeout(3000);
    
    // Check if we have any radio buttons (rooms loaded)
    const radioCount = await this.roomRadioButtons.count();
    if (radioCount === 0) {
      throw new Error('No rooms available for this hotel');
    }
  }

  async selectFirstRoom() {
    await this.waitForRoomsToLoad();
    
    // Select the first available room
    const firstRadio = this.roomRadioButtons.first();
    await firstRadio.click();
    
    // Wait a moment for the selection to register
    await this.page.waitForTimeout(500);
  }

  async clickContinueToCheckout() {
    await this.continueButton.click();
    
    // Wait for checkout page to load
    await this.page.waitForTimeout(1000);
  }
}

/**
 * Page Object Model for Checkout Flow
 */
export class CheckoutPage {
  readonly page: Page;
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly emailInput: Locator;
  readonly phoneInput: Locator;
  readonly specialRequestsInput: Locator;
  readonly continueToPaymentButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.firstNameInput = page.locator('input[name="firstName"], input[id*="first"], input[placeholder*="First"]').first();
    this.lastNameInput = page.locator('input[name="lastName"], input[id*="last"], input[placeholder*="Last"]').first();
    this.emailInput = page.locator('input[type="email"], input[name="email"]').first();
    this.phoneInput = page.locator('input[type="tel"], input[name="phone"]').first();
    this.specialRequestsInput = page.locator('textarea, input[name*="request"], input[name*="special"]').first();
    this.continueToPaymentButton = page.locator('button').filter({ hasText: /continue|payment|next/i }).first();
  }

  async fillGuestInfo(guestInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    specialRequests?: string;
  }) {
    await this.firstNameInput.fill(guestInfo.firstName);
    await this.lastNameInput.fill(guestInfo.lastName);
    await this.emailInput.fill(guestInfo.email);
    await this.phoneInput.fill(guestInfo.phone);
    
    if (guestInfo.specialRequests && await this.specialRequestsInput.isVisible()) {
      await this.specialRequestsInput.fill(guestInfo.specialRequests);
    }
  }

  async continueToPayment() {
    await this.continueToPaymentButton.click();
    await this.page.waitForTimeout(2000);
  }
}

/**
 * Page Object Model for Payment (Stripe)
 */
export class PaymentPage {
  readonly page: Page;
  readonly stripeCardInput: Locator;
  readonly payButton: Locator;

  constructor(page: Page) {
    this.page = page;
    // Stripe Elements iframe
    this.stripeCardInput = page.frameLocator('iframe[name^="__privateStripeFrame"]').locator('input[name="number"]');
    this.payButton = page.locator('button[type="submit"]').filter({ hasText: /pay/i }).first();
  }

  async waitForStripeToLoad() {
    // Wait for Stripe iframe to load
    await this.page.waitForTimeout(3000);
  }

  async fillCardDetails(cardNumber: string, expiry: string = '1225', cvc: string = '123', zip: string = '12345') {
    await this.waitForStripeToLoad();
    
    // Fill in Stripe card element
    const cardFrame = this.page.frameLocator('iframe[name^="__privateStripeFrame"]').first();
    
    // Card number
    const cardInput = cardFrame.locator('input[name="number"], input[placeholder*="card"]').first();
    await cardInput.fill(cardNumber);
    
    // Expiry
    const expiryInput = cardFrame.locator('input[name="expiry"], input[placeholder*="MM"]').first();
    await expiryInput.fill(expiry);
    
    // CVC
    const cvcInput = cardFrame.locator('input[name="cvc"], input[placeholder*="CVC"]').first();
    await cvcInput.fill(cvc);
    
    // ZIP (if present)
    const zipInput = cardFrame.locator('input[name="postalCode"], input[placeholder*="ZIP"]').first();
    if (await zipInput.isVisible().catch(() => false)) {
      await zipInput.fill(zip);
    }
  }

  async submitPayment() {
    await this.payButton.click();
    
    // Wait for payment processing (can take several seconds)
    await this.page.waitForTimeout(5000);
  }
}

/**
 * Page Object Model for Booking Confirmation
 */
export class ConfirmationPage {
  readonly page: Page;
  readonly confirmationNumber: Locator;
  readonly bookingDetails: Locator;

  constructor(page: Page) {
    this.page = page;
    this.confirmationNumber = page.locator('text=/confirmation|booking/i').first();
    this.bookingDetails = page.locator('text=/check-in|hotel|guest/i');
  }

  async waitForConfirmation() {
    // Wait for confirmation page to load
    await this.page.waitForURL(/\/booking\/confirmation/, { timeout: 15000 });
    await this.confirmationNumber.waitFor({ state: 'visible', timeout: 10000 });
  }

  async getBookingId(): Promise<string> {
    // Extract booking ID from URL
    const url = this.page.url();
    const match = url.match(/\/confirmation\/([^/?]+)/);
    return match ? match[1] : '';
  }
}

