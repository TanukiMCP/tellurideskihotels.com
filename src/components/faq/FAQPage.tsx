import { useState, useEffect, useMemo } from 'react';
import { Search, X, ChevronDown, Building2, CreditCard, RotateCcw, Key, Home, MapPin, MessageCircle, Mail, Phone } from 'lucide-react';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

interface FAQCategory {
  id: string;
  name: string;
  icon: React.ReactNode;
  items: FAQItem[];
}

const faqCategories: FAQCategory[] = [
  {
    id: 'booking',
    name: 'Booking & Reservations',
    icon: <Building2 className="w-6 h-6" />,
    items: [
      {
        id: 'how-to-book',
        question: 'How do I make a reservation?',
        answer: 'You can make a reservation directly on our website by selecting your dates, choosing a property, and completing the booking form. You\'ll receive an instant confirmation email with your booking ID. You can also call us at (970) XXX-XXXX for assistance.',
      },
      {
        id: 'multiple-rooms',
        question: 'Can I book multiple rooms at once?',
        answer: 'Yes! When searching, you can select the number of rooms you need. Each room can accommodate different guest counts. If you need to book multiple rooms with different configurations, you may need to make separate bookings or contact us for assistance.',
      },
      {
        id: 'account-required',
        question: 'Do I need to create an account to book?',
        answer: 'No, you can book as a guest without creating an account. However, creating an account allows you to manage your bookings more easily, save favorite properties, and access exclusive deals. You can always create an account later using the email address from your booking.',
      },
      {
        id: 'booking-confirmed',
        question: 'How do I know my booking is confirmed?',
        answer: 'You\'ll receive an instant confirmation email with your booking ID and all reservation details. You can also look up your booking anytime using your booking ID and email address on our "Find Your Booking" page.',
      },
      {
        id: 'book-for-others',
        question: 'Can I make a reservation for someone else?',
        answer: 'Yes, you can book for someone else. During checkout, you\'ll have the option to enter different guest information. Make sure to use the email address where you want the confirmation sent.',
      },
      {
        id: 'fully-booked',
        question: 'What if the property I want is fully booked?',
        answer: 'We\'ll show you similar properties with availability for your dates. You can also try adjusting your dates or contact us - we may be able to find alternatives or notify you if something becomes available.',
      },
      {
        id: 'group-discounts',
        question: 'Do you offer group booking discounts?',
        answer: 'Yes! For group bookings of 5+ rooms or extended stays, we offer special rates. Please contact us directly at tellurideskihotels@gmail.com or call (970) XXX-XXXX to discuss group pricing and availability.',
      },
    ],
  },
  {
    id: 'payments',
    name: 'Payments & Pricing',
    icon: <CreditCard className="w-6 h-6" />,
    items: [
      {
        id: 'when-charged',
        question: 'When will my card be charged?',
        answer: 'Your card is authorized at the time of booking, but you won\'t be charged until check-in. Some properties may require a deposit or full payment in advance - this will be clearly stated during booking.',
      },
      {
        id: 'payment-methods',
        question: 'What payment methods do you accept?',
        answer: 'We accept all major credit cards (Visa, Mastercard, American Express, Discover) and debit cards. Some properties may also accept other payment methods - check the property details for specific payment options.',
      },
      {
        id: 'taxes-fees',
        question: 'Are taxes and fees included in the price?',
        answer: 'Yes! The total price shown includes all taxes and fees. There are no hidden charges. The breakdown will show the nightly rate, taxes, and any applicable fees before you complete your booking.',
      },
      {
        id: 'price-matching',
        question: 'Do you offer price matching?',
        answer: 'We strive to offer the best rates available. If you find a lower rate for the same property and dates elsewhere, contact us and we\'ll do our best to match it. Terms and conditions apply.',
      },
      {
        id: 'split-payment',
        question: 'Can I split payment between multiple cards?',
        answer: 'Unfortunately, we don\'t support split payments online. If you need to split payment, please contact us before booking and we can arrange this manually.',
      },
      {
        id: 'currency',
        question: 'What currency are prices shown in?',
        answer: 'All prices are shown in US Dollars (USD). If you\'re booking from outside the US, your bank will convert the charge to your local currency at the current exchange rate.',
      },
      {
        id: 'hidden-fees',
        question: 'Are there any hidden fees?',
        answer: 'No hidden fees! The price you see is the price you pay. All taxes, resort fees, and service charges are included in the total shown before you complete your booking.',
      },
    ],
  },
  {
    id: 'cancellations',
    name: 'Cancellations & Changes',
    icon: <RotateCcw className="w-6 h-6" />,
    items: [
      {
        id: 'cancellation-policy',
        question: 'What is your cancellation policy?',
        answer: 'Cancellation policies vary by property and rate type. Free cancellation is typically available up to 48-72 hours before check-in, while non-refundable rates cannot be cancelled. Your specific cancellation policy will be shown during booking and in your confirmation email.',
      },
      {
        id: 'how-to-cancel',
        question: 'How do I cancel or modify my reservation?',
        answer: 'You can cancel or modify your booking by looking it up on our "Find Your Booking" page using your booking ID and email. You can also contact us directly at tellurideskihotels@gmail.com or call (970) XXX-XXXX.',
      },
      {
        id: 'cancellation-fee',
        question: 'Will I be charged a cancellation fee?',
        answer: 'Cancellation fees depend on your rate type and how close to check-in you cancel. Free cancellation rates have no fees if cancelled within the policy window. Non-refundable rates cannot be cancelled. Any applicable fees will be clearly stated in your booking confirmation.',
      },
      {
        id: 'change-dates',
        question: 'What if I need to change my dates?',
        answer: 'Date changes are subject to availability and rate differences. You can request a date change by looking up your booking or contacting us. If the new dates have a higher rate, you\'ll pay the difference. If lower, you\'ll receive a credit or refund per the cancellation policy.',
      },
      {
        id: 'non-refundable-refund',
        question: 'Can I get a refund for a non-refundable booking?',
        answer: 'Non-refundable bookings cannot be cancelled or refunded. However, in exceptional circumstances (medical emergencies, severe weather, etc.), contact us and we\'ll review your situation on a case-by-case basis.',
      },
      {
        id: 'no-show',
        question: 'What happens if I don\'t show up?',
        answer: 'If you don\'t show up for your reservation, you\'ll be charged the full amount. Non-refundable bookings are charged regardless. If you have a free cancellation rate but didn\'t cancel, you\'ll be charged per the property\'s no-show policy.',
      },
      {
        id: 'refund-timing',
        question: 'How long does it take to receive a refund?',
        answer: 'Refunds are processed immediately upon cancellation, but it may take 5-10 business days for the funds to appear in your account, depending on your bank\'s processing time.',
      },
    ],
  },
  {
    id: 'checkin',
    name: 'Check-in & Check-out',
    icon: <Key className="w-6 h-6" />,
    items: [
      {
        id: 'checkin-time',
        question: 'What time is check-in and check-out?',
        answer: 'Standard check-in is typically 3:00 PM or 4:00 PM, and check-out is 11:00 AM. These times vary by property - check your confirmation email for specific times.',
      },
      {
        id: 'early-late-checkin',
        question: 'Can I check in early or late?',
        answer: 'Early check-in and late check-out are subject to availability and may incur additional fees. Contact the property directly or us in advance to arrange this. We\'re happy to hold your luggage if you arrive early.',
      },
      {
        id: 'checkin-requirements',
        question: 'What do I need to bring at check-in?',
        answer: 'Bring a valid government-issued photo ID (driver\'s license or passport) and the credit card used for booking. Some properties may also require a security deposit - this will be noted in your confirmation.',
      },
      {
        id: 'late-checkout',
        question: 'Is there a late check-out option?',
        answer: 'Late check-out is available at most properties for an additional fee, subject to availability. Request this at check-in or contact the property in advance. Typical late check-out is until 2:00 PM.',
      },
      {
        id: 'key-pickup',
        question: 'Where do I pick up my keys?',
        answer: 'Key pickup location varies by property. Most properties have a front desk or check-in office. Some offer self check-in with key codes. Your confirmation email will include the exact location and check-in instructions.',
      },
      {
        id: 'after-hours',
        question: 'What if I arrive outside of office hours?',
        answer: 'Many properties offer 24-hour check-in or self check-in options. If you\'re arriving late, contact the property in advance to arrange key pickup. Instructions will be provided in your confirmation email.',
      },
      {
        id: 'arrival-notification',
        question: 'Do I need to notify the property of my arrival time?',
        answer: 'It\'s helpful but not always required. Some properties request arrival times for planning purposes. Check your confirmation email for specific instructions. If you\'re arriving very early or very late, it\'s always best to notify them.',
      },
    ],
  },
  {
    id: 'property',
    name: 'Property Information',
    icon: <Home className="w-6 h-6" />,
    items: [
      {
        id: 'amenities',
        question: 'What amenities are included?',
        answer: 'Amenities vary by property but commonly include Wi-Fi, parking, kitchen facilities, hot tubs, fireplaces, and ski storage. Check each property\'s listing page for a complete list of amenities.',
      },
      {
        id: 'parking',
        question: 'Is parking available?',
        answer: 'Most properties offer parking, though some charge a daily fee. Free parking is noted in the property details. Street parking may also be available depending on the location. Check the property listing for specific parking information.',
      },
      {
        id: 'pets',
        question: 'Are pets allowed?',
        answer: 'Pet policies vary by property. Some properties are pet-friendly (often with a fee), while others don\'t allow pets. Use our search filters to find pet-friendly properties, or check individual property listings for specific pet policies.',
      },
      {
        id: 'wifi',
        question: 'Is there Wi-Fi?',
        answer: 'Yes! Free Wi-Fi is standard at all properties we list. Connection details will be provided at check-in or in your confirmation materials.',
      },
      {
        id: 'accessible-rooms',
        question: 'What\'s included in an accessible room?',
        answer: 'Accessible rooms typically include roll-in showers, grab bars, lower countertops, and wider doorways. Specific accessibility features are listed on each property\'s page. If you have specific needs, contact us and we\'ll help you find the perfect room.',
      },
      {
        id: 'kitchens',
        question: 'Are kitchens fully equipped?',
        answer: 'Most properties with kitchens include standard appliances (refrigerator, stove, microwave) and basic cookware. Full kitchens typically have dishwashers, ovens, and complete cookware sets. Check property listings for specific kitchen amenities.',
      },
      {
        id: 'housekeeping',
        question: 'Is housekeeping provided daily?',
        answer: 'Housekeeping policies vary. Some properties offer daily housekeeping, while others provide it on a limited schedule or upon request. Extended stays may include weekly housekeeping. Check property details or contact us for specific information.',
      },
    ],
  },
  {
    id: 'local',
    name: 'Local Area & Activities',
    icon: <MapPin className="w-6 h-6" />,
    items: [
      {
        id: 'distance-to-slopes',
        question: 'How close are properties to the ski slopes?',
        answer: 'We list properties ranging from ski-in/ski-out to a short drive or shuttle ride away. Each property listing shows the distance to the nearest lift. Use our search filters to find properties by proximity to the slopes.',
      },
      {
        id: 'shuttle-service',
        question: 'Is there shuttle service to the mountain?',
        answer: 'Many properties offer complimentary shuttle service to the slopes. Telluride also has a free public gondola and bus system. Check property listings for shuttle availability, or contact us for transportation options.',
      },
      {
        id: 'restaurants',
        question: 'What restaurants are nearby?',
        answer: 'Telluride offers a fantastic dining scene with options for every taste and budget. Each property listing includes nearby restaurant recommendations. We also have a dining guide on our blog with local favorites.',
      },
      {
        id: 'ski-rentals',
        question: 'Can you help arrange ski rentals or lessons?',
        answer: 'Yes! We can help you book ski rentals, lessons, and other activities. Contact us or check our "Things to Do" section for available activities and booking options.',
      },
      {
        id: 'summer-activities',
        question: 'What activities are available in summer?',
        answer: 'Telluride is beautiful year-round! Summer activities include hiking, mountain biking, fly fishing, festivals, and scenic gondola rides. Check our "Things to Do" section for seasonal activity recommendations.',
      },
      {
        id: 'lift-tickets',
        question: 'Where can I buy lift tickets?',
        answer: 'Lift tickets can be purchased online in advance (often at a discount) or at the mountain. We can provide information on where to buy tickets and any available discounts for our guests.',
      },
      {
        id: 'grocery-stores',
        question: 'Are there grocery stores nearby?',
        answer: 'Yes! Telluride has several grocery stores including City Market and Clark\'s Market. Many properties are within walking distance or a short drive. Some properties also offer grocery delivery services.',
      },
    ],
  },
];

export default function FAQPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['booking', 'payments'])); // Default: first two expanded

  // Expand all categories on desktop after mount
  useEffect(() => {
    if (window.innerWidth >= 1024) {
      setExpandedCategories(new Set(['booking', 'payments', 'cancellations', 'checkin', 'property', 'local']));
    }
  }, []);

  // Handle URL hash on mount
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (hash) {
      // Find the item and expand it
      for (const category of faqCategories) {
        const item = category.items.find(item => item.id === hash);
        if (item) {
          setOpenItems(new Set([item.id]));
          setExpandedCategories(new Set([category.id]));
          // Scroll to item after a brief delay
          setTimeout(() => {
            const element = document.getElementById(hash);
            element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 300);
          break;
        }
      }
    }
  }, []);

  // Filter FAQs based on search
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) {
      return faqCategories;
    }

    const query = searchQuery.toLowerCase();
    return faqCategories
      .map(category => ({
        ...category,
        items: category.items.filter(
          item =>
            item.question.toLowerCase().includes(query) ||
            item.answer.toLowerCase().includes(query)
        ),
      }))
      .filter(category => category.items.length > 0);
  }, [searchQuery]);

  const toggleItem = (itemId: string) => {
    setOpenItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  // Highlight matching text
  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text;
    
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={i} className="bg-yellow-200 px-1 rounded">{part}</mark>
      ) : (
        part
      )
    );
  };

  return (
    <div className="w-full">
      {/* Search Bar */}
      <div className="max-w-[600px] mx-auto mb-12 relative">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#2D5F4F]" />
          <input
            type="text"
            placeholder="Search FAQs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-[52px] pl-12 pr-12 bg-white border border-[#D5D5D5] rounded-full text-base focus:outline-none focus:border-[#2D5F4F] focus:ring-2 focus:ring-[#2D5F4F]/20 transition-all duration-200"
            aria-label="Search frequently asked questions"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
              aria-label="Clear search"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* No Results Message */}
      {searchQuery && filteredCategories.length === 0 && (
        <div className="text-center py-12">
          <p className="text-lg text-neutral-600 mb-2">No results found</p>
          <p className="text-sm text-neutral-500">Try a different search term or browse by category</p>
        </div>
      )}

      {/* FAQ Categories */}
      <div className="space-y-8">
        {filteredCategories.map((category) => (
          <div
            key={category.id}
            className="bg-white rounded-xl shadow-lg p-8 md:p-12 border border-[#E5E5E5]"
          >
            {/* Category Header */}
            <button
              onClick={() => toggleCategory(category.id)}
              className="w-full flex items-center gap-3 mb-6 text-left"
            >
              <div className="text-[#2D5F4F]">{category.icon}</div>
              <h2 className="text-2xl font-semibold text-[#2C2C2C] flex-1">
                {category.name}
              </h2>
              <ChevronDown
                className={`w-6 h-6 text-neutral-400 transition-transform duration-200 ${
                  expandedCategories.has(category.id) ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Category Items */}
            {expandedCategories.has(category.id) && (
              <div className="space-y-0 border-t border-[#E8E8E8]">
                {category.items.map((item) => (
                  <div
                    key={item.id}
                    id={item.id}
                    className="border-b border-[#E8E8E8] last:border-b-0"
                  >
                    <button
                      onClick={() => toggleItem(item.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          toggleItem(item.id);
                        }
                      }}
                      className={`w-full px-5 py-5 text-left flex items-center justify-between transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-[#2D5F4F] focus:ring-offset-2 ${
                        openItems.has(item.id)
                          ? 'bg-[#F8F9F8]'
                          : 'bg-white hover:bg-[#F8F9F8]'
                      }`}
                      aria-expanded={openItems.has(item.id)}
                      aria-controls={`answer-${item.id}`}
                    >
                      <span className="text-base font-medium text-[#2C2C2C] pr-4 flex-1">
                        {searchQuery ? highlightText(item.question, searchQuery) : item.question}
                      </span>
                      <ChevronDown
                        className={`w-5 h-5 text-neutral-400 flex-shrink-0 transition-transform duration-200 ${
                          openItems.has(item.id) ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    <div
                      id={`answer-${item.id}`}
                      className={`overflow-hidden transition-all duration-300 ease-in-out ${
                        openItems.has(item.id) ? 'max-h-96' : 'max-h-0'
                      }`}
                    >
                      <div className="px-5 pb-5 text-[15px] text-[#666] leading-relaxed">
                        {searchQuery ? highlightText(item.answer, searchQuery) : item.answer}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Still Have Questions CTA */}
      <div className="mt-12 bg-[#E8F2ED] rounded-xl p-12 text-center">
        <h3 className="text-2xl font-semibold text-[#2C2C2C] mb-2">
          Still have questions?
        </h3>
        <p className="text-base text-[#666] mb-8">
          Our team is here to help you plan the perfect Telluride getaway
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {/* Email Support */}
          <div className="bg-white rounded-lg p-6">
            <Mail className="w-8 h-8 text-[#2D5F4F] mx-auto mb-3" />
            <h4 className="font-semibold text-[#2C2C2C] mb-1">Email Us</h4>
            <p className="text-sm text-[#666] mb-2">tellurideskihotels@gmail.com</p>
            <p className="text-xs text-neutral-500 mb-4">We typically respond within 24 hours</p>
            <a
              href="mailto:tellurideskihotels@gmail.com"
              className="inline-block bg-[#2D5F4F] text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-[#255040] transition-colors"
            >
              Send Email
            </a>
          </div>

          {/* Phone Support */}
          <div className="bg-white rounded-lg p-6">
            <Phone className="w-8 h-8 text-[#2D5F4F] mx-auto mb-3" />
            <h4 className="font-semibold text-[#2C2C2C] mb-1">Call Us</h4>
            <p className="text-sm text-[#666] mb-2">(970) XXX-XXXX</p>
            <p className="text-xs text-neutral-500 mb-4">Mon-Fri, 9am-6pm MST</p>
            <a
              href="tel:+1970XXXXXXX"
              className="inline-block bg-[#2D5F4F] text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-[#255040] transition-colors"
            >
              Call Now
            </a>
          </div>

          {/* Contact Form */}
          <div className="bg-white rounded-lg p-6">
            <MessageCircle className="w-8 h-8 text-[#2D5F4F] mx-auto mb-3" />
            <h4 className="font-semibold text-[#2C2C2C] mb-1">Contact Form</h4>
            <p className="text-sm text-[#666] mb-2">Send us a message</p>
            <p className="text-xs text-neutral-500 mb-4">Available 24/7</p>
            <a
              href="/contact"
              className="inline-block bg-[#2D5F4F] text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-[#255040] transition-colors"
            >
              Contact Us
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

