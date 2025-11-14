/**
 * Events Widget
 * Upcoming events in Telluride
 */

interface Event {
  id: string;
  name: string;
  date: string;
  type: 'festival' | 'concert' | 'sports' | 'art' | 'community';
  description: string;
  url: string; // Link to full event details on official Telluride site
}

// Telluride Events Hopper - Add new events here as they're announced
// Past events are automatically filtered out based on current date
// Widget always shows the next 4 upcoming events
// Last updated: November 14, 2025
const TELLURIDE_EVENTS: Event[] = [
  {
    id: '1',
    name: 'Peter and the Starcatcher',
    date: '2025-11-14',
    type: 'art',
    description: 'An apprentice Starcatcher and an orphan boy take to the high seas in this whimsical origin story',
    url: 'https://www.telluride.com/event/peter-and-the-starcatcher/',
  },
  {
    id: '2',
    name: 'The War and Treaty',
    date: '2025-11-15',
    type: 'concert',
    description: 'Founded by husband-and-wife duo Michael and Tanya Trotter, The War And Treaty has emerged as one of the most powerful voices',
    url: 'https://www.telluride.com/event/the-war-and-treaty/',
  },
  {
    id: '3',
    name: 'Mountainfilm for Locals: Seasons of Stoke',
    date: '2025-11-19',
    type: 'festival',
    description: 'Free community screening at the Sheridan Opera House at 5:30 PM',
    url: 'https://www.telluride.com/event/mountainfilm-for-locals-seasons-of-stoke/',
  },
  {
    id: '4',
    name: 'After the Snowfall',
    date: '2025-11-21',
    type: 'festival',
    description: 'The Sheridan Arts Foundation presents Matchstick\'s film. Doors open 30 minutes before showtime',
    url: 'https://www.telluride.com/event/after-the-snowfall/',
  },
  {
    id: '5',
    name: 'Gondola Re-Opens for Winter Season',
    date: '2025-11-21',
    type: 'community',
    description: 'The gondola reopens at 6:30 AM on November 21 for the winter season',
    url: 'https://www.telluride.com/event/gondola-reopens-for-the-season/',
  },
  {
    id: '6',
    name: 'Turkey Trot',
    date: '2025-11-27',
    type: 'sports',
    description: 'Annual family holiday tradition, the Turkey Trot 5K Fun Run/Walk. Admission is free',
    url: 'https://www.telluride.com/event/san-miguel-county-turkey-trot/',
  },
  {
    id: '7',
    name: 'Thanksgiving Feast at Madeline Hotel',
    date: '2025-11-27',
    type: 'community',
    description: 'Gather with family and friends for The Madeline\'s annual Thanksgiving Dinner',
    url: 'https://www.telluride.com/event/thanksgiving-feast-at-madeline-hotel-residences/',
  },
  {
    id: '8',
    name: 'Thanksgiving Buffet at The View',
    date: '2025-11-27',
    type: 'community',
    description: 'Celebrate Thanksgiving at The View at Mountain Lodge Telluride with a chef-carved buffet',
    url: 'https://www.telluride.com/event/thanksgiving-buffet-at-the-view/',
  },
  {
    id: '9',
    name: 'Sno-ciety',
    date: '2025-11-28',
    type: 'festival',
    description: 'The Sheridan Arts Foundation presents Warren Miller\'s film. Doors open 30 minutes before showtime',
    url: 'https://www.telluride.com/event/sno-ciety/',
  },
  {
    id: '10',
    name: 'Mountain Sprouts Preschool Holiday Fundraiser',
    date: '2025-12-04',
    type: 'community',
    description: 'Silent Auction Fundraiser! Mark your calendar for December 4th',
    url: 'https://www.telluride.com/event/mountain-sprouts-preschool-holiday-fundraiser/',
  },
  {
    id: '11',
    name: 'Telluride Nordic Season Kick-Off',
    date: '2025-12-04',
    type: 'sports',
    description: 'Join Telluride Nordic and help kick off the nordic ski season! Drinks and appetizers available',
    url: 'https://www.telluride.com/event/telluride-nordic-season-kick-off/',
  },
  {
    id: '12',
    name: 'Hugh Phillips',
    date: '2025-12-04',
    type: 'concert',
    description: 'SSM/SKM Nashville recording artist for a boot-scootin\', honky tonk good time',
    url: 'https://www.telluride.com/event/hugh-phillips/',
  },
  {
    id: '13',
    name: 'Telluride Arts Holiday Bazaar',
    date: '2025-12-05',
    type: 'art',
    description: 'Shop locally made, artisan crafted goods. A local tradition since 1983',
    url: 'https://www.telluride.com/event/holiday-arts-bazaar/',
  },
  {
    id: '14',
    name: 'Beetlejuice Jr.',
    date: '2025-12-05',
    type: 'art',
    description: 'Young People\'s Theater presents the middle school production of Beetlejuice JR',
    url: 'https://www.telluride.com/event/beetlejuice-jr/',
  },
  {
    id: '15',
    name: 'Moontour',
    date: '2025-12-05',
    type: 'concert',
    description: 'Alternative/Indie Rock band based in Flagstaff, AZ',
    url: 'https://www.telluride.com/event/moontour/',
  },
  {
    id: '16',
    name: 'Safety Meeting',
    date: '2025-12-06',
    type: 'concert',
    description: 'Psychedelic fusion band rooted in the vibrant music scene of Durango, Colorado',
    url: 'https://www.telluride.com/event/safety-meeting/',
  },
  {
    id: '17',
    name: 'Telluride Ski Resort Opening Day',
    date: '2025-12-06',
    type: 'sports',
    description: 'Telluride Ski Resort opens! Join us for opening weekend with plenty to do on and off the mountain',
    url: 'https://www.telluride.com/event/telluride-ski-resort-opening-day-2025/',
  },
  {
    id: '18',
    name: 'Noel Night',
    date: '2025-12-10',
    type: 'festival',
    description: 'Beginning of the holiday season with the lighting of the ceremonial Ski Tree',
    url: 'https://www.telluride.com/event/noel-night/',
  },
  {
    id: '19',
    name: 'Noel Night Photos With Santa',
    date: '2025-12-10',
    type: 'community',
    description: 'Join Alpine Bank for photos with Santa on Noel Night! Cookies, hot cider and more',
    url: 'https://www.telluride.com/event/noel-night-photos-with-santa/',
  },
  {
    id: '20',
    name: 'Alice\'s Wonderland',
    date: '2025-12-13',
    type: 'art',
    description: 'Join Palm Arts Dance for the timeless story of Alice as she tumbles down a rabbit hole',
    url: 'https://www.telluride.com/event/alices-wonderland/',
  },
  {
    id: '21',
    name: 'Mountain Village Holiday Prelude',
    date: '2025-12-13',
    type: 'festival',
    description: 'Mountain Village transforms into the North Pole for this year\'s Holiday Prelude celebration',
    url: 'https://www.telluride.com/event/mountain-village-holiday-prelude/',
  },
  {
    id: '22',
    name: 'Cassidy',
    date: '2025-12-18',
    type: 'art',
    description: 'Butch Cassidy\'s legendary 1889 Telluride Bank heist re-told in an original Telluride Theatre production',
    url: 'https://www.telluride.com/event/cassidy/',
  },
  {
    id: '23',
    name: 'Pixie and the Partygrass Boys',
    date: '2025-12-19',
    type: 'concert',
    description: 'Hailed as "the hottest band in the Wasatch" by the Intermountain Acoustic Music Association',
    url: 'https://www.telluride.com/event/pixie-and-the-partygrass-boys/',
  },
  {
    id: '24',
    name: 'Alpine Chapel Christmas Eve Services',
    date: '2025-12-24',
    type: 'community',
    description: 'Join Alpine Chapel for Christmas Eve Services at the Michael D. Palm Theatre',
    url: 'https://www.telluride.com/event/alpine-chapel-christmas-eve-services/',
  },
  {
    id: '25',
    name: 'Christmas Eve Torchlight Parade',
    date: '2025-12-24',
    type: 'festival',
    description: 'The Christmas Eve Torchlight Parade will start at the top of the Gondola and head down into Telluride',
    url: 'https://www.telluride.com/event/christmas-eve-torchlight-parade/',
  },
  {
    id: '26',
    name: 'Tease the Season: A Holiday Burlesque',
    date: '2025-12-26',
    type: 'art',
    description: 'Join the Telluride Theatre at the Sheridan Opera House for a special night of burlesque',
    url: 'https://www.telluride.com/event/tease-the-season-a-holiday-burlesque/',
  },
  {
    id: '27',
    name: 'Sheridan Arts Foundation Holiday Concert Series',
    date: '2025-12-26',
    type: 'concert',
    description: 'Five nights of world-class entertainment at the historic Sheridan Opera House',
    url: 'https://www.telluride.com/event/sheridan-arts-foundation-holiday-concert-series/',
  },
  {
    id: '28',
    name: 'Jane Monheit',
    date: '2025-12-28',
    type: 'concert',
    description: 'Catapulted to stardom at age 20, Jane has spent the last two decades touring the globe',
    url: 'https://www.telluride.com/event/jane-monheit/',
  },
  {
    id: '29',
    name: 'Yesterday - A Tribute to The Beatles',
    date: '2025-12-29',
    type: 'concert',
    description: 'Performing the Beatles since 2000, founded by Don Bellezzo',
    url: 'https://www.telluride.com/event/yesterday/',
  },
  {
    id: '30',
    name: 'Larkin Poe',
    date: '2025-12-31',
    type: 'concert',
    description: 'Ring in 2026 with The Rock N\' Revel Gala featuring GRAMMY-nominated blues-rock duo',
    url: 'https://www.telluride.com/event/larkin-poe/',
  },
  {
    id: '31',
    name: 'New Year\'s Eve Torchlight Parade & Fireworks',
    date: '2025-12-31',
    type: 'festival',
    description: 'Ski instructors meander down the mountain with torches to light up the night, followed by fireworks',
    url: 'https://www.telluride.com/event/new-years-eve-torchlight-parade-fireworks/',
  },
  {
    id: '32',
    name: 'Neal Francis',
    date: '2026-01-08',
    type: 'concert',
    description: 'The latest album from Neal Francis, Return To Zero, emerged from a visionary fever dream',
    url: 'https://www.telluride.com/event/neal-francis/',
  },
  {
    id: '33',
    name: 'The Motet',
    date: '2026-01-09',
    type: 'concert',
    description: 'After 26 years, nine albums, and over a thousand shows, The Motet embark on another chapter',
    url: 'https://www.telluride.com/event/the-motet/',
  },
  {
    id: '34',
    name: 'Kitchen Dwellers',
    date: '2026-01-15',
    type: 'concert',
    description: 'In Dante\'s Inferno, the author grapples with sin, its manifestations, and consequences',
    url: 'https://www.telluride.com/event/kitchen-dwellers/',
  },
  {
    id: '35',
    name: 'Late Night Radio',
    date: '2026-01-17',
    type: 'concert',
    description: 'Colorado-based electronic music producer introduces his latest album, Pocket Full of Dreams',
    url: 'https://www.telluride.com/event/late-night-radio/',
  },
  {
    id: '36',
    name: 'Jason Leech w/Future Joy and Michael Wilbur',
    date: '2026-01-18',
    type: 'concert',
    description: 'The Sheridan Arts Foundation presents Jason Leech Live in Concert',
    url: 'https://www.telluride.com/event/jason-leech-wfuture-joy-and-michael-wilbur-of-moon-hooch/',
  },
  {
    id: '37',
    name: 'Ridgeliners',
    date: '2026-01-18',
    type: 'concert',
    description: 'Formed over a bottle of whiskey during a late night writing session',
    url: 'https://www.telluride.com/event/ridgeliners/',
  },
  {
    id: '38',
    name: 'YOPE',
    date: '2026-01-22',
    type: 'concert',
    description: 'Formed out of the open mic scene in Durango CO, eccentric genre blending funk-rock-jam fusion',
    url: 'https://www.telluride.com/event/yope/',
  },
  {
    id: '39',
    name: 'Drew Emmitt, John Cowan and Eli Emmitt',
    date: '2026-01-22',
    type: 'concert',
    description: 'Drew Emmitt founder of the jam band Leftover Salmon moved to Boulder, CO, in 1973',
    url: 'https://www.telluride.com/event/drew-emmitt-john-cowan-and-eli-emmitt/',
  },
  {
    id: '40',
    name: 'Andy Frasco & The U.N.',
    date: '2026-01-23',
    type: 'concert',
    description: 'Andy Frasco is a cross between a young Mick Jagger and a drunken Vaudevillian',
    url: 'https://www.telluride.com/event/andy-frasco-the-u-n/',
  },
  {
    id: '41',
    name: 'Harlem Quartet',
    date: '2026-01-24',
    type: 'concert',
    description: 'Grammy-winning Harlem Quartet has earned international acclaim',
    url: 'https://www.telluride.com/event/harlem-quartet/',
  },
  {
    id: '42',
    name: 'Pressure Drop',
    date: '2026-01-29',
    type: 'festival',
    description: 'The Sheridan Arts Foundation presents Teton Gravity Research\'s film',
    url: 'https://www.telluride.com/event/pressure-drop/',
  },
  {
    id: '43',
    name: 'Cousin Curtiss',
    date: '2026-01-30',
    type: 'concert',
    description: 'Brings to the stage a fiery dynamic rarely seen by a solo act',
    url: 'https://www.telluride.com/event/cousin-curtiss/',
  },
  {
    id: '44',
    name: 'The Last Class With Robert Reich',
    date: '2026-01-30',
    type: 'festival',
    description: 'The Sheridan Arts Foundation presents Robert Reich Doc\'s "The Last Class" film',
    url: 'https://www.telluride.com/event/the-last-class-with-robert-reich/',
  },
  {
    id: '45',
    name: 'Emily Scott Robinson',
    date: '2026-01-31',
    type: 'concert',
    description: 'Come celebrate the release of Emily Scott Robinson\'s 5th album at this concert',
    url: 'https://www.telluride.com/event/emily-scott-robinson/',
  },
  {
    id: '46',
    name: 'May Erlewine',
    date: '2026-02-03',
    type: 'concert',
    description: 'May Erlewine has dedicated her life to writing songs for the human heart\'s existence',
    url: 'https://www.telluride.com/event/may-erlewine/',
  },
  {
    id: '47',
    name: 'Discognition',
    date: '2026-02-05',
    type: 'concert',
    description: 'Captivates listeners with a distinctive blend of lush, dramatic dance music',
    url: 'https://www.telluride.com/event/discognition/',
  },
  {
    id: '48',
    name: 'Guys and Dolls',
    date: '2026-02-06',
    type: 'art',
    description: 'Young People\'s Theater presents the high school production of Guys and Dolls',
    url: 'https://www.telluride.com/event/guys-and-dolls/',
  },
  {
    id: '49',
    name: 'Briscoe',
    date: '2026-02-06',
    type: 'concert',
    description: 'If Briscoe\'s debut album was a coming-of-age soundtrack set against the backdrop of the Texas Hill Country',
    url: 'https://www.telluride.com/event/briscoe/',
  },
  {
    id: '50',
    name: 'Telluride Comedy Festival',
    date: '2026-02-12',
    type: 'festival',
    description: 'The 25th annual Telluride Comedy Festival at the historic Sheridan Opera House',
    url: 'https://www.telluride.com/event/telluride-comedy-festival/',
  },
  {
    id: '51',
    name: 'Western Medicine',
    date: '2026-02-19',
    type: 'concert',
    description: 'Swinging from powerful harmonies and distortion to acoustic guitars and tender lap steel melodies',
    url: 'https://www.telluride.com/event/western-medicine/',
  },
  {
    id: '52',
    name: 'The Infamous Stringdusters',
    date: '2026-02-19',
    type: 'concert',
    description: 'Taking over the Sheridan Opera House stage for three incredible evenings',
    url: 'https://www.telluride.com/event/the-infamous-stringdusters/',
  },
  {
    id: '53',
    name: 'Black Pistol Fire',
    date: '2026-02-25',
    type: 'concert',
    description: 'The Sheridan Arts Foundation presents Black Pistol Fire Live in Concert',
    url: 'https://www.telluride.com/event/black-pistol-fire/',
  },
  {
    id: '54',
    name: 'The Brothers Comatose',
    date: '2026-02-26',
    type: 'concert',
    description: 'Fusing old school string band instrumentation with rock and roll exuberance',
    url: 'https://www.telluride.com/event/the-brothers-comatose/',
  },
  {
    id: '55',
    name: 'TAB Fashion Show',
    date: '2026-02-26',
    type: 'art',
    description: 'The TAB Annual Fashion Show is a show as unique as Telluride itself',
    url: 'https://www.telluride.com/event/tab-fashion-show/',
  },
  {
    id: '56',
    name: 'Telluride Gay Ski Week',
    date: '2026-02-28',
    type: 'festival',
    description: 'Originally founded in 2002, a week to look forward to for LGBTQ+ skiers and snowboarders',
    url: 'https://www.telluride.com/event/telluride-gay-ski-week/',
  },
  {
    id: '57',
    name: 'Birds of Play',
    date: '2026-03-04',
    type: 'concert',
    description: 'Americana Roots quartet based in the San Juan Mountains of Southwestern Colorado',
    url: 'https://www.telluride.com/event/birds-of-play/',
  },
  {
    id: '58',
    name: 'The Polish Ambassador',
    date: '2026-03-07',
    type: 'concert',
    description: 'Musician. Producer. Beatsmith. Recording artist. Composer. Dance-floor general',
    url: 'https://www.telluride.com/event/the-polish-ambassador/',
  },
  {
    id: '59',
    name: 'Big Something',
    date: '2026-03-12',
    type: 'concert',
    description: 'Hailing from the North Carolina countryside, or "The Middle of Nowhere"',
    url: 'https://www.telluride.com/event/big-something/',
  },
  {
    id: '60',
    name: 'ZOSO',
    date: '2026-03-14',
    type: 'concert',
    description: 'Celebrating their 30th anniversary, one of the most iconic Led Zeppelin tribute bands',
    url: 'https://www.telluride.com/event/zoso/',
  },
  {
    id: '61',
    name: 'Grieves',
    date: '2026-03-15',
    type: 'concert',
    description: 'With two decades of experience, Seattle\'s own Grieves has sculpted a remarkable path',
    url: 'https://www.telluride.com/event/grieves/',
  },
  {
    id: '62',
    name: 'Galvin Cello Quartet',
    date: '2026-03-19',
    type: 'concert',
    description: 'Praised as a quartet whose cellists are brilliant instrumentalists and thoughtful musicians',
    url: 'https://www.telluride.com/event/galvin-cello-quartet/',
  },
  {
    id: '63',
    name: 'Easy Jim',
    date: '2026-04-03',
    type: 'concert',
    description: '"Settle back, easy Jim..." The iconic lyric from Robert Hunter\'s Althea captured the spirit',
    url: 'https://www.telluride.com/event/easy-jim/',
  },
  {
    id: '64',
    name: 'Mountainfilm',
    date: '2026-05-21',
    type: 'festival',
    description: 'Documentary film festival that showcases nonfiction stories about environmental, cultural, climbing themes',
    url: 'https://www.telluride.com/event/mountainfilm/',
  },
  {
    id: '65',
    name: 'Telluride Balloon Festival',
    date: '2026-06-05',
    type: 'festival',
    description: 'Get high at the Telluride Balloon Festival! Watch hot air balloons lift off from Telluride Town Park',
    url: 'https://www.telluride.com/event/telluride-balloon-festival/',
  },
  {
    id: '66',
    name: 'Huck Finn & Becky Thatcher Day',
    date: '2026-06-06',
    type: 'community',
    description: 'Join the Telluride Elks for a Telluride tradition! Kids 10 and under can participate',
    url: 'https://www.telluride.com/event/huck-finn-becky-thatcher-day/',
  },
  {
    id: '67',
    name: 'Telluride Food + Vine',
    date: '2026-06-11',
    type: 'festival',
    description: 'The area\'s premier food and wine weekend, providing the ultimate epicurean experience',
    url: 'https://www.telluride.com/event/telluride-food-vine/',
  },
  {
    id: '68',
    name: 'Telluride Bluegrass Festival',
    date: '2026-06-18',
    type: 'concert',
    description: 'Every June, Festivarians make the annual pilgrimage to Telluride for the Bluegrass Festival',
    url: 'https://www.telluride.com/event/telluride-bluegrass-festival/',
  },
  {
    id: '69',
    name: 'Telluride Yoga Festival',
    date: '2026-06-25',
    type: 'festival',
    description: 'The longest running yoga festival in the country, a four-day yoga and wellness gathering',
    url: 'https://www.telluride.com/event/telluride-yoga-festival/',
  },
  {
    id: '70',
    name: 'Telluride Plein Air',
    date: '2026-06-29',
    type: 'art',
    description: 'The Telluride Plein Air Festival is an essential fundraiser for the Sheridan Arts Foundation',
    url: 'https://www.telluride.com/event/telluride-plein-air/',
  },
  {
    id: '71',
    name: 'Red, White & Blues',
    date: '2026-07-03',
    type: 'festival',
    description: 'Celebrate the Fourth of July with the whole family at Mountain Village\'s celebration',
    url: 'https://www.telluride.com/event/red-white-blues/',
  },
  {
    id: '72',
    name: 'Telluride Fourth of July Parade',
    date: '2026-07-04',
    type: 'festival',
    description: 'The longest running event in the Town\'s history. The parade celebrates our nation\'s independence',
    url: 'https://www.telluride.com/event/telluride-fourth-of-july-parade/',
  },
  {
    id: '73',
    name: 'Hardrock Hundred Endurance Run',
    date: '2026-07-10',
    type: 'sports',
    description: 'An ultramarathon of 102.5 miles in length, plus 33,197 feet of climb and descent',
    url: 'https://www.telluride.com/event/hardrock-hundred-endurance-run/',
  },
  {
    id: '74',
    name: 'Telluride Table',
    date: '2026-07-10',
    type: 'festival',
    description: 'Family, whether forged by blood or bond, is the center of community and it all starts at the table',
    url: 'https://www.telluride.com/event/telluride-table/',
  },
  {
    id: '75',
    name: 'Telluride Americana Music Festival',
    date: '2026-07-17',
    type: 'concert',
    description: 'An annual singer-songwriter event celebrating the best of Americana music',
    url: 'https://www.telluride.com/event/telluride-americana-music-festival/',
  },
  {
    id: '76',
    name: 'Telluride Reserve',
    date: '2026-07-30',
    type: 'festival',
    description: 'More than an event—it is an intimate gathering where stories are shared, flavors are discovered',
    url: 'https://www.telluride.com/event/telluride-reserve/',
  },
  {
    id: '77',
    name: 'Telluride Mushroom Festival',
    date: '2026-08-12',
    type: 'festival',
    description: 'Since 1981, celebrating all things mycological, from the newest advancements to foraging',
    url: 'https://www.telluride.com/event/telluride-mushroom-festival/',
  },
  {
    id: '78',
    name: 'Telluride Blues & Brews Festival',
    date: '2026-09-18',
    type: 'concert',
    description: 'Renowned as one of the most scenic and intimate music festivals in the country',
    url: 'https://www.telluride.com/event/telluride-blues-brews-festival/',
  },
  {
    id: '79',
    name: 'Telluride Horror Show',
    date: '2026-10-16',
    type: 'festival',
    description: 'Colorado\'s first and largest horror film festival, returns for its 17th edition',
    url: 'https://www.telluride.com/event/telluride-horror-show/',
  },
];

const EVENT_COLORS = {
  festival: 'from-purple-500 to-purple-600',
  concert: 'from-pink-500 to-pink-600',
  sports: 'from-blue-500 to-blue-600',
  art: 'from-accent-500 to-accent-600',
  community: 'from-primary-500 to-primary-600',
};

export function EventsWidget() {
  // Automatically filter for upcoming events only, sort by date, and get next 4
  // Past events are automatically excluded based on current date
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const upcomingEvents = [...TELLURIDE_EVENTS]
    .filter(event => new Date(event.date) >= today)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 4);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined 
    });
  };

  const getMonthDay = (dateStr: string) => {
    const date = new Date(dateStr);
    return {
      month: date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
      day: date.getDate().toString()
    };
  };

  return (
    <div className="bg-primary-50 rounded-2xl p-6 border border-primary-200 shadow-card hover:shadow-card-hover transition-all duration-300 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-primary-600 flex items-center justify-center shadow-card">
          <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <div>
          <h3 className="text-xl font-bold text-neutral-900">Upcoming Events</h3>
          <p className="text-sm text-neutral-600">Festivals & Activities</p>
        </div>
      </div>

      {/* Events List - Shows next 4 upcoming events */}
      <div className="space-y-3 flex-1 mb-6">
        {upcomingEvents.length > 0 ? (
          upcomingEvents.map((event) => {
            const { month, day } = getMonthDay(event.date);
            return (
              <a
                key={event.id}
                href={event.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group block p-3.5 bg-white rounded-xl border border-neutral-200 hover:border-primary-300 hover:shadow-md transition-all duration-300"
              >
                <div className="flex items-start gap-3">
                  {/* Date Badge */}
                  <div className="flex-shrink-0 w-14 h-14 rounded-lg bg-primary-600 flex flex-col items-center justify-center text-white shadow-sm">
                    <div className="text-xs font-bold tracking-wide">
                      {month}
                    </div>
                    <div className="text-xl font-bold leading-none">
                      {day}
                    </div>
                  </div>

                  {/* Event Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-sm text-neutral-900 group-hover:text-primary-600 transition-colors line-clamp-1 mb-1">
                      {event.name}
                    </h4>
                    <p className="text-xs text-neutral-600 line-clamp-2 leading-relaxed">{event.description}</p>
                  </div>
                  
                  {/* External Link Icon */}
                  <svg className="w-4 h-4 text-neutral-400 group-hover:text-primary-600 transition-colors flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </div>
              </a>
            );
          })
        ) : (
          <div className="text-center py-8 text-neutral-600">
            <p className="text-sm font-medium">Check back soon for upcoming events!</p>
          </div>
        )}
      </div>

      {/* View All CTA */}
      <div className="mt-auto">
        <a
          href="https://www.telluride.com/festivals-events/events/"
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full text-center bg-primary-600 text-white px-6 py-4 rounded-xl font-bold hover:bg-primary-700 transition-all duration-200 shadow-md hover:shadow-lg hover:scale-[1.02] flex items-center justify-center gap-2"
        >
          <span>View Full Events Calendar</span>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      </div>
    </div>
  );
}

