#!/bin/bash

# Quick test script for booking flow
# This script runs the E2E tests with visual UI

echo "🧪 Telluride Ski Hotels - E2E Test Suite"
echo "========================================"
echo ""
echo "Starting tests with Playwright UI..."
echo ""
echo "Test Configuration:"
echo "  - LiteAPI: Sandbox mode"
echo "  - Stripe: Test mode (no real charges)"
echo "  - Base URL: http://localhost:4321"
echo ""
echo "Test Coverage:"
echo "  ✓ Complete booking flow"
echo "  ✓ Payment processing"
echo "  ✓ Error handling"
echo "  ✓ UI responsiveness"
echo "  ✓ Performance benchmarks"
echo ""
echo "Press Ctrl+C to stop tests"
echo ""

# Run tests with UI
npm run test:ui

