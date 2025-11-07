# E2E Test Suite for Telluride Ski Hotels

This directory contains end-to-end (E2E) tests for the complete booking flow using Playwright.

## 🎯 What's Tested

The test suite covers:

1. **Complete Booking Flow**
   - Hotel search
   - Hotel detail viewing
   - Room selection
   - Guest information form
   - Payment processing (Stripe)
   - Booking confirmation

2. **Error Handling**
   - Payment decline scenarios
   - Form validation
   - Network error handling

3. **UI & Responsiveness**
   - Mobile viewport (375px)
   - Tablet viewport (768px)
   - Desktop viewport (1920px)

4. **Performance**
   - Page load times
   - API response times

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- npm installed
- Development server running

### Installation

Playwright is already installed as a dev dependency. If you need to reinstall:

```bash
npm install -D @playwright/test
npx playwright install chromium
```

### Running Tests

**Run all tests (headless):**
```bash
npm test
```

**Run tests with UI (visual mode):**
```bash
npm run test:ui
```

**Run tests in headed mode (see browser):**
```bash
npm run test:headed
```

**Debug tests (step through):**
```bash
npm run test:debug
```

**View test report:**
```bash
npm run test:report
```

## 📁 Test Structure

```
tests/
├── e2e/
│   ├── booking-flow.spec.ts    # Main E2E test suite
│   └── helpers/
│       ├── page-objects.ts     # Page Object Models
│       └── test-data.ts        # Test data and utilities
├── README.md                    # This file
└── test-results/               # Screenshots and artifacts (gitignored)
```

## 🔑 Test Configuration

### Environment Variables

Tests use `.env.test` for test/sandbox credentials:

- **LiteAPI**: Sandbox key `sand_cae10031-5457-4973-9404-4ec0a6c31896`
- **Stripe**: Test keys (no real charges)

### Test Data

**Guest Information:**
- Name: John Doe
- Email: test@tellurideskihotels.com
- Phone: +1 (555) 123-4567

**Stripe Test Cards:**
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 9995`
- Requires Auth: `4000 0025 0000 3155`

**Search Dates:**
- Check-in: Tomorrow
- Check-out: 3 days from tomorrow
- Adults: 2
- Children: 0

## 📊 Test Reports

After running tests, you'll find:

1. **Screenshots** in `test-results/`:
   - `01-search-results.png`
   - `02-hotel-details.png`
   - `03-room-selected.png`
   - `04-guest-info.png`
   - `05-payment-form.png`
   - `06-confirmation.png`

2. **HTML Report** (open with `npm run test:report`):
   - Detailed test results
   - Screenshots on failure
   - Video recordings (on failure)
   - Test traces

## 🧪 Writing New Tests

### Using Page Objects

```typescript
import { test } from '@playwright/test';
import { HotelSearchPage } from './helpers/page-objects';

test('my test', async ({ page }) => {
  const searchPage = new HotelSearchPage(page);
  await searchPage.goto();
  await searchPage.search('2025-11-10', '2025-11-13', 2, 0);
});
```

### Adding Test Data

Edit `helpers/test-data.ts`:

```typescript
export const NEW_TEST_DATA = {
  // your test data
};
```

## 🐛 Debugging Tests

### 1. Visual Debugging (Recommended)

```bash
npm run test:ui
```

This opens Playwright's UI mode where you can:
- See tests run in real-time
- Step through test actions
- Inspect DOM at each step
- View network requests

### 2. Headed Mode

```bash
npm run test:headed
```

Watch the browser as tests run (slower but helpful for debugging).

### 3. Debug Mode

```bash
npm run test:debug
```

Opens Playwright Inspector to step through tests line by line.

### 4. Console Logs

Tests include `console.log()` statements showing progress:
```
Step 1: Searching for hotels...
Step 2: Selecting hotel...
  Hotel: The Victorian Inn
Step 3: Selecting room...
...
```

## ⚙️ Configuration

Edit `playwright.config.ts` to customize:

- **Browsers**: Add Firefox, Safari, etc.
- **Viewports**: Test different screen sizes
- **Timeout**: Adjust test timeout (default: 120s)
- **Retries**: Configure retry logic
- **Workers**: Parallel test execution

Example:
```typescript
projects: [
  { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
  { name: 'mobile', use: { ...devices['iPhone 12'] } },
],
```

## 📝 Test Checklist

Before deploying, ensure all tests pass:

- [ ] Full booking flow completes
- [ ] Payment decline handled
- [ ] Form validation works
- [ ] Mobile responsive
- [ ] Tablet responsive
- [ ] No console errors
- [ ] Performance acceptable

## 🚨 Common Issues

### Issue: "Target closed" error
**Solution**: Increase timeout in test or `playwright.config.ts`

### Issue: Stripe iframe not found
**Solution**: Increase wait time in `PaymentPage.waitForStripeToLoad()`

### Issue: No rooms available
**Solution**: Use different test dates or check LiteAPI sandbox data

### Issue: Tests fail on CI
**Solution**: Ensure `.env.test` is available in CI environment

## 📚 Resources

- [Playwright Documentation](https://playwright.dev)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Stripe Test Cards](https://stripe.com/docs/testing)
- [LiteAPI Documentation](https://docs.liteapi.travel)

## 🤝 Contributing

When adding new tests:

1. Follow existing patterns (Page Object Model)
2. Add descriptive test names
3. Include console.log() for debugging
4. Take screenshots at key steps
5. Handle async operations properly
6. Update this README if needed

## 📞 Support

If tests fail unexpectedly:

1. Check `.env.test` has correct keys
2. Verify dev server is running
3. Check network connectivity
4. Review test screenshots in `test-results/`
5. Check Playwright trace viewer

---

**Happy Testing! 🎉**

