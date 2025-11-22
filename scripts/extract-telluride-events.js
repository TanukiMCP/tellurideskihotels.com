/**
 * Extract Telluride Events from official website
 * Run with: node scripts/extract-telluride-events.js
 */

import puppeteer from 'puppeteer';

async function extractEvents() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    await page.goto('https://www.telluride.com/festivals-events/events/', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    // Wait for events to load
    await page.waitForTimeout(3000);

    // Extract events from the page
    const events = await page.evaluate(() => {
      const eventList = [];
      
      // Try multiple selectors to find event cards
      const selectors = [
        'a[href*="/event/"]',
        '.event-card',
        '.event-item',
        'article',
        '[class*="event"]'
      ];
      
      let eventLinks = [];
      for (const selector of selectors) {
        const links = Array.from(document.querySelectorAll(selector));
        if (links.length > 0) {
          eventLinks = links;
          break;
        }
      }
      
      // If no specific selector works, get all links to /event/
      if (eventLinks.length === 0) {
        eventLinks = Array.from(document.querySelectorAll('a[href*="/event/"]'));
      }
      
      eventLinks.forEach((link, index) => {
        try {
          const href = link.href || link.getAttribute('href');
          if (!href || !href.includes('/event/')) return;
          
          // Find container
          let container = link.closest('article') || 
                         link.closest('.card') || 
                         link.closest('[class*="event"]') ||
                         link.parentElement;
          
          // Extract title
          const titleEl = container.querySelector('h1, h2, h3, h4, h5, h6') || 
                         container.querySelector('[class*="title"]') ||
                         link;
          const title = titleEl ? titleEl.textContent.trim() : '';
          
          // Extract date
          const dateEl = container.querySelector('time') ||
                        container.querySelector('[class*="date"]') ||
                        container.querySelector('[datetime]');
          let date = '';
          if (dateEl) {
            date = dateEl.getAttribute('datetime') || dateEl.textContent.trim();
          }
          
          // Extract description
          const descEl = container.querySelector('p') ||
                        container.querySelector('[class*="desc"]') ||
                        container.querySelector('[class*="summary"]');
          const description = descEl ? descEl.textContent.trim().substring(0, 150) : '';
          
          // Only add if we have a title
          if (title && href) {
            eventList.push({
              id: (index + 1).toString(),
              name: title,
              date: date || 'TBD',
              type: 'community', // Default, can be updated manually
              description: description || '',
              url: href.startsWith('http') ? href : `https://www.telluride.com${href}`
            });
          }
        } catch (err) {
          console.error('Error extracting event:', err);
        }
      });
      
      // Remove duplicates based on URL
      const seen = new Set();
      return eventList.filter(event => {
        if (seen.has(event.url)) return false;
        seen.add(event.url);
        return true;
      });
    });

    console.log(`Found ${events.length} events`);
    console.log(JSON.stringify(events, null, 2));
    
    return events;
  } catch (error) {
    console.error('Error extracting events:', error);
    return [];
  } finally {
    await browser.close();
  }
}

extractEvents().then(events => {
  if (events.length > 0) {
    console.log(`\nExtracted ${events.length} events successfully`);
  } else {
    console.log('No events found');
  }
  process.exit(0);
}).catch(err => {
  console.error('Script error:', err);
  process.exit(1);
});

