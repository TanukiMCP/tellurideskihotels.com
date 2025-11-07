# Testing Guide for Telluride Ski Hotels

Complete guide for testing your booking flow end-to-end with test data.

## 🎯 Overview

This project includes a comprehensive automated test suite that covers:
- Complete booking flow (search → payment → confirmation)
- UI/UX validation across devices
- Payment processing with Stripe test cards
- Error handling and edge cases
- Performance benchmarks

## 🚀 Quick Start

### 1. Setup Test Environment

The test environment is already configured with:
- **LiteAPI Sandbox**: `sand_cae10031-5457-4973-9404-4ec0a6c31896`
- **Stripe Test Mode**: Test keys (no real charges)

Configuration file: `.env.test`

### 2. Run Tests

```bash
# Run all tests (headless)
npm test

# Run with visual UI (recommended for first time)
npm run test:ui

# Run in headed mode (see browser)
npm run test:headed

# Debug mode (step through tests)
npm run test:debug

# View last test report
npm run test:report
```

## 📋 Manual Testing Checklist

If you prefer to test manually, follow this checklist:

### Step 1: Homepage & Search
- [ ] Navigate to `http://localhost:4321`
- [ ] Verify search form displays
- [ ] Select check-in date (tomorrow)
- [ ] Select check-out date (3 days later)
- [ ] Set adults: 2, children: 0
- [ ] Click "Search"
- [ ] Verify search results load

### Step 2: Hotel Selection
- [ ] Verify hotel cards display with images
- [ ] Verify prices are visible
- [ ] Click on a hotel card
- [ ] Verify hotel detail page loads
- [ ] Verify hotel images display
- [ ] Verify amenities list shows
- [ ] Verify reviews section displays

### Step 3: Room Selection
- [ ] Wait for rooms to load (3-5 seconds)
- [ ] Verify room cards display
- [ ] Verify each room shows:
  - Room name
  - Price per night
  - Total price
  - Board type
  - Cancellation policy
- [ ] Select a room (click radio button)
- [ ] Verify "Continue to Checkout" button enables
- [ ] Click "Continue to Checkout"

### Step 4: Guest Information
- [ ] Verify checkout form displays
- [ ] Verify booking summary shows:
  - Hotel name
  - Room name
  - Check-in/out dates
  - Total price
- [ ] Fill in guest information:
  - First Name: John
  - Last Name: Doe
  - Email: test@example.com
  - Phone: +1 (555) 123-4567
  - Special Requests: (optional)
- [ ] Click "Continue to Payment"

### Step 5: Payment
- [ ] Verify Stripe payment form loads
- [ ] Fill in test card details:
  - Card: `4242 4242 4242 4242`
  - Expiry: `12/25`
  - CVC: `123`
  - ZIP: `12345`
- [ ] Click "Pay $XXX.XX"
- [ ] Verify loading state shows
- [ ] Wait for payment to process

### Step 6: Confirmation
- [ ] Verify redirect to confirmation page
- [ ] Verify booking ID displays
- [ ] Verify confirmation details show:
  - Hotel name
  - Check-in/out dates
  - Guest information
  - Total price
- [ ] Check email for confirmation (if configured)

## 🧪 Test Scenarios

### Successful Booking
Use card: `4242 4242 4242 4242`
Expected: Booking completes successfully

### Declined Payment
Use card: `4000 0000 0000 9995`
Expected: Error message, stay on payment page

### 3D Secure Authentication
Use card: `4000 0025 0000 3155`
Expected: Authentication popup, then success

### Form Validation
Leave fields empty and submit
Expected: Validation errors display

## 📱 Responsive Testing

### Mobile (375px width)
```bash
# Automated
npm test -- --grep "mobile"

# Manual: Resize browser to 375px width
```

### Tablet (768px width)
```bash
# Automated
npm test -- --grep "tablet"

# Manual: Resize browser to 768px width
```

### Desktop (1920px width)
```bash
# Manual: Full screen browser
```

## 🎨 UI Review Points

For each page, check:

### Layout
- [ ] Proper spacing and padding
- [ ] Content doesn't touch edges
- [ ] Consistent margins
- [ ] Proper alignment

### Typography
- [ ] Readable font sizes
- [ ] Clear hierarchy
- [ ] No text overflow
- [ ] Proper line height

### Colors
- [ ] Good contrast
- [ ] Consistent color scheme
- [ ] Accessible text colors
- [ ] Brand colors used correctly

### Interactive Elements
- [ ] Buttons have hover states
- [ ] Inputs have focus states
- [ ] Loading states work
- [ ] Disabled states are clear

### Images
- [ ] Images load properly
- [ ] Fallback for missing images
- [ ] Proper aspect ratios
- [ ] Lazy loading works

## 🐛 Debugging Failed Tests

### 1. Check Screenshots
Failed tests automatically capture screenshots:
```
test-results/
├── 01-search-results.png
├── 02-hotel-details.png
├── 03-room-selected.png
├── 04-guest-info.png
├── 05-payment-form.png
└── 06-confirmation.png
```

### 2. View Test Report
```bash
npm run test:report
```

### 3. Check Browser Console
Open DevTools → Console tab during manual testing

### 4. Review Network Requests
Open DevTools → Network tab to see API calls:
- `/api/hotels/search`
- `/api/hotels/rates`
- `/api/checkout/create-payment-intent`
- `/api/booking/prebook`
- `/api/booking/confirm`

## 📊 Performance Benchmarks

Expected load times:
- Homepage: < 5 seconds
- Search results: < 10 seconds
- Hotel details: < 5 seconds
- Room rates: < 5 seconds
- Payment processing: < 10 seconds

Run performance tests:
```bash
npm test -- --grep "performance"
```

## 🔐 Test Data Reference

### Guest Information
```
First Name: John
Last Name: Doe
Email: test@tellurideskihotels.com
Phone: +1 (555) 123-4567
```

### Stripe Test Cards
```
Success:      4242 4242 4242 4242
Decline:      4000 0000 0000 9995
Requires 3DS: 4000 0025 0000 3155

Expiry: Any future date (e.g., 12/25)
CVC: Any 3 digits (e.g., 123)
ZIP: Any 5 digits (e.g., 12345)
```

### Search Parameters
```
Check-in: Tomorrow's date
Check-out: 3 days from tomorrow
Adults: 2
Children: 0
Rooms: 1
```

## 🚨 Common Issues & Solutions

### Issue: No rooms available
**Solution**: Try different dates or check LiteAPI sandbox

### Issue: Payment form doesn't load
**Solution**: Check Stripe test keys in `.env.test`

### Issue: Images not loading
**Solution**: Check network tab for CORS errors

### Issue: Tests timeout
**Solution**: Increase timeout in `playwright.config.ts`

### Issue: Booking confirmation doesn't load
**Solution**: Check browser console for API errors

## 📈 CI/CD Integration

To run tests in CI/CD:

```yaml
# Example GitHub Actions
- name: Install dependencies
  run: npm ci

- name: Install Playwright
  run: npx playwright install --with-deps chromium

- name: Run tests
  run: npm test
  env:
    # Add test environment variables
    LITEAPI_PRIVATE_KEY: ${{ secrets.LITEAPI_SANDBOX_KEY }}
    STRIPE_SECRET_KEY: ${{ secrets.STRIPE_TEST_KEY }}
```

## 📚 Additional Resources

- [Playwright Documentation](https://playwright.dev)
- [Stripe Testing Guide](https://stripe.com/docs/testing)
- [LiteAPI Documentation](https://docs.liteapi.travel)
- [Test Suite README](./tests/README.md)

## 🎯 Testing Best Practices

1. **Run tests before deploying**
2. **Test on multiple browsers** (Chrome, Firefox, Safari)
3. **Test on multiple devices** (mobile, tablet, desktop)
4. **Check console for errors**
5. **Verify email confirmations** (if configured)
6. **Test edge cases** (declined payments, form validation)
7. **Monitor performance** (page load times)
8. **Review screenshots** for UI issues

## ✅ Pre-Deployment Checklist

Before going live:

- [ ] All automated tests pass
- [ ] Manual smoke test completed
- [ ] Mobile responsive verified
- [ ] Payment flow works with test cards
- [ ] Email confirmations sent
- [ ] No console errors
- [ ] Performance benchmarks met
- [ ] Error handling works
- [ ] Form validation works
- [ ] Images load properly

---

**Need Help?** Check the [tests/README.md](./tests/README.md) for detailed test suite documentation.

