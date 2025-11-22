import { useState, type FormEvent } from 'react';
import { format, addDays } from 'date-fns';
import { Calendar, Users, Search } from 'lucide-react';
import { optimizePexelsImage } from '@/lib/image-optimizer';
import type { ImageLibraryImage } from '@/lib/image-library';

interface SplitHeroProps {
  heroImage?: ImageLibraryImage | null;
}

export default function SplitHero({ heroImage }: SplitHeroProps) {
  const [checkIn, setCheckIn] = useState(format(addDays(new Date(), 7), 'yyyy-MM-dd'));
  const [checkOut, setCheckOut] = useState(format(addDays(new Date(), 14), 'yyyy-MM-dd'));
  const [guests, setGuests] = useState(2);
  const [showGuestDropdown, setShowGuestDropdown] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setIsSearching(true);
    
    const params = new URLSearchParams({
      location: 'Telluride',
      checkIn,
      checkOut,
      adults: guests.toString(),
    });
    
    setTimeout(() => {
      if (typeof window !== 'undefined') {
        window.location.href = `/places-to-stay?${params.toString()}`;
      }
    }, 300);
  };

  const heroImageUrl = heroImage
    ? optimizePexelsImage(heroImage.url, { width: 1200, quality: 90 })
    : null;

  const formattedCheckIn = format(new Date(checkIn), 'MM/dd/yyyy');
  const formattedCheckOut = format(new Date(checkOut), 'MM/dd/yyyy');

  return (
    <section className="relative w-full flex flex-col lg:flex-row hero-section">
      {/* Left Column - Content Side */}
      <div className="w-full lg:w-[55%] xl:w-[55%] md:w-[50%] bg-[#2D5F4F] flex items-center justify-center p-6 md:p-10 lg:p-16 xl:p-20">
        <div className="w-full max-w-[540px]">
          {/* Headline */}
          <h1 
            className="text-[36px] md:text-[42px] lg:text-[52px] font-bold text-white leading-[1.1] tracking-[-0.5px] mb-5 text-left"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Your Home Base for Telluride Adventures
          </h1>

          {/* Subheading */}
          <p 
            className="text-base md:text-lg text-white/90 leading-relaxed mb-8 md:mb-10 max-w-[480px] text-left"
            style={{ fontFamily: "'Open Sans', sans-serif" }}
          >
            Book the perfect accommodation for your ski getaway, from cozy studios to luxury penthouses
          </p>

          {/* Search Module */}
          <div className="bg-white rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] p-4 md:p-6">
            <form onSubmit={handleSubmit} className="flex flex-col md:flex-row md:flex-wrap gap-3 items-end">
              {/* Check-in Date */}
              <div className="flex-1 w-full md:w-auto">
                <label htmlFor="check-in" className="block text-xs font-semibold text-neutral-600 mb-1.5">
                  Check-in
                </label>
                <div className="relative h-14 border border-neutral-200 rounded-lg px-4 flex items-center gap-2.5 bg-white hover:border-neutral-400 focus-within:border-2 focus-within:border-[#2D5F4F] focus-within:shadow-[0_0_0_3px_rgba(45,95,79,0.1)] transition-all cursor-pointer">
                  <Calendar className="w-5 h-5 text-[#2D5F4F] flex-shrink-0 pointer-events-none" />
                  <input
                    id="check-in"
                    type="date"
                    value={checkIn}
                    onChange={(e) => setCheckIn(e.target.value)}
                    min={format(new Date(), 'yyyy-MM-dd')}
                    className="flex-1 text-[15px] text-[#2C2C2C] border-none outline-none bg-transparent cursor-pointer w-full"
                    required
                  />
                </div>
              </div>

              {/* Check-out Date */}
              <div className="flex-1 w-full md:w-auto">
                <label htmlFor="check-out" className="block text-xs font-semibold text-neutral-600 mb-1.5">
                  Check-out
                </label>
                <div className="relative h-14 border border-neutral-200 rounded-lg px-4 flex items-center gap-2.5 bg-white hover:border-neutral-400 focus-within:border-2 focus-within:border-[#2D5F4F] focus-within:shadow-[0_0_0_3px_rgba(45,95,79,0.1)] transition-all cursor-pointer">
                  <Calendar className="w-5 h-5 text-[#2D5F4F] flex-shrink-0 pointer-events-none" />
                  <input
                    id="check-out"
                    type="date"
                    value={checkOut}
                    onChange={(e) => setCheckOut(e.target.value)}
                    min={checkIn}
                    className="flex-1 text-[15px] text-[#2C2C2C] border-none outline-none bg-transparent cursor-pointer w-full"
                    required
                  />
                </div>
              </div>

              {/* Guests Selector */}
              <div className="w-full md:w-[140px] relative">
                <label className="block text-xs font-semibold text-neutral-600 mb-1.5">
                  Guests
                </label>
                <button
                  type="button"
                  onClick={() => setShowGuestDropdown(!showGuestDropdown)}
                  className="w-full h-14 border border-neutral-200 rounded-lg px-4 flex items-center gap-2.5 bg-white hover:border-neutral-400 focus:border-2 focus:border-[#2D5F4F] focus:shadow-[0_0_0_3px_rgba(45,95,79,0.1)] transition-all cursor-pointer"
                >
                  <Users className="w-5 h-5 text-[#2D5F4F] flex-shrink-0" />
                  <span className="flex-1 text-[15px] text-[#2C2C2C] text-left">
                    {guests} {guests === 1 ? 'guest' : 'guests'}
                  </span>
                </button>
                
                {showGuestDropdown && (
                  <>
                    <div 
                      className="fixed inset-0 z-10" 
                      onClick={() => setShowGuestDropdown(false)}
                    />
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-neutral-200 rounded-lg shadow-lg z-20 p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-neutral-900">Adults</span>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (guests > 1) setGuests(guests - 1);
                            }}
                            className="w-8 h-8 rounded-full border border-neutral-300 flex items-center justify-center hover:bg-neutral-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={guests <= 1}
                          >
                            <span className="text-neutral-600">−</span>
                          </button>
                          <span className="w-8 text-center font-semibold text-neutral-900">{guests}</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (guests < 10) setGuests(guests + 1);
                            }}
                            className="w-8 h-8 rounded-full border border-neutral-300 flex items-center justify-center hover:bg-neutral-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={guests >= 10}
                          >
                            <span className="text-neutral-600">+</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Search Button */}
              <button
                type="submit"
                disabled={isSearching}
                className="w-full md:w-[140px] h-[52px] md:h-14 bg-[#C87859] hover:bg-[#B87849] text-white text-base font-semibold rounded-lg flex items-center justify-center gap-2 transition-all duration-200 hover:shadow-[0_4px_12px_rgba(200,120,89,0.3)] hover:-translate-y-[1px] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSearching ? (
                  <>
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Searching...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-[18px] h-[18px]" />
                    <span>Search</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Right Column - Image Side */}
      <div className="w-full md:w-[50%] lg:w-[45%] h-[400px] md:h-auto relative overflow-hidden">
        {heroImageUrl ? (
          <img
            src={heroImageUrl}
            alt="Telluride luxury accommodation"
            className="w-full h-full object-cover"
            loading="eager"
          />
        ) : (
          <div className="w-full h-full bg-[#2D5F4F]" />
        )}
      </div>
    </section>
  );
}

