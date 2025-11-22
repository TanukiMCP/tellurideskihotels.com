/**
 * Events Widget
 * Upcoming events in Telluride
 * Redesigned with cleaner layout and refined styling
 */

import React, { useState, useEffect } from 'react';

interface Event {
  id: string;
  name: string;
  date: string;
  type: 'festival' | 'concert' | 'sports' | 'art' | 'community';
  description: string;
  url: string; // Link to full event details on official Telluride site
}

// Telluride Events - Extracted from official Telluride events page
// Past events are automatically filtered out based on current date
// Widget shows 5 events on desktop, 3 on mobile
const TELLURIDE_EVENTS: Event[] = [
  {
    id: '1',
    name: 'Turkey Trot',
    date: '2025-11-27',
    type: 'sports',
    description: 'Join San Miguel County for the annual family holiday tradition, the Turkey Trot 5K Fun Run/Walk. Admission is free.',
    url: 'https://www.telluride.com/event/san-miguel-county-turkey-trot/',
  },
  {
    id: '2',
    name: 'Thanksgiving Buffet at The View',
    date: '2025-11-27',
    type: 'community',
    description: 'Celebrate Thanksgiving at The View at Mountain Lodge Telluride with a chef-carved buffet featuring delicious harvest favorites.',
    url: 'https://www.telluride.com/event/thanksgiving-buffet-at-the-view/',
  },
  {
    id: '3',
    name: 'Thanksgiving Feast at Madeline Hotel & Residences',
    date: '2025-11-27',
    type: 'community',
    description: 'Gather with family and friends for The Madeline\'s annual Thanksgiving Dinner, curated by the Madeline Hotel and Residences.',
    url: 'https://www.telluride.com/event/thanksgiving-feast-at-madeline-hotel-residences/',
  },
  {
    id: '4',
    name: 'Sno-ciety',
    date: '2025-11-28',
    type: 'festival',
    description: 'The Sheridan Arts Foundation presents Warren Miller\'s film, Sno-ciety, on Friday, November 28th. Doors open 30 minutes before showtime.',
    url: 'https://www.telluride.com/event/sno-ciety/',
  },
  {
    id: '5',
    name: 'Electric Love',
    date: '2025-11-29',
    type: 'concert',
    description: 'Electric Love is a House Music Experience. The DJs for this event will be YAK, BRX and MVE. Celebration of Movement and Music.',
    url: 'https://www.telluride.com/event/electric-love-1/',
  },
  {
    id: '6',
    name: 'Hugh Phillips',
    date: '2025-12-04',
    type: 'concert',
    description: 'Join SSM/SKM Nashville recording artist Hugh Phillips for a boot-scootin\', honky tonk good time.',
    url: 'https://www.telluride.com/event/hugh-phillips/',
  },
  {
    id: '7',
    name: 'Mountain Sprouts Preschool Holiday Fundraiser',
    date: '2025-12-04',
    type: 'community',
    description: 'Join Mountain Sprouts Preschool for a Silent Auction Fundraiser! Mark your calendar for December 4th.',
    url: 'https://www.telluride.com/event/mountain-sprouts-preschool-holiday-fundraiser/',
  },
  {
    id: '8',
    name: 'Telluride Nordic Season Kick-Off',
    date: '2025-12-04',
    type: 'sports',
    description: 'Join Telluride Nordic and help kick off the nordic ski season! Drinks and appetizers will be available.',
    url: 'https://www.telluride.com/event/telluride-nordic-season-kick-off/',
  },
  {
    id: '9',
    name: 'Moontour',
    date: '2025-12-05',
    type: 'concert',
    description: 'Moontour is an Alternative/Indie Rock band based in Flagstaff, AZ. Originally formed by lead singer Blake Comstock.',
    url: 'https://www.telluride.com/event/moontour/',
  },
  {
    id: '10',
    name: 'Telluride Arts Holiday Bazaar',
    date: '2025-12-05',
    type: 'art',
    description: 'Shop locally made, artisan crafted goods at the annual Holiday Art Bazaar. A local tradition since 1983.',
    url: 'https://www.telluride.com/event/holiday-arts-bazaar/',
  },
  {
    id: '11',
    name: 'Beetlejuice Jr.',
    date: '2025-12-05',
    type: 'art',
    description: 'The Sheridan Arts Foundation Young People\'s Theater presents the middle school production of Beetlejuice JR.',
    url: 'https://www.telluride.com/event/beetlejuice-jr/',
  },
  {
    id: '12',
    name: 'TAB World AIDS Day Dance Party',
    date: '2025-12-05',
    type: 'art',
    description: 'Join TAB for World AIDS Day and dance the night away! Come wearing your favorite Free Box Fashion.',
    url: 'https://www.telluride.com/event/tab-world-aids-day-dance-party/',
  },
  {
    id: '13',
    name: 'Telluride Ski Resort Opening Day 2025',
    date: '2025-12-06',
    type: 'sports',
    description: 'Telluride Ski Resort is scheduled to open on Saturday, December 6. Join us for opening weekend with plenty to do.',
    url: 'https://www.telluride.com/event/telluride-ski-resort-opening-day/',
  },
  {
    id: '14',
    name: 'Safety Meeting',
    date: '2025-12-06',
    type: 'concert',
    description: 'Safety Meeting is a psychedelic fusion band rooted in the vibrant music scene of Durango, Colorado.',
    url: 'https://www.telluride.com/event/safety-meeting/',
  },
  {
    id: '15',
    name: 'Noel Night',
    date: '2025-12-10',
    type: 'community',
    description: 'Noel Night marks the beginning of the holiday season with the lighting of the ceremonial Ski Tree, and shopping at local stores.',
    url: 'https://www.telluride.com/event/noel-night/',
  },
  {
    id: '16',
    name: 'Noel Night Photos With Santa',
    date: '2025-12-10',
    type: 'community',
    description: 'Join Alpine Bank for photos with Santa on Noel Night, prior to the Ski Tree lighting! There will be cookies, hot cider and more.',
    url: 'https://www.telluride.com/event/noel-night-photos-with-santa/',
  },
  {
    id: '17',
    name: 'Alice\'s Wonderland',
    date: '2025-12-13',
    type: 'art',
    description: 'Join Palm Arts Dance for the timeless story of Alice as she tumbles down a rabbit hole into a whimsical world filled with wonder.',
    url: 'https://www.telluride.com/event/alices-wonderland/',
  },
  {
    id: '18',
    name: 'Mountain Village Holiday Prelude',
    date: '2025-12-13',
    type: 'festival',
    description: 'Mountain Village is being transformed once again into the North Pole for this year\'s Holiday Prelude celebration.',
    url: 'https://www.telluride.com/event/mountain-village-holiday-prelude/',
  },
  {
    id: '19',
    name: 'Chanukah in Telluride',
    date: '2025-12-18',
    type: 'community',
    description: 'Celebrate the Festival of Lights in Telluride at Chabad\'s 4th Annual Menorah Lighting and Chanukah Celebration.',
    url: 'https://www.telluride.com/event/chanukah-in-telluride/',
  },
  {
    id: '20',
    name: 'Cassidy',
    date: '2025-12-18',
    type: 'art',
    description: 'Welcome to the Wild West! Butch Cassidy\'s legendary 1889 Telluride Bank heist re-told in an original Telluride Theatre production.',
    url: 'https://www.telluride.com/event/cassidy/',
  },
  {
    id: '21',
    name: 'Pixie and the Partygrass Boys',
    date: '2025-12-19',
    type: 'concert',
    description: 'Hailed as "the hottest band in the Wasatch" by the Intermountain Acoustic Music Association, Pixie and The Partygrass Boys.',
    url: 'https://www.telluride.com/event/pixie-and-the-partygrass-boys/',
  },
  {
    id: '22',
    name: 'Alpine Chapel Christmas Eve Services',
    date: '2025-12-24',
    type: 'community',
    description: 'Join Alpine Chapel for Christmas Eve Services at the Michael D. Palm Theatre.',
    url: 'https://www.telluride.com/event/alpine-chapel-christmas-eve-services/',
  },
  {
    id: '23',
    name: 'Christmas Eve Torchlight Parade',
    date: '2025-12-24',
    type: 'community',
    description: 'The Christmas Eve Torchlight Parade will start at the top of the Gondola and head down into the Town of Telluride.',
    url: 'https://www.telluride.com/event/christmas-eve-torchlight-parade/',
  },
  {
    id: '24',
    name: 'Sheridan Arts Foundation Holiday Concert Series',
    date: '2025-12-26',
    type: 'concert',
    description: 'Join the Sheridan Arts Foundation for five nights of world-class entertainment at the historic Sheridan Opera House.',
    url: 'https://www.telluride.com/event/sheridan-arts-foundation-holiday-concert-series/',
  },
  {
    id: '25',
    name: 'Tease the Season: A Holiday Burlesque',
    date: '2025-12-26',
    type: 'art',
    description: 'Join the Telluride Theatre at the Sheridan Opera House for Tease the Season, a Holiday Burlesque. It\'s a special night of entertainment.',
    url: 'https://www.telluride.com/event/tease-the-season-a-holiday-burlesque/',
  },
  {
    id: '26',
    name: 'Jane Monheit',
    date: '2025-12-28',
    type: 'concert',
    description: 'Catapulted to stardom at age 20 for her immense musical talent, Jane has spent the last two decades touring the globe.',
    url: 'https://www.telluride.com/event/jane-monheit/',
  },
  {
    id: '27',
    name: 'Yesterday',
    date: '2025-12-29',
    type: 'concert',
    description: 'Performing the Beatles since 2000, Yesterday-A Tribute to The Beatles founded by Don Bellezzo, tours not only in the US but internationally.',
    url: 'https://www.telluride.com/event/yesterday/',
  },
  {
    id: '28',
    name: 'Larkin Poe',
    date: '2025-12-31',
    type: 'concert',
    description: 'Ring in 2026 with The Rock N\' Revel Gala—a night of fiery rock and roll featuring the GRAMMY®-nominated blues-rock duo Larkin Poe.',
    url: 'https://www.telluride.com/event/larkin-poe/',
  },
  {
    id: '29',
    name: 'New Year\'s Eve Torchlight Parade & Fireworks',
    date: '2025-12-31',
    type: 'community',
    description: 'Watch as Telluride Ski and Snowboard School instructors meander down the mountain with torches to light up the night sky.',
    url: 'https://www.telluride.com/event/new-years-eve-torchlight-parade-fireworks/',
  },
  {
    id: '30',
    name: 'Telluride Foundation\'s Volunteer of the Year Celebration',
    date: '2026-01-08',
    type: 'community',
    description: 'Please join the Telluride Foundation in celebrating the life and legacy of Barbara Hinterkopf, the 2025 Volunteer of the Year.',
    url: 'https://www.telluride.com/event/telluride-foundations-volunteer-of-the-year-celebration/',
  },
  {
    id: '31',
    name: 'Neal Francis',
    date: '2026-01-08',
    type: 'concert',
    description: 'The latest album from Neal Francis, Return To Zero, emerged from the kind of visionary fever dream that only the most creative minds can conjure.',
    url: 'https://www.telluride.com/event/neal-francis/',
  },
  {
    id: '32',
    name: 'The Motet',
    date: '2026-01-09',
    type: 'concert',
    description: 'After 26 years, nine albums, and over a thousand shows, The Motet embark on another chapter galvanized in equal measure by innovation and tradition.',
    url: 'https://www.telluride.com/event/the-motet/',
  },
  {
    id: '33',
    name: 'Kitchen Dwellers',
    date: '2026-01-15',
    type: 'concert',
    description: 'In Dante\'s Inferno, the author grapples with sin, its various manifestations, and its consequences. This time Kitchen Dwellers explore similar themes through music.',
    url: 'https://www.telluride.com/event/kitchen-dwellers/',
  },
  {
    id: '34',
    name: 'Late Night Radio',
    date: '2026-01-17',
    type: 'concert',
    description: 'Colorado-based electronic music producer Late Night Radio introduces his latest album, Pocket Full of Dreams.',
    url: 'https://www.telluride.com/event/late-night-radio/',
  },
  {
    id: '35',
    name: 'Ridgeliners',
    date: '2026-01-18',
    type: 'concert',
    description: 'The Ridgeliners project was formed over a bottle of whiskey during a late night writing session between Justin Bradford and friends.',
    url: 'https://www.telluride.com/event/ridgeliners/',
  },
  {
    id: '36',
    name: 'Jason Leech w/Future Joy and Michael Wilbur of Moon Hooch',
    date: '2026-01-18',
    type: 'concert',
    description: 'The Sheridan Arts Foundation presents Jason Leech w/ Future Joy and Michael Wilbur of Moon Hooch Live in Concert at the historic Sheridan Opera House.',
    url: 'https://www.telluride.com/event/jason-leech-w-future-joy-and-michael-wilbur-of-moon-hooch/',
  },
  {
    id: '37',
    name: 'YOPE',
    date: '2026-01-22',
    type: 'concert',
    description: 'Formed out of the open mic scene in Durango CO, Yope is an eccentric genre blending funk-rock-jam fusion band who keeps audiences on their feet.',
    url: 'https://www.telluride.com/event/yope/',
  },
  {
    id: '38',
    name: 'Drew Emmitt, John Cowan and Eli Emmitt',
    date: '2026-01-22',
    type: 'concert',
    description: 'Born in Nashville, Drew Emmitt founder of the jam band Leftover Salmon moved to Boulder, CO, in 1973 and entered the bluegrass scene.',
    url: 'https://www.telluride.com/event/drew-emmitt-john-cowan-and-eli-emmitt/',
  },
  {
    id: '39',
    name: 'Andy Frasco & The U.N.',
    date: '2026-01-23',
    type: 'concert',
    description: 'With curly tufts of a recognizable Jewfro peeking out from his omnipresent knit cap, Andy Frasco is a cross between a rock star and a comedian.',
    url: 'https://www.telluride.com/event/andy-frasco-the-u.n/',
  },
  {
    id: '40',
    name: 'Harlem Quartet',
    date: '2026-01-24',
    type: 'art',
    description: 'Grammy-winning Harlem Quartet, featuring Ilmar Gavilán, Melissa White, Jaime Amador, and Felix Umansky, has earned international acclaim.',
    url: 'https://www.telluride.com/event/harlem-quartet/',
  },
  {
    id: '41',
    name: 'Pressure Drop',
    date: '2026-01-29',
    type: 'festival',
    description: 'The Sheridan Arts Foundation presents Teton Gravity Research\'s film, Pressure Drop, on Thursday, January 29th. Doors open 30 minutes before showtime.',
    url: 'https://www.telluride.com/event/pressure-drop/',
  },
  {
    id: '42',
    name: 'Cousin Curtiss',
    date: '2026-01-30',
    type: 'concert',
    description: 'Cousin Curtiss brings to the stage a fiery dynamic rarely seen by a solo act and now partnered up with equally talented musicians.',
    url: 'https://www.telluride.com/event/cousin-curtiss/',
  },
  {
    id: '43',
    name: 'The Last Class With Robert Reich',
    date: '2026-01-30',
    type: 'festival',
    description: 'The Sheridan Arts Foundation presents Robert Reich Doc\'s "The Last Class" film on Friday, January 30th. Doors open 30 minutes before showtime.',
    url: 'https://www.telluride.com/event/the-last-class-with-robert-reich/',
  },
  {
    id: '44',
    name: 'Emily Scott Robinson',
    date: '2026-01-31',
    type: 'concert',
    description: 'Come celebrate the release of Emily Scott Robinson\'s 5th album at this concert, which is an album release party!',
    url: 'https://www.telluride.com/event/emily-scott-robinson/',
  },
  {
    id: '45',
    name: 'May Erlewine',
    date: '2026-02-03',
    type: 'concert',
    description: 'May Erlewine has dedicated her life to writing songs for the human heart\'s existence. These songs have the relentless power to heal and inspire.',
    url: 'https://www.telluride.com/event/may-erlewine/',
  },
  {
    id: '46',
    name: 'Discognition',
    date: '2026-02-05',
    type: 'concert',
    description: 'Discognition captivates listeners with a distinctive blend of lush, dramatic dance music, seamlessly bridging the gap between electronic and live instrumentation.',
    url: 'https://www.telluride.com/event/discognition/',
  },
  {
    id: '47',
    name: 'Guys and Dolls',
    date: '2026-02-06',
    type: 'art',
    description: 'The Sheridan Arts Foundation Young People\'s Theater presents the high school production of Guys and Dolls at the historic Sheridan Opera House.',
    url: 'https://www.telluride.com/event/guys-and-dolls/',
  },
  {
    id: '48',
    name: 'Briscoe',
    date: '2026-02-06',
    type: 'concert',
    description: 'If Briscoe\'s debut album was a coming-of-age soundtrack set against the backdrop of the Texas Hill Country, then its follow-up explores new territory.',
    url: 'https://www.telluride.com/event/briscoe/',
  },
  {
    id: '49',
    name: 'Telluride Comedy Festival',
    date: '2026-02-12',
    type: 'festival',
    description: 'The Sheridan Arts Foundation and Jeb Berrier present the 25th annual Telluride Comedy Festival at the historic Sheridan Opera House.',
    url: 'https://www.telluride.com/event/telluride-comedy-festival/',
  },
  {
    id: '50',
    name: 'TAB Student Fashion Show',
    date: '2026-02-19',
    type: 'art',
    description: 'Prepare to be amazed by the heart of TAB\'s impact: the annual TAB Student Fashion Show! This dynamic event showcases student creativity.',
    url: 'https://www.telluride.com/event/tab-student-fashion-show/',
  },
  {
    id: '51',
    name: 'Western Medicine',
    date: '2026-02-19',
    type: 'concert',
    description: 'Swinging from powerful harmonies and distortion to acoustic guitars, brushes and tender lap steel melodies, LA-based Western Medicine delivers.',
    url: 'https://www.telluride.com/event/western-medicine/',
  },
  {
    id: '52',
    name: 'The Infamous Stringdusters',
    date: '2026-02-19',
    type: 'concert',
    description: 'The Infamous Stringdusters will be taking over the Sheridan Opera House stage for three incredible evenings of bluegrass and Americana.',
    url: 'https://www.telluride.com/event/the-infamous-stringdusters/',
  },
  {
    id: '53',
    name: 'Black Pistol Fire',
    date: '2026-02-25',
    type: 'concert',
    description: 'The Sheridan Arts Foundation presents Black Pistol Fire Live in Concert at the historic Sheridan Opera House.',
    url: 'https://www.telluride.com/event/black-pistol-fire/',
  },
  {
    id: '54',
    name: 'The Brothers Comatose',
    date: '2026-02-26',
    type: 'concert',
    description: 'Fusing old school string band instrumentation with rock and roll exuberance, The Brothers Comatose cement their status as modern bluegrass pioneers.',
    url: 'https://www.telluride.com/event/the-brothers-comatose/',
  },
  {
    id: '55',
    name: 'TAB Fashion Show',
    date: '2026-02-26',
    type: 'art',
    description: 'The TAB Annual Fashion Show is a show as unique as Telluride itself. It is not your average fashion show — the event celebrates creativity and community.',
    url: 'https://www.telluride.com/event/tab-fashion-show/',
  },
  {
    id: '56',
    name: 'Telluride Gay Ski Week',
    date: '2026-02-28',
    type: 'festival',
    description: 'Telluride Gay Ski Week was originally founded in 2002. Since then, it has been a week to look forward to for the LGBTQ+ community and allies.',
    url: 'https://www.telluride.com/event/telluride-gay-ski-week/',
  },
  {
    id: '57',
    name: 'Birds of Play',
    date: '2026-03-04',
    type: 'concert',
    description: 'Birds of Play is an Americana Roots quartet based in the San Juan Mountains of Southwestern Colorado. Their distinct sound blends folk, bluegrass, and indie.',
    url: 'https://www.telluride.com/event/birds-of-play/',
  },
  {
    id: '58',
    name: 'The Polish Ambassador',
    date: '2026-03-07',
    type: 'concert',
    description: 'Musician. Producer. Beatsmith. Recording artist. Composer. Dance-floor general. Label-head. A mystery man of many hats, The Polish Ambassador delivers.',
    url: 'https://www.telluride.com/event/the-polish-ambassador/',
  },
  {
    id: '59',
    name: 'Big Something',
    date: '2026-03-12',
    type: 'concert',
    description: 'Hailing from the North Carolina countryside, or "The Middle of Nowhere," as it\'s proudly dubbed on their debut album, Big Something brings the energy.',
    url: 'https://www.telluride.com/event/big-something/',
  },
  {
    id: '60',
    name: 'ZOSO',
    date: '2026-03-14',
    type: 'concert',
    description: 'Celebrating their 30th anniversary in 2025, Zoso has become one of the most iconic and respected Led Zeppelin tribute bands in the world.',
    url: 'https://www.telluride.com/event/zoso/',
  },
  {
    id: '61',
    name: 'Grieves',
    date: '2026-03-15',
    type: 'concert',
    description: 'With two decades of experience in the music industry, Seattle\'s own Grieves has sculpted a remarkable path as an independent artist.',
    url: 'https://www.telluride.com/event/grieves/',
  },
  {
    id: '62',
    name: 'Galvin Cello Quartet',
    date: '2026-03-19',
    type: 'art',
    description: 'Praised as a quartet whose "cellists are brilliant instrumentalists and thoughtful musicians individually, but their collective sound is transcendent.',
    url: 'https://www.telluride.com/event/galvin-cello-quartet/',
  },
  {
    id: '63',
    name: 'Mountainfilm',
    date: '2026-05-21',
    type: 'festival',
    description: 'Mountainfilm is a documentary film festival that showcases nonfiction stories about environmental, cultural, climbing, and adventure themes.',
    url: 'https://www.telluride.com/event/mountainfilm/',
  },
  {
    id: '64',
    name: 'Telluride Balloon Festival',
    date: '2026-06-05',
    type: 'festival',
    description: 'Get high at the Telluride Balloon Festival! Weather permitting, watch hot air balloons lift off from Telluride Town Park.',
    url: 'https://www.telluride.com/event/telluride-balloon-festival/',
  },
  {
    id: '65',
    name: 'Huck Finn & Becky Thatcher Day',
    date: '2026-06-06',
    type: 'community',
    description: 'Join the Telluride Elks for a Telluride tradition: Huck Finn and Becky Thatcher Day! On Saturday, June 6, kids 10 and under can participate.',
    url: 'https://www.telluride.com/event/huck-finn-becky-thatcher-day/',
  },
  {
    id: '66',
    name: 'Telluride Food + Vine',
    date: '2026-06-11',
    type: 'festival',
    description: 'Telluride Food + Vine is the area\'s premier food and wine weekend, providing the ultimate epicurean experience in the mountains.',
    url: 'https://www.telluride.com/event/telluride-food-vine/',
  },
  {
    id: '67',
    name: 'Telluride Bluegrass Festival',
    date: '2026-06-18',
    type: 'festival',
    description: 'Every June, Festivarians make the annual pilgrimage to Telluride for the Telluride Bluegrass Festival. Nestled in the box canyon, it\'s a magical experience.',
    url: 'https://www.telluride.com/event/telluride-bluegrass-festival/',
  },
  {
    id: '68',
    name: 'Telluride Yoga Festival',
    date: '2026-06-25',
    type: 'festival',
    description: 'The longest running yoga festival in the country, the Telluride Yoga Festival is a four-day yoga and wellness gathering in the mountains.',
    url: 'https://www.telluride.com/event/telluride-yoga-festival/',
  },
  {
    id: '69',
    name: 'Telluride Plein Air',
    date: '2026-06-29',
    type: 'art',
    description: 'The Telluride Plein Air Festival is an essential fundraiser for the Sheridan Arts Foundation, a 501 (c) (3) nonprofit organization.',
    url: 'https://www.telluride.com/event/telluride-plein-air/',
  },
  {
    id: '70',
    name: 'Red, White & Blues',
    date: '2026-07-03',
    type: 'festival',
    description: 'Celebrate the Fourth of July with the whole family this year at Mountain Village\'s Red, White & Blues celebration.',
    url: 'https://www.telluride.com/event/red-white-and-blues/',
  },
  {
    id: '71',
    name: 'Telluride Fourth of July Parade',
    date: '2026-07-04',
    type: 'community',
    description: 'The Telluride 4th of July Parade is the longest running event in the Town\'s history. The parade celebrates our community and independence.',
    url: 'https://www.telluride.com/event/telluride-4th-of-july-parade/',
  },
  {
    id: '72',
    name: 'Hardrock Hundred Endurance Run',
    date: '2026-07-10',
    type: 'sports',
    description: 'The Hardrock Hundred Mile Endurance Run is an ultramarathon of 102.5 miles in length, plus 33,197 feet of climb and descent.',
    url: 'https://www.telluride.com/event/hardrock-100/',
  },
];

export function EventsWidget() {
  // Detect screen size to show different number of events
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsDesktop(window.innerWidth >= 1024); // lg breakpoint
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Automatically filter for upcoming events only, sort by date
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const allUpcomingEvents = [...TELLURIDE_EVENTS]
    .filter(event => new Date(event.date) >= today)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  // Show 5 on desktop, 3 on mobile
  const upcomingEvents = allUpcomingEvents.slice(0, isDesktop ? 5 : 3);

  const getMonthDay = (dateStr: string) => {
    const date = new Date(dateStr);
    return {
      month: date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
      day: date.getDate().toString()
    };
  };

  return (
    <article className="bg-white rounded-2xl p-8 border border-[#E8E8E8] shadow-[0_4px_20px_rgba(0,0,0,0.08)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)] hover:-translate-y-1 transition-all duration-200 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-14 h-14 rounded-xl bg-[#E8F2ED] flex items-center justify-center flex-shrink-0">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <div>
          <h3 className="text-2xl font-bold text-[#2C2C2C] mb-1">Upcoming Events</h3>
          <p className="text-sm font-medium text-[#666]">Festivals & Activities</p>
        </div>
      </div>

      {/* Events List - Shows next 2-3 upcoming events with proper hover states */}
      <div className="space-y-4 flex-1 mb-6">
        {upcomingEvents.length > 0 ? (
          upcomingEvents.map((event) => {
            const { month, day } = getMonthDay(event.date);
            return (
              <a
                key={event.id}
                href={event.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-start gap-4 p-4 bg-transparent rounded-lg hover:bg-[#F8F9F8] transition-all duration-150 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#2D5F4F] focus:ring-offset-2"
              >
                {/* Date Badge - Fixed border */}
                <div className="flex-shrink-0 w-16 h-16 rounded-xl bg-[#E8F2ED] border border-[#2D5F4F] flex flex-col items-center justify-center">
                  <div className="text-xs font-semibold text-[#2D5F4F] tracking-wide uppercase" style={{ letterSpacing: '0.5px' }}>
                    {month}
                  </div>
                  <div className="text-2xl font-bold text-[#2D5F4F] leading-none mt-0.5">
                    {day}
                  </div>
                </div>

                {/* Event Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h4 className="text-base font-semibold text-[#2C2C2C] group-hover:text-[#2D5F4F] transition-colors">
                      {event.name}
                    </h4>
                    {/* Chevron - Fixed color and alignment */}
                    <svg 
                      className="w-4 h-4 text-[#999] group-hover:text-[#2D5F4F] transition-all duration-150 flex-shrink-0 mt-0.5 group-hover:translate-x-0.5" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24" 
                      strokeWidth="2"
                      style={{ minWidth: '16px' }}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                  {/* Description with proper line-clamp */}
                  <p className="text-sm text-[#666] leading-relaxed" style={{
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {event.description}
                  </p>
                </div>
              </a>
            );
          })
        ) : (
          <div className="text-center py-8 text-[#666]">
            <p className="text-sm font-medium">Check back soon for upcoming events!</p>
          </div>
        )}
      </div>

      {/* View All Button - Fixed alignment */}
      <div className="mt-auto">
        <a
          href="https://www.telluride.com/festivals-events/events/"
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full text-center border-2 border-[#2D5F4F] bg-transparent text-[#2D5F4F] px-6 py-3.5 rounded-lg font-semibold text-[15px] hover:bg-[#2D5F4F] hover:text-white transition-all duration-200 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-[#2D5F4F] focus:ring-offset-2 cursor-pointer"
        >
          <span>View All Events</span>
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </a>
      </div>
    </article>
  );
}
