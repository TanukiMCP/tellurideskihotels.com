/**
 * Process extracted events and format them for EventsWidget
 */

// Helper function to parse dates like "Nov 27, 2025" or "Dec 5 - 7, 2025"
function parseDate(dateStr) {
  if (!dateStr || dateStr.trim() === '') return null;
  
  // Skip recurring events
  if (dateStr.includes('First') || dateStr.includes('Thursdays') || 
      dateStr.includes('Wednesdays') || dateStr.includes('Saturdays') ||
      dateStr.includes('Select Dates') || dateStr.includes('This Winter')) {
    return null;
  }
  
  // Handle date ranges - take the first date
  if (dateStr.includes(' - ')) {
    dateStr = dateStr.split(' - ')[0].trim();
  }
  
  // Handle "&" dates like "Dec 19 & 20, 2025" - take first
  if (dateStr.includes(' & ')) {
    dateStr = dateStr.split(' & ')[0].trim();
  }
  
  // Parse formats like "Nov 27, 2025" or "Dec 10, 2025"
  const months = {
    'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04', 'May': '05', 'Jun': '06',
    'Jul': '07', 'Aug': '08', 'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12',
    'January': '01', 'February': '02', 'March': '03', 'April': '04', 'May': '05', 'June': '06',
    'July': '07', 'August': '08', 'September': '09', 'October': '10', 'November': '11', 'December': '12'
  };
  
  // Match patterns like "Nov 27, 2025" or "December 10, 2025"
  const match = dateStr.match(/(\w+)\s+(\d+),?\s+(\d{4})/);
  if (match) {
    const [, monthName, day, year] = match;
    const month = months[monthName];
    if (month) {
      const dayPadded = day.padStart(2, '0');
      return `${year}-${month}-${dayPadded}`;
    }
  }
  
  return null;
}

// Helper to determine event type from name/description
function determineType(name, description) {
  const lowerName = name.toLowerCase();
  const lowerDesc = description.toLowerCase();
  
  if (lowerName.includes('festival') || lowerDesc.includes('festival')) return 'festival';
  if (lowerName.includes('concert') || lowerDesc.includes('concert') || 
      lowerName.includes('music') || lowerDesc.includes('music') ||
      lowerName.includes('band') || lowerDesc.includes('band') ||
      lowerName.includes('dj') || lowerDesc.includes('dj')) return 'concert';
  if (lowerName.includes('trot') || lowerName.includes('run') || lowerName.includes('race') ||
      lowerName.includes('sport') || lowerDesc.includes('sport')) return 'sports';
  if (lowerName.includes('art') || lowerName.includes('theater') || lowerName.includes('theatre') ||
      lowerName.includes('film') || lowerName.includes('movie') || lowerName.includes('dance') ||
      lowerName.includes('gallery') || lowerDesc.includes('art')) return 'art';
  return 'community';
}

// The extracted events from the browser
const extractedEvents = [
  { name: "Free Wine Tasting", url: "https://www.telluride.com/event/free-wine-tasting/", date: "", description: "Wednesdays This Winter" },
  { name: "Turkey Trot", url: "https://www.telluride.com/event/san-miguel-county-turkey-trot/", date: "", description: "Nov 27, 2025" },
  { name: "Thanksgiving Buffet at The View", url: "https://www.telluride.com/event/thanksgiving-buffet-at-the-view/", date: "", description: "Nov 27, 2025" },
  { name: "Thanksgiving Feast at Madeline Hotel & Residences", url: "https://www.telluride.com/event/thanksgiving-feast-at-madeline-hotel-residences/", date: "", description: "Nov 27, 2025" },
  { name: "Mind Blown", url: "https://www.telluride.com/event/mind-blown/", date: "", description: "Fridays and Saturdays This Winter" },
  { name: "Sno-ciety", url: "https://www.telluride.com/event/sno-ciety/", date: "", description: "Nov 28, 2025" },
  { name: "Electric Love", url: "https://www.telluride.com/event/electric-love-1/", date: "", description: "Nov 29, 2025" },
  { name: "Hugh Phillips", url: "https://www.telluride.com/event/hugh-phillips/", date: "", description: "Dec 4, 2025" },
  { name: "Mountain Sprouts Preschool Holiday Fundraiser", url: "https://www.telluride.com/event/mountain-sprouts-preschool-holiday-fundraiser/", date: "", description: "Dec 4, 2025" },
  { name: "Telluride Nordic Season Kick-Off", url: "https://www.telluride.com/event/telluride-nordic-season-kick-off/", date: "", description: "Dec 4, 2025" },
  { name: "Moontour", url: "https://www.telluride.com/event/moontour/", date: "", description: "Dec 5, 2025" },
  { name: "Telluride Arts Holiday Bazaar", url: "https://www.telluride.com/event/holiday-arts-bazaar/", date: "", description: "Dec 5 - 7, 2025" },
  { name: "Beetlejuice Jr.", url: "https://www.telluride.com/event/beetlejuice-jr/", date: "", description: "Dec 5 - 7, 2025" },
  { name: "TAB World AIDS Day Dance Party", url: "https://www.telluride.com/event/tab-world-aids-day-dance-party/", date: "", description: "Dec 5, 2025" },
  { name: "Telluride Ski Resort Opening Day 2025", url: "https://www.telluride.com/event/telluride-ski-resort-opening-day/", date: "", description: "Dec 6, 2025" },
  { name: "Safety Meeting", url: "https://www.telluride.com/event/safety-meeting/", date: "", description: "Dec 6, 2025" },
  { name: "Telluride Art Walk", url: "https://www.telluride.com/event/telluride-art-walk/", date: "", description: "First Thursdays of the Month" },
  { name: "Noel Night", url: "https://www.telluride.com/event/noel-night/", date: "", description: "Dec 10, 2025" },
  { name: "Noel Night Photos With Santa", url: "https://www.telluride.com/event/noel-night-photos-with-santa/", date: "", description: "Dec 10, 2025" },
  { name: "Alice's Wonderland", url: "https://www.telluride.com/event/alices-wonderland/", date: "", description: "Dec 13 - 14, 2025" },
  { name: "Mountain Village Holiday Prelude", url: "https://www.telluride.com/event/mountain-village-holiday-prelude/", date: "", description: "Dec 13 - 14, 2025" },
  { name: "Backcountry Chats", url: "https://www.telluride.com/event/backcountry-chats/", date: "", description: "Select Dates This Winter" },
  { name: "Chanukah in Telluride", url: "https://www.telluride.com/event/chanukah-in-telluride/", date: "", description: "Dec 18, 2025" },
  { name: "Cassidy", url: "https://www.telluride.com/event/cassidy/", date: "", description: "Dec 18 - 23, 2025" },
  { name: "Pixie and the Partygrass Boys", url: "https://www.telluride.com/event/pixie-and-the-partygrass-boys/", date: "", description: "Dec 19 & 20, 2025" },
  { name: "Alpine Chapel Christmas Eve Services", url: "https://www.telluride.com/event/alpine-chapel-christmas-eve-services/", date: "", description: "Dec 24, 2025" },
  { name: "Christmas Eve Torchlight Parade", url: "https://www.telluride.com/event/christmas-eve-torchlight-parade/", date: "", description: "Dec 24, 2025" },
  { name: "Sheridan Arts Foundation Holiday Concert Series", url: "https://www.telluride.com/event/sheridan-arts-foundation-holiday-concert-series/", date: "", description: "Dec 26 - 31, 2025" },
  { name: "Tease the Season: A Holiday Burlesque", url: "https://www.telluride.com/event/tease-the-season-a-holiday-burlesque/", date: "", description: "Dec 26 & 27, 2025" },
  { name: "Jane Monheit", url: "https://www.telluride.com/event/jane-monheit/", date: "", description: "Dec 28, 2025" },
  { name: "Yesterday", url: "https://www.telluride.com/event/yesterday/", date: "", description: "Dec 29, 2025" },
  { name: "Larkin Poe", url: "https://www.telluride.com/event/larkin-poe/", date: "", description: "Dec 31, 2025" },
  { name: "New Year's Eve Torchlight Parade & Fireworks", url: "https://www.telluride.com/event/new-years-eve-torchlight-parade-fireworks/", date: "", description: "Dec 31, 2025" },
  { name: "Telluride Foundation's Volunteer of the Year Celebration", url: "https://www.telluride.com/event/telluride-foundations-volunteer-of-the-year-celebration/", date: "", description: "Jan 8, 2026" },
  { name: "Neal Francis", url: "https://www.telluride.com/event/neal-francis/", date: "", description: "Jan 8, 2026" },
  { name: "The Motet", url: "https://www.telluride.com/event/the-motet/", date: "", description: "Jan 9, 2026" },
  { name: "Kitchen Dwellers", url: "https://www.telluride.com/event/kitchen-dwellers/", date: "", description: "Jan 15 & 16, 2026" },
  { name: "Late Night Radio", url: "https://www.telluride.com/event/late-night-radio/", date: "", description: "Jan 17, 2026" },
  { name: "Ridgeliners", url: "https://www.telluride.com/event/ridgeliners/", date: "", description: "Jan 18, 2026" },
  { name: "Jason Leech w/Future Joy and Michael Wilbur of Moon Hooch", url: "https://www.telluride.com/event/jason-leech-w-future-joy-and-michael-wilbur-of-moon-hooch/", date: "", description: "Jan 18, 2026" },
  { name: "Toubab Krewe", url: "https://www.telluride.com/event/toubab-krewe/", date: "", description: "Jan 20, 2025" },
  { name: "Gavin DeGraw", url: "https://www.telluride.com/event/gavin-degraw/", date: "", description: "Jan 22, 2025" },
  { name: "YOPE", url: "https://www.telluride.com/event/yope/", date: "", description: "Jan 22, 2026" },
  { name: "Drew Emmitt, John Cowan and Eli Emmitt", url: "https://www.telluride.com/event/drew-emmitt-john-cowan-and-eli-emmitt/", date: "", description: "Jan 22, 2026" },
  { name: "Andy Frasco & The U.N.", url: "https://www.telluride.com/event/andy-frasco-the-u.n/", date: "", description: "Jan 23, 2026" },
  { name: "Harlem Quartet", url: "https://www.telluride.com/event/harlem-quartet/", date: "", description: "Jan 24, 2026" },
  { name: "Pressure Drop", url: "https://www.telluride.com/event/pressure-drop/", date: "", description: "Jan 29, 2026" },
  { name: "Jammy Buffet", url: "https://www.telluride.com/event/jammy-buffet/", date: "", description: "Jan 30, 2025" },
  { name: "Cousin Curtiss", url: "https://www.telluride.com/event/cousin-curtiss/", date: "", description: "Jan 30, 2026" },
  { name: "The Last Class With Robert Reich", url: "https://www.telluride.com/event/the-last-class-with-robert-reich/", date: "", description: "Jan 30, 2026" },
  { name: "Emily Scott Robinson", url: "https://www.telluride.com/event/emily-scott-robinson/", date: "", description: "Jan 31, 2026" },
  { name: "May Erlewine", url: "https://www.telluride.com/event/may-erlewine/", date: "", description: "Feb 3, 2026" },
  { name: "Discognition", url: "https://www.telluride.com/event/discognition/", date: "", description: "Feb 5, 2026" },
  { name: "Guys and Dolls", url: "https://www.telluride.com/event/guys-and-dolls/", date: "", description: "Feb 6 - 8, 2026" },
  { name: "Briscoe", url: "https://www.telluride.com/event/briscoe/", date: "", description: "Feb 6, 2026" },
  { name: "Telluride Comedy Festival", url: "https://www.telluride.com/event/telluride-comedy-festival/", date: "", description: "Feb 12 - 15, 2026" },
  { name: "TAB Student Fashion Show", url: "https://www.telluride.com/event/tab-student-fashion-show/", date: "", description: "Feb 19 & 20, 2026" },
  { name: "Western Medicine", url: "https://www.telluride.com/event/western-medicine/", date: "", description: "Feb 19, 2026" },
  { name: "The Infamous Stringdusters", url: "https://www.telluride.com/event/the-infamous-stringdusters/", date: "", description: "Feb 19 - 21, 2026" },
  { name: "Black Pistol Fire", url: "https://www.telluride.com/event/black-pistol-fire/", date: "", description: "Feb 25, 2026" },
  { name: "The Brothers Comatose", url: "https://www.telluride.com/event/the-brothers-comatose/", date: "", description: "Feb 26, 2026" },
  { name: "TAB Fashion Show", url: "https://www.telluride.com/event/tab-fashion-show/", date: "", description: "Feb 26 - 28, 2026" },
  { name: "Telluride Gay Ski Week", url: "https://www.telluride.com/event/telluride-gay-ski-week/", date: "", description: "Feb 28 - Mar 7, 2026" },
  { name: "Birds of Play", url: "https://www.telluride.com/event/birds-of-play/", date: "", description: "Mar 4, 2026" },
  { name: "The Polish Ambassador", url: "https://www.telluride.com/event/the-polish-ambassador/", date: "", description: "Mar 7, 2026" },
  { name: "Big Something", url: "https://www.telluride.com/event/big-something/", date: "", description: "Mar 12 & 13, 2026" },
  { name: "ZOSO", url: "https://www.telluride.com/event/zoso/", date: "", description: "Mar 14, 2026" },
  { name: "Grieves", url: "https://www.telluride.com/event/grieves/", date: "", description: "Mar 15, 2026" },
  { name: "Galvin Cello Quartet", url: "https://www.telluride.com/event/galvin-cello-quartet/", date: "", description: "March 19, 2026" },
  { name: "Easy Jim", url: "https://www.telluride.com/event/easy-jim/", date: "", description: "April 3 & 4, 2026" },
  { name: "Mountainfilm", url: "https://www.telluride.com/event/mountainfilm/", date: "", description: "May 21 - 25, 2026" },
  { name: "Telluride Balloon Festival", url: "https://www.telluride.com/event/telluride-balloon-festival/", date: "", description: "June 5 - 7, 2026" },
  { name: "Huck Finn & Becky Thatcher Day", url: "https://www.telluride.com/event/huck-finn-becky-thatcher-day/", date: "", description: "June 6, 2026" },
  { name: "Telluride Food + Vine", url: "https://www.telluride.com/event/telluride-food-vine/", date: "", description: "June 11 - 14, 2026" },
  { name: "Telluride Bluegrass Festival", url: "https://www.telluride.com/event/telluride-bluegrass-festival/", date: "", description: "June 18 - 21, 2026" },
  { name: "Telluride Yoga Festival", url: "https://www.telluride.com/event/telluride-yoga-festival/", date: "", description: "June 25 - 28, 2026" },
  { name: "Telluride Plein Air", url: "https://www.telluride.com/event/telluride-plein-air/", date: "", description: "June 29 - July 5, 2026" },
  { name: "Red, White & Blues", url: "https://www.telluride.com/event/red-white-and-blues/", date: "", description: "July 3 & 4, 2026" },
  { name: "Telluride Fourth of July Parade", url: "https://www.telluride.com/event/telluride-4th-of-july-parade/", date: "", description: "July 4, 2026" },
  { name: "Hardrock Hundred Endurance Run", url: "https://www.telluride.com/event/hardrock-100/", date: "", description: "July 10, 2026" },
  { name: "Telluride Table", url: "https://www.telluride.com/event/telluride-table/", date: "", description: "July 10 - 12, 2026" },
  { name: "Telluride Americana Music Festival", url: "https://www.telluride.com/event/telluride-americana-music-festival/", date: "", description: "July 17 - 18, 2026" },
  { name: "Telluride Reserve", url: "https://www.telluride.com/event/telluride-reserve/", date: "", description: "July 30 - Aug 1, 2026" },
  { name: "Telluride Mushroom Festival", url: "https://www.telluride.com/event/telluride-mushroom-festival/", date: "", description: "Aug 12 - 16, 2026" },
  { name: "Telluride Blues & Brews Festival", url: "https://www.telluride.com/event/telluride-blues-brews-festival/", date: "", description: "Sept 18 - 20, 2026" },
  { name: "Telluride Horror Show", url: "https://www.telluride.com/event/telluride-horror-show/", date: "", description: "Oct 16 - 18, 2026" },
];

// Process and format events
const processedEvents = extractedEvents
  .map((event, index) => {
    const parsedDate = parseDate(event.description);
    if (!parsedDate) return null; // Skip events without valid dates
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const eventDate = new Date(parsedDate);
    
    // Only include future events
    if (eventDate < today) return null;
    
    return {
      id: (index + 1).toString(),
      name: event.name,
      date: parsedDate,
      type: determineType(event.name, event.description),
      description: event.description || event.fullText?.substring(0, 150) || '',
      url: event.url
    };
  })
  .filter(Boolean)
  .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

console.log(JSON.stringify(processedEvents, null, 2));
console.log(`\nTotal events: ${processedEvents.length}`);

