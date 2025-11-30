'use client';

/**
 * TripCalculator - Full Trip Planning Experience
 * Allows users to set budget, select hotels, activities, events,
 * and build a complete itinerary they can export
 */

import { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Users, Bed, Ticket, Utensils, Calendar,
  Minus, Plus, DollarSign, Calculator, Compass, Music,
  Mountain, ChevronDown, ChevronUp, Snowflake, Baby, User,
  Download, Share2, Printer, MapPin, ExternalLink, Check, X,
  Star, Clock, Hotel, CalendarCheck, Loader2
} from 'lucide-react';
import { format, addDays, differenceInDays, parseISO } from 'date-fns';
import { calculateLiftTicketCost, isWithinSkiSeason, getSeasonInfo, type SkierGroup } from '@/lib/lift-tickets';
import { getEventsInRange, type TellurideEvent } from '@/data/telluride-events';
import { useTripPlannerStore } from '@/stores/tripPlannerStore';
import type { LiteAPIHotel } from '@/lib/liteapi/types';
import html2canvas from 'html2canvas';

export interface TripCalculatorProps {
  defaultNights?: number;
  defaultGuests?: number;
  defaultBudget?: number;
  title?: string;
}

interface TripCategories {
  lodging: boolean;
  skiing: boolean;
  activities: boolean;
  dining: boolean;
  events: boolean;
}

interface BudgetAllocation {
  lodging: number;
  activities: number;
  dining: number;
}

export function TripCalculator({
  defaultNights = 4,
  defaultGuests = 2,
  defaultBudget = 5000,
  title = 'Plan Your Telluride Trip',
}: TripCalculatorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const itineraryRef = useRef<HTMLDivElement>(null);
  
  // Track if component is mounted (for hydration)
  const [isMounted, setIsMounted] = useState(false);
  
  // Get store functions
  const { 
    setTripDates, 
    setGuests: setStoreGuests, 
    setBudgetTotal,
    setLiftTickets,
    selectedHotel,
    selectedActivities,
    selectedEvents,
    liftTickets: storedLiftTickets,
    getTotalCost,
    clearTrip,
    selectHotel,
    removeHotel,
    addActivity,
    removeActivity,
    isActivitySelected,
    addEvent,
    removeEvent,
    isEventSelected,
  } = useTripPlannerStore();
  
  // Core trip details
  const [budget, setBudget] = useState(defaultBudget);
  const [guests, setGuests] = useState(defaultGuests);
  
  // Dates - initialized on client side to avoid hydration mismatch
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  
  // Category toggles
  const [categories, setCategories] = useState<TripCategories>({
    lodging: true,
    skiing: true,
    activities: true,
    dining: true,
    events: true,
  });
  
  // Skiing details
  const [adultSkiers, setAdultSkiers] = useState(defaultGuests);
  const [childSkiers, setChildSkiers] = useState(0);
  const [toddlerSkiers, setToddlerSkiers] = useState(0);
  const [skiDays, setSkiDays] = useState(defaultNights);
  
  // Budget allocation
  const [allocation, setAllocation] = useState<BudgetAllocation>({
    lodging: 65,
    activities: 20,
    dining: 15,
  });
  
  // UI state - collapse sections by default to reduce visual clutter
  const [showSkiDetails, setShowSkiDetails] = useState(false);
  const [showAllocation, setShowAllocation] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [activeSection, setActiveSection] = useState<'hotels' | 'activities' | 'events'>('hotels');
  const [showItinerary, setShowItinerary] = useState(false);
  
  // Hotels state
  const [hotels, setHotels] = useState<LiteAPIHotel[]>([]);
  const [hotelPrices, setHotelPrices] = useState<Record<string, number>>({});
  const [hotelsLoading, setHotelsLoading] = useState(true);
  
  // Activities state
  const [activities, setActivities] = useState<any[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(true);

  // Initialize dates and mount state on client side only
  useEffect(() => {
    setIsMounted(true);
    // Set default dates 14 days from now
    const defaultCheckIn = format(addDays(new Date(), 14), 'yyyy-MM-dd');
    const defaultCheckOut = format(addDays(new Date(), 14 + defaultNights), 'yyyy-MM-dd');
    setCheckIn(defaultCheckIn);
    setCheckOut(defaultCheckOut);
  }, [defaultNights]);

  // Sync with store (only after mount)
  useEffect(() => {
    if (!isMounted || !checkIn || !checkOut) return;
    setTripDates({ checkIn, checkOut });
    setStoreGuests(guests);
    setBudgetTotal(budget);
  }, [checkIn, checkOut, guests, budget, isMounted]);

  // Calculate nights
  const nights = useMemo(() => {
    if (!checkIn || !checkOut) return defaultNights;
    try {
      const diff = differenceInDays(parseISO(checkOut), parseISO(checkIn));
      return Math.max(1, diff);
    } catch {
      return defaultNights;
    }
  }, [checkIn, checkOut, defaultNights]);

  // Check ski season
  const tripInSkiSeason = useMemo(() => {
    if (!checkIn || !checkOut) return true; // Default to ski season
    return isWithinSkiSeason(checkIn, checkOut);
  }, [checkIn, checkOut]);

  // Calculate lift ticket costs
  const liftTicketCalc = useMemo(() => {
    if (!categories.skiing || !tripInSkiSeason || !checkIn || !checkOut) return null;
    const skiers: SkierGroup = { adults: adultSkiers, children: childSkiers, toddlers: toddlerSkiers };
    return calculateLiftTicketCost(checkIn, checkOut, skiers, skiDays);
  }, [categories.skiing, tripInSkiSeason, checkIn, checkOut, adultSkiers, childSkiers, toddlerSkiers, skiDays]);

  // Update store with lift ticket info
  useEffect(() => {
    if (liftTicketCalc && (adultSkiers > 0 || childSkiers > 0)) {
      setLiftTickets({
        skiDays,
        adultSkiers,
        childSkiers,
        toddlerSkiers,
        totalCost: liftTicketCalc.totalCost,
        discount: liftTicketCalc.savings > 0 ? Math.round((liftTicketCalc.savings / (liftTicketCalc.totalCost + liftTicketCalc.savings)) * 100) : 0,
      });
    } else {
      setLiftTickets({
        skiDays: 0,
        adultSkiers: 0,
        childSkiers: 0,
        toddlerSkiers: 0,
        totalCost: 0,
        discount: 0,
      });
    }
  }, [liftTicketCalc, skiDays, adultSkiers, childSkiers, toddlerSkiers]);

  // Calculate budget breakdown
  const budgetBreakdown = useMemo(() => {
    const fixedCosts = liftTicketCalc?.totalCost || 0;
    const remainingBudget = Math.max(0, budget - fixedCosts);
    
    const enabledCategories = {
      lodging: categories.lodging,
      activities: categories.activities,
      dining: categories.dining,
    };
    
    const totalAllocation = Object.entries(enabledCategories)
      .filter(([_, enabled]) => enabled)
      .reduce((sum, [key]) => sum + allocation[key as keyof BudgetAllocation], 0);
    
    const normalizedAllocation = {
      lodging: categories.lodging ? (allocation.lodging / totalAllocation) * 100 : 0,
      activities: categories.activities ? (allocation.activities / totalAllocation) * 100 : 0,
      dining: categories.dining ? (allocation.dining / totalAllocation) * 100 : 0,
    };

    return {
      fixedCosts,
      remainingBudget,
      lodging: {
        total: Math.round(remainingBudget * normalizedAllocation.lodging / 100),
        perNight: Math.round((remainingBudget * normalizedAllocation.lodging / 100) / nights),
      },
      activities: {
        total: Math.round(remainingBudget * normalizedAllocation.activities / 100),
        perPerson: Math.round((remainingBudget * normalizedAllocation.activities / 100) / guests),
      },
      dining: {
        total: Math.round(remainingBudget * normalizedAllocation.dining / 100),
        perPersonPerDay: Math.round((remainingBudget * normalizedAllocation.dining / 100) / (guests * nights)),
      },
    };
  }, [budget, liftTicketCalc, categories, allocation, nights, guests]);

  // Get events in date range
  const tripEvents = useMemo(() => {
    if (!categories.events || !checkIn || !checkOut) return [];
    return getEventsInRange(checkIn, checkOut);
  }, [categories.events, checkIn, checkOut]);

  // Fetch hotels from search API then get rates
  useEffect(() => {
    if (!isMounted || !categories.lodging || !checkIn || !checkOut) return;
    
    let cancelled = false;
    
    const fetchHotels = async () => {
      setHotelsLoading(true);
      try {
        // Step 1: Get hotel list
        const searchParams = new URLSearchParams({
          cityName: 'Telluride',
          countryCode: 'US',
          limit: '100',
        });
        
        const hotelsRes = await fetch(`/api/hotels/search?${searchParams}`);
        if (!hotelsRes.ok || cancelled) return;
        
        const hotelsData = await hotelsRes.json();
        let hotelList: LiteAPIHotel[] = hotelsData.data || [];
        
        // Filter to hotels with images and sort by rating
        hotelList = hotelList
          .filter(h => h.images && h.images.length > 0)
          .sort((a, b) => {
            const ratingA = a.review_score || 0;
            const ratingB = b.review_score || 0;
            const countA = a.review_count || 0;
            const countB = b.review_count || 0;
            const scoreA = ratingA * Math.log10(countA + 1);
            const scoreB = ratingB * Math.log10(countB + 1);
            return scoreB - scoreA;
          })
          .slice(0, 8);
        
        if (cancelled) return;
        setHotels(hotelList);
        
        // Step 2: Get rates for these hotels
        if (hotelList.length > 0) {
          const hotelIds = hotelList.map(h => h.hotel_id).join(',');
          const ratesParams = new URLSearchParams({
            hotelIds,
            checkIn,
            checkOut,
            adults: guests.toString(),
          });
          
          let currentPrices: Record<string, number> = {};
          
          const ratesRes = await fetch(`/api/hotels/min-rates?${ratesParams}`);
          if (ratesRes.ok && !cancelled) {
            const ratesData = await ratesRes.json();
            
            // Calculate nights for per-night price
            const nightsCount = Math.max(1, differenceInDays(parseISO(checkOut), parseISO(checkIn)));
            
            if (ratesData?.data && Array.isArray(ratesData.data)) {
              ratesData.data.forEach((item: { hotelId?: string; price?: number }) => {
                if (item.hotelId && item.price && item.price > 0) {
                  currentPrices[item.hotelId] = Math.round(item.price / nightsCount);
                }
              });
            }
            
            if (!cancelled) {
              setHotelPrices(currentPrices);
            }
          }
          
          // Step 3: Get fallback prices from pricing API + star-rating estimates
          if (!cancelled) {
            try {
              const pricingRes = await fetch('/api/hotels/pricing');
              const pricingData = pricingRes.ok ? await pricingRes.json() : { hotels: {} };
              const fallbackPrices: Record<string, number> = { ...currentPrices };
              
              hotelList.forEach(hotel => {
                if (!fallbackPrices[hotel.hotel_id] || fallbackPrices[hotel.hotel_id] === 0) {
                  // First try: use pricing database
                  const hotelPricing = pricingData.hotels?.[hotel.hotel_id];
                  if (hotelPricing) {
                    // Use typicalMinPrice as the "from" price (conservative estimate)
                    fallbackPrices[hotel.hotel_id] = hotelPricing.typicalMinPrice;
                  } else {
                    // Second fallback: estimate based on star rating
                    // These are conservative "from" prices for Telluride area
                    const starRating = hotel.star_rating || 3;
                    const starBasedEstimates: Record<number, number> = {
                      1: 120,  // Budget
                      2: 150,  // Economy
                      3: 200,  // Mid-range
                      4: 400,  // Upper mid-range
                      5: 700,  // Luxury
                    };
                    fallbackPrices[hotel.hotel_id] = starBasedEstimates[Math.min(5, Math.max(1, starRating))] || 250;
                  }
                }
              });
              
              if (!cancelled) {
                setHotelPrices(fallbackPrices);
              }
            } catch (e) {
              // Even on error, provide star-rating based estimates so prices always show
              const emergencyFallback: Record<string, number> = { ...currentPrices };
              hotelList.forEach(hotel => {
                if (!emergencyFallback[hotel.hotel_id] || emergencyFallback[hotel.hotel_id] === 0) {
                  const starRating = hotel.star_rating || 3;
                  const estimates: Record<number, number> = { 1: 120, 2: 150, 3: 200, 4: 400, 5: 700 };
                  emergencyFallback[hotel.hotel_id] = estimates[Math.min(5, Math.max(1, starRating))] || 250;
                }
              });
              if (!cancelled) {
                setHotelPrices(emergencyFallback);
              }
              console.warn('Failed to fetch fallback prices, using star-rating estimates');
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch hotels:', error);
      } finally {
        if (!cancelled) {
          setHotelsLoading(false);
        }
      }
    };
    
    fetchHotels();
    
    return () => {
      cancelled = true;
    };
  }, [checkIn, checkOut, guests, categories.lodging, isMounted]);

  // Fetch activities from Viator
  useEffect(() => {
    if (!isMounted || !categories.activities) return;
    
    let cancelled = false;
    
    const fetchActivities = async () => {
      setActivitiesLoading(true);
      try {
        // Use the correct Viator search endpoint - get activities without price filter
        // then filter client-side to show more results
        const params = new URLSearchParams({
          count: '20',
        });
        const res = await fetch(`/api/viator/search?${params}`);
        if (res.ok && !cancelled) {
          const data = await res.json();
          // Sort by price and take first 8 within budget
          const products = (data.products || [])
            .sort((a: any, b: any) => {
              const priceA = a.pricing?.summary?.fromPrice || 0;
              const priceB = b.pricing?.summary?.fromPrice || 0;
              return priceA - priceB;
            })
            .slice(0, 8);
          setActivities(products);
        }
      } catch (error) {
        console.error('Failed to fetch activities:', error);
      } finally {
        if (!cancelled) {
          setActivitiesLoading(false);
        }
      }
    };
    
    fetchActivities();
    
    return () => {
      cancelled = true;
    };
  }, [categories.activities, isMounted]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Date handlers
  const handleCheckInChange = (newCheckIn: string) => {
    setCheckIn(newCheckIn);
    const checkInDate = parseISO(newCheckIn);
    const checkOutDate = parseISO(checkOut);
    if (checkOutDate <= checkInDate) {
      setCheckOut(format(addDays(checkInDate, 1), 'yyyy-MM-dd'));
    }
  };

  const handleCheckOutChange = (newCheckOut: string) => {
    const checkInDate = parseISO(checkIn);
    const newCheckOutDate = parseISO(newCheckOut);
    if (newCheckOutDate > checkInDate) {
      setCheckOut(newCheckOut);
    }
  };

  // Category toggle
  const toggleCategory = (category: keyof TripCategories) => {
    if (category === 'lodging') return;
    setCategories(prev => ({ ...prev, [category]: !prev[category] }));
  };

  // Allocation adjustment
  const adjustAllocation = (category: keyof BudgetAllocation, delta: number) => {
    const newValue = Math.max(10, Math.min(80, allocation[category] + delta));
    const diff = newValue - allocation[category];
    if (diff === 0) return;

    const others = (Object.keys(allocation) as (keyof BudgetAllocation)[]).filter(k => k !== category);
    const totalOther = others.reduce((sum, k) => sum + allocation[k], 0);
    
    const newAllocation = { ...allocation, [category]: newValue };
    others.forEach(k => {
      newAllocation[k] = Math.max(10, Math.round(allocation[k] - (diff * allocation[k] / totalOther)));
    });

    const total = Object.values(newAllocation).reduce((a, b) => a + b, 0);
    (Object.keys(newAllocation) as (keyof BudgetAllocation)[]).forEach(k => {
      newAllocation[k] = Math.round(newAllocation[k] * 100 / total);
    });

    setAllocation(newAllocation);
  };

  // Export functions
  const handleExportImage = async () => {
    if (!itineraryRef.current) return;
    setIsExporting(true);
    
    try {
      const canvas = await html2canvas(itineraryRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
      });
      
      const link = document.createElement('a');
      link.download = `telluride-trip-${format(parseISO(checkIn), 'MMM-d')}-${format(parseISO(checkOut), 'MMM-d')}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleShare = async () => {
    const totalCost = getTotalCost();
    let shareText = `🏔️ My Telluride Trip\n`;
    shareText += `📅 ${format(parseISO(checkIn), 'MMM d')} - ${format(parseISO(checkOut), 'MMM d, yyyy')}\n`;
    shareText += `👥 ${guests} travelers • ${nights} nights\n\n`;
    
    if (selectedHotel) {
      shareText += `🏨 ${selectedHotel.name}\n`;
    }
    if (storedLiftTickets && storedLiftTickets.totalCost > 0) {
      shareText += `🎿 ${storedLiftTickets.skiDays} days of skiing\n`;
    }
    if (selectedActivities.length > 0) {
      shareText += `\n🎯 Activities:\n`;
      selectedActivities.forEach(a => shareText += `  • ${a.name}\n`);
    }
    if (selectedEvents.length > 0) {
      shareText += `\n🎉 Events:\n`;
      selectedEvents.forEach(e => shareText += `  • ${e.name}\n`);
    }
    
    shareText += `\n💰 Total: ${formatCurrency(totalCost)}\n`;
    shareText += `\nPlan your trip: tellurideinsider.com/plan-your-trip`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My Telluride Trip',
          text: shareText,
          url: window.location.href,
        });
      } catch (err) {
        await navigator.clipboard.writeText(shareText);
        alert('Trip details copied to clipboard!');
      }
    } else {
      await navigator.clipboard.writeText(shareText);
      alert('Trip details copied to clipboard!');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Hotel selection handler
  const handleHotelSelect = (hotel: LiteAPIHotel) => {
    const isSelected = selectedHotel?.id === hotel.hotel_id;
    if (isSelected) {
      removeHotel();
    } else {
      // Handle different possible image formats from API
      const firstImage = hotel.images?.[0] as { url?: string; variants?: { url?: string }[] } | undefined;
      const imageUrl = firstImage?.url || firstImage?.variants?.[0]?.url || '';
      const price = hotelPrices[hotel.hotel_id] || budgetBreakdown.lodging.perNight;
      // Handle different possible address formats from API  
      const hotelAddress = hotel.address as { line1?: string; full?: string; city?: string } | undefined;
      selectHotel({
        id: hotel.hotel_id,
        name: hotel.name || 'Unknown Hotel',
        image: imageUrl,
        pricePerNight: price,
        totalPrice: price * nights,
        address: hotelAddress?.line1 || hotelAddress?.full || '',
        rating: hotel.review_score || 0,
        checkIn,
        checkOut,
        nights,
        bookingUrl: `/places-to-stay/${hotel.hotel_id}?checkIn=${checkIn}&checkOut=${checkOut}&adults=${guests}&rooms=1`,
      });
    }
  };

  // Activity selection handler
  const handleActivitySelect = (activity: any) => {
    const isSelected = isActivitySelected(activity.productCode);
    if (isSelected) {
      removeActivity(activity.productCode);
    } else {
      const price = activity.pricing?.summary?.fromPrice || 0;
      const imageUrl = activity.images?.[0]?.variants?.find((v: any) => v.width >= 400)?.url || 
                       activity.images?.[0]?.variants?.[0]?.url || '';
      const duration = activity.duration?.fixedDurationInMinutes;
      addActivity({
        id: activity.productCode,
        name: activity.title,
        image: imageUrl,
        price,
        totalPrice: price * guests,
        duration: duration ? formatDuration(duration) : undefined,
        rating: activity.reviews?.combinedAverageRating,
        bookingUrl: activity.productUrl || `https://www.viator.com/tours/${activity.productCode}`,
      });
    }
  };

  // Event selection handler
  const handleEventSelect = (event: TellurideEvent) => {
    const isSelected = isEventSelected(event.id);
    if (isSelected) {
      removeEvent(event.id);
    } else {
      addEvent({
        id: event.id,
        name: event.name,
        date: event.date,
        description: event.description,
        type: event.type,
        url: event.url,
        isFree: true,
      });
    }
  };

  const formatDuration = (minutes: number) => {
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
    return `${minutes}m`;
  };

  const budgetPresets = [3000, 5000, 7500, 10000];
  const minCheckIn = useMemo(() => format(addDays(new Date(), 1), 'yyyy-MM-dd'), []);
  const seasonInfo = getSeasonInfo();
  
  // Only calculate costs after mount to avoid hydration issues
  const totalCost = isMounted ? getTotalCost() : 0;
  const hasSelections = isMounted && (selectedHotel || selectedActivities.length > 0 || selectedEvents.length > 0 || (storedLiftTickets && storedLiftTickets.totalCost > 0));
  const budgetRemaining = budget - totalCost;
  const budgetUsedPercent = budget > 0 ? Math.min((totalCost / budget) * 100, 100) : 0;

  // Show loading state until dates are initialized
  if (!isMounted || !checkIn || !checkOut) {
  return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
          <p className="text-neutral-500">Loading trip planner...</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      {/* Main Layout */}
      <div className="flex flex-col xl:flex-row gap-8">
        {/* Left Side: Planning Controls */}
        <div className="flex-1 min-w-0 space-y-8">
          {/* Header Card */}
          <div className="bg-white rounded-2xl shadow-lg border border-neutral-200 overflow-hidden">
            <div className="bg-gradient-to-r from-primary-600 via-primary-700 to-primary-800 text-white p-5 sm:p-6">
        <div className="flex items-center gap-4">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white/10 backdrop-blur rounded-xl flex items-center justify-center flex-shrink-0">
                  <Calculator className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
          </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl sm:text-2xl font-bold">{title}</h2>
                  <p className="text-primary-100 text-sm hidden sm:block">Set your budget, choose your experiences, build your itinerary</p>
          </div>
                <img 
                  src="/favicon-icon.png" 
                  alt="Telluride Insider" 
                  className="h-10 w-auto opacity-90 hidden md:block"
                />
        </div>
            </div>

            {/* Trip Basics */}
            <div className="p-5 sm:p-6">
              {/* Budget, Dates, Travelers - Better grid layout */}
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {/* Budget */}
          <div>
            <label className="block text-sm font-semibold text-neutral-700 mb-2">
                    <DollarSign className="w-4 h-4 inline mr-1" />
                    Total Budget
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
              <input
                type="number"
                value={budget}
                onChange={(e) => setBudget(Math.max(1000, parseInt(e.target.value) || 0))}
                className="w-full pl-10 pr-4 py-3 text-xl font-bold bg-white border-2 border-neutral-200 rounded-xl focus:border-primary-500 focus:outline-none transition-all tabular-nums"
                min="1000"
                step="500"
              />
            </div>
            <div className="flex gap-2 mt-2 flex-wrap">
              {budgetPresets.map((preset) => (
                <button
                  key={preset}
                  onClick={() => setBudget(preset)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                          budget === preset ? 'bg-primary-600 text-white' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                  }`}
                >
                  {formatCurrency(preset)}
                </button>
              ))}
            </div>
          </div>

                {/* Dates */}
          <div>
            <label className="block text-sm font-semibold text-neutral-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Travel Dates
            </label>
            <div className="flex gap-2">
              <div className="flex-1">
                <input
                  type="date"
                  value={checkIn}
                  onChange={(e) => handleCheckInChange(e.target.value)}
                  min={minCheckIn}
                        className="w-full px-3 py-3 bg-white border-2 border-neutral-200 rounded-xl text-sm focus:border-primary-500 focus:outline-none"
                />
                <span className="text-xs text-neutral-500 mt-1 block">Check-in</span>
              </div>
              <div className="flex-1">
                <input
                  type="date"
                  value={checkOut}
                  onChange={(e) => handleCheckOutChange(e.target.value)}
                  min={format(addDays(parseISO(checkIn), 1), 'yyyy-MM-dd')}
                        className="w-full px-3 py-3 bg-white border-2 border-neutral-200 rounded-xl text-sm focus:border-primary-500 focus:outline-none"
                />
                <span className="text-xs text-neutral-500 mt-1 block">Check-out</span>
              </div>
            </div>
            <div className="text-center mt-2">
              <span className="text-sm font-medium text-primary-700">{nights} {nights === 1 ? 'night' : 'nights'}</span>
            </div>
          </div>

          {/* Travelers */}
          <div>
            <label className="block text-sm font-semibold text-neutral-700 mb-2">
              <Users className="w-4 h-4 inline mr-1" />
                    Total Travelers
            </label>
            <div className="flex items-center justify-between bg-white border-2 border-neutral-200 rounded-xl px-4 py-3">
              <button 
                onClick={() => setGuests(Math.max(1, guests - 1))} 
                className="w-10 h-10 rounded-lg bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center transition-colors"
              >
                <Minus className="w-5 h-5" />
              </button>
              <span className="text-2xl font-bold tabular-nums">{guests}</span>
              <button 
                      onClick={() => setGuests(Math.min(20, guests + 1))} 
                className="w-10 h-10 rounded-lg bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center transition-colors"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
            <div className="text-center mt-2">
              <span className="text-sm text-neutral-500">{formatCurrency(budget / guests)} per person</span>
            </div>
          </div>
            </div>
          </div>
        </div>

          {/* Category Toggles - Separate card for visual hierarchy */}
          <div className="bg-white rounded-2xl shadow-lg border border-neutral-200 overflow-hidden">
            <div className="p-5 sm:p-6">
              <h3 className="text-base font-bold text-neutral-800 mb-4">What's included in your trip?</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
                {[
                  { key: 'lodging', label: 'Lodging', icon: Bed, locked: true },
                  { key: 'skiing', label: 'Skiing', icon: Mountain },
                  { key: 'activities', label: 'Activities', icon: Compass },
                  { key: 'dining', label: 'Dining', icon: Utensils },
                  { key: 'events', label: 'Events', icon: Music },
                ].map(({ key, label, icon: Icon, locked }) => (
                  <button
                    key={key}
                    onClick={() => toggleCategory(key as keyof TripCategories)}
                    disabled={locked}
                    className={`flex flex-col items-center gap-2 p-3 sm:p-4 rounded-xl text-sm font-medium transition-all ${
                      categories[key as keyof TripCategories]
                        ? 'bg-primary-600 text-white shadow-md'
                        : 'bg-neutral-50 text-neutral-600 border border-neutral-200 hover:border-primary-300 hover:bg-primary-50'
                    } ${locked ? 'cursor-default' : 'cursor-pointer'}`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{label}</span>
                    {locked && <span className="text-[10px] opacity-75">(required)</span>}
                  </button>
                ))}
              </div>

              {/* Skiing Details - Collapsible */}
              {categories.skiing && (
                <div className="border-t border-neutral-100 mt-6 pt-5">
                  <button 
                    onClick={() => setShowSkiDetails(!showSkiDetails)}
                    className="w-full flex items-center justify-between text-left group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-sky-100 flex items-center justify-center group-hover:bg-sky-200 transition-colors">
                        <Snowflake className="w-5 h-5 text-sky-600" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-neutral-800">Skiing Details</h3>
                        {liftTicketCalc && (adultSkiers > 0 || childSkiers > 0) && !showSkiDetails && (
                          <p className="text-xs text-sky-600 font-semibold">{formatCurrency(liftTicketCalc.totalCost)} estimated</p>
                        )}
                        {!tripInSkiSeason && (
                          <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded">Off-season</span>
                        )}
                      </div>
                    </div>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${showSkiDetails ? 'bg-sky-100' : 'bg-neutral-100 group-hover:bg-neutral-200'}`}>
                      {showSkiDetails ? <ChevronUp className="w-4 h-4 text-sky-600" /> : <ChevronDown className="w-4 h-4 text-neutral-500" />}
                    </div>
                  </button>
                
                {showSkiDetails && (
                  <div className="mt-5 pl-13 space-y-4">
                    {!tripInSkiSeason ? (
                      <p className="text-sm text-amber-700 bg-amber-50 p-4 rounded-xl border border-amber-200">
                        Your dates are outside ski season ({seasonInfo.start} to {seasonInfo.end}).
                      </p>
                    ) : (
                      <div className="bg-sky-50 rounded-xl p-4 border border-sky-100">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                          <div className="text-center">
                            <label className="block text-xs font-medium text-neutral-600 mb-2">
                              <User className="w-3 h-3 inline mr-1" />Adults (13+)
                            </label>
                            <div className="flex items-center justify-center gap-1">
                              <button onClick={() => setAdultSkiers(Math.max(0, adultSkiers - 1))} className="w-7 h-7 rounded bg-white border border-neutral-200 flex items-center justify-center hover:bg-neutral-50 text-neutral-600"><Minus className="w-3.5 h-3.5" /></button>
                              <span className="text-lg font-bold w-8 text-center tabular-nums">{adultSkiers}</span>
                              <button onClick={() => setAdultSkiers(Math.min(guests, adultSkiers + 1))} className="w-7 h-7 rounded bg-white border border-neutral-200 flex items-center justify-center hover:bg-neutral-50 text-neutral-600"><Plus className="w-3.5 h-3.5" /></button>
                            </div>
                          </div>
                          <div className="text-center">
                            <label className="block text-xs font-medium text-neutral-600 mb-2">
                              <User className="w-3 h-3 inline mr-1" />Kids (6-12)
                            </label>
                            <div className="flex items-center justify-center gap-1">
                              <button onClick={() => setChildSkiers(Math.max(0, childSkiers - 1))} className="w-7 h-7 rounded bg-white border border-neutral-200 flex items-center justify-center hover:bg-neutral-50 text-neutral-600"><Minus className="w-3.5 h-3.5" /></button>
                              <span className="text-lg font-bold w-8 text-center tabular-nums">{childSkiers}</span>
                              <button onClick={() => setChildSkiers(Math.min(guests - adultSkiers, childSkiers + 1))} className="w-7 h-7 rounded bg-white border border-neutral-200 flex items-center justify-center hover:bg-neutral-50 text-neutral-600"><Plus className="w-3.5 h-3.5" /></button>
                            </div>
                          </div>
                          <div className="text-center">
                            <label className="block text-xs font-medium text-neutral-600 mb-2">
                              <Baby className="w-3 h-3 inline mr-1" />Under 5
                            </label>
                            <div className="flex items-center justify-center gap-1">
                              <button onClick={() => setToddlerSkiers(Math.max(0, toddlerSkiers - 1))} className="w-7 h-7 rounded bg-white border border-neutral-200 flex items-center justify-center hover:bg-neutral-50 text-neutral-600"><Minus className="w-3.5 h-3.5" /></button>
                              <span className="text-lg font-bold w-8 text-center tabular-nums">{toddlerSkiers}</span>
                              <button onClick={() => setToddlerSkiers(Math.min(guests - adultSkiers - childSkiers, toddlerSkiers + 1))} className="w-7 h-7 rounded bg-white border border-neutral-200 flex items-center justify-center hover:bg-neutral-50 text-neutral-600"><Plus className="w-3.5 h-3.5" /></button>
                            </div>
                            <span className="text-[10px] text-green-600 font-medium">FREE</span>
                          </div>
                          <div className="text-center">
                            <label className="block text-xs font-medium text-neutral-600 mb-2">
                              <Ticket className="w-3 h-3 inline mr-1" />Ski Days
                            </label>
                            <div className="flex items-center justify-center gap-1">
                              <button onClick={() => setSkiDays(Math.max(1, skiDays - 1))} className="w-7 h-7 rounded bg-white border border-neutral-200 flex items-center justify-center hover:bg-neutral-50 text-neutral-600"><Minus className="w-3.5 h-3.5" /></button>
                              <span className="text-lg font-bold w-8 text-center tabular-nums">{skiDays}</span>
                              <button onClick={() => setSkiDays(Math.min(nights, skiDays + 1))} className="w-7 h-7 rounded bg-white border border-neutral-200 flex items-center justify-center hover:bg-neutral-50 text-neutral-600"><Plus className="w-3.5 h-3.5" /></button>
                            </div>
                          </div>
                        </div>

                        {liftTicketCalc && (adultSkiers > 0 || childSkiers > 0) && (
                          <div className="mt-4 pt-4 border-t border-sky-200 flex items-center justify-between">
                            <div>
                              <p className="text-xs text-neutral-600">Estimated Cost</p>
                              <p className="text-xl font-bold text-sky-700">{formatCurrency(liftTicketCalc.totalCost)}</p>
                            </div>
                            <div className="text-right text-xs text-neutral-500">
                              {liftTicketCalc.breakdown.adults.count > 0 && <p>{liftTicketCalc.breakdown.adults.count} adult{liftTicketCalc.breakdown.adults.count > 1 ? 's' : ''} × {skiDays} day{skiDays > 1 ? 's' : ''}</p>}
                              {liftTicketCalc.breakdown.children.count > 0 && <p>{liftTicketCalc.breakdown.children.count} kid{liftTicketCalc.breakdown.children.count > 1 ? 's' : ''} × {skiDays} day{skiDays > 1 ? 's' : ''}</p>}
                              {liftTicketCalc.savings > 0 && <p className="text-green-600 font-semibold">Save {formatCurrency(liftTicketCalc.savings)}</p>}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Budget Allocation - Collapsible */}
            <div className="border-t border-neutral-100 mt-6 pt-5">
              <button 
                onClick={() => setShowAllocation(!showAllocation)}
                className="w-full flex items-center justify-between text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center group-hover:bg-primary-200 transition-colors">
                    <DollarSign className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-neutral-800">Budget Allocation</h3>
                    <p className="text-xs text-neutral-500">Adjust how your budget is divided</p>
                  </div>
                </div>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${showAllocation ? 'bg-primary-100' : 'bg-neutral-100 group-hover:bg-neutral-200'}`}>
                  {showAllocation ? <ChevronUp className="w-4 h-4 text-primary-600" /> : <ChevronDown className="w-4 h-4 text-neutral-500" />}
                </div>
              </button>
              
              {showAllocation && (
                <div className="mt-5 space-y-4">
                  {/* Visual Bar */}
                  <div className="h-6 rounded-full overflow-hidden flex shadow-inner bg-neutral-200">
                    {budgetBreakdown.fixedCosts > 0 && (
                      <div className="bg-sky-500 flex items-center justify-center text-white text-xs font-medium" style={{ width: `${(budgetBreakdown.fixedCosts / budget) * 100}%` }}>Ski</div>
                    )}
                    {categories.lodging && (
                      <div className="bg-primary-500 flex items-center justify-center text-white text-xs font-medium" style={{ width: `${(budgetBreakdown.lodging.total / budget) * 100}%` }}>Stay</div>
                    )}
                    {categories.activities && (
                      <div className="bg-secondary-500 flex items-center justify-center text-white text-xs font-medium" style={{ width: `${(budgetBreakdown.activities.total / budget) * 100}%` }}>Do</div>
                    )}
                    {categories.dining && (
                      <div className="bg-accent-500 flex items-center justify-center text-white text-xs font-medium" style={{ width: `${(budgetBreakdown.dining.total / budget) * 100}%` }}>Eat</div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {categories.lodging && (
                      <div className="text-center p-3 bg-primary-50 rounded-xl border border-primary-100">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <Bed className="w-4 h-4 text-primary-600" />
                          <span className="text-xs font-semibold text-neutral-700">Lodging</span>
                        </div>
                        <div className="text-lg font-bold text-neutral-900">{formatCurrency(budgetBreakdown.lodging.perNight)}</div>
                        <div className="text-xs text-neutral-500 mb-2">per night</div>
                        <div className="flex justify-center gap-1">
                          <button onClick={() => adjustAllocation('lodging', -5)} className="w-6 h-6 rounded bg-white border border-neutral-200 flex items-center justify-center hover:bg-neutral-50"><Minus className="w-3 h-3" /></button>
                          <span className="w-10 text-center text-sm font-semibold tabular-nums">{allocation.lodging}%</span>
                          <button onClick={() => adjustAllocation('lodging', 5)} className="w-6 h-6 rounded bg-white border border-neutral-200 flex items-center justify-center hover:bg-neutral-50"><Plus className="w-3 h-3" /></button>
                        </div>
                      </div>
                    )}
                    {categories.activities && (
                      <div className="text-center p-3 bg-secondary-50 rounded-xl border border-secondary-100">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <Compass className="w-4 h-4 text-secondary-600" />
                          <span className="text-xs font-semibold text-neutral-700">Activities</span>
                        </div>
                        <div className="text-lg font-bold text-neutral-900">{formatCurrency(budgetBreakdown.activities.perPerson)}</div>
                        <div className="text-xs text-neutral-500 mb-2">per person</div>
                        <div className="flex justify-center gap-1">
                          <button onClick={() => adjustAllocation('activities', -5)} className="w-6 h-6 rounded bg-white border border-neutral-200 flex items-center justify-center hover:bg-neutral-50"><Minus className="w-3 h-3" /></button>
                          <span className="w-10 text-center text-sm font-semibold tabular-nums">{allocation.activities}%</span>
                          <button onClick={() => adjustAllocation('activities', 5)} className="w-6 h-6 rounded bg-white border border-neutral-200 flex items-center justify-center hover:bg-neutral-50"><Plus className="w-3 h-3" /></button>
                        </div>
                      </div>
                    )}
                    {categories.dining && (
                      <div className="text-center p-3 bg-accent-50 rounded-xl border border-accent-100">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <Utensils className="w-4 h-4 text-accent-600" />
                          <span className="text-xs font-semibold text-neutral-700">Dining</span>
                        </div>
                        <div className="text-lg font-bold text-neutral-900">{formatCurrency(budgetBreakdown.dining.perPersonPerDay)}</div>
                        <div className="text-xs text-neutral-500 mb-2">per person/day</div>
                        <div className="flex justify-center gap-1">
                          <button onClick={() => adjustAllocation('dining', -5)} className="w-6 h-6 rounded bg-white border border-neutral-200 flex items-center justify-center hover:bg-neutral-50"><Minus className="w-3 h-3" /></button>
                          <span className="w-10 text-center text-sm font-semibold tabular-nums">{allocation.dining}%</span>
                          <button onClick={() => adjustAllocation('dining', 5)} className="w-6 h-6 rounded bg-white border border-neutral-200 flex items-center justify-center hover:bg-neutral-50"><Plus className="w-3 h-3" /></button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
          </div>

          {/* Selection Tabs - Browse hotels, activities, events */}
          <div className="bg-white rounded-2xl shadow-lg border border-neutral-200 overflow-hidden">
            <div className="flex border-b border-neutral-200 bg-neutral-50">
              {[
                { id: 'hotels', label: 'Hotels', icon: Hotel, count: selectedHotel ? 1 : 0 },
                { id: 'activities', label: 'Activities', icon: Compass, count: selectedActivities.length },
                { id: 'events', label: 'Events', icon: Music, count: selectedEvents.length },
              ].map(({ id, label, icon: Icon, count }) => (
                  <button 
                  key={id}
                  onClick={() => setActiveSection(id as 'hotels' | 'activities' | 'events')}
                  className={`flex-1 flex items-center justify-center gap-2 py-4 px-3 font-medium transition-all relative ${
                    activeSection === id 
                      ? 'text-primary-700 bg-white border-b-2 border-primary-600' 
                      : 'text-neutral-500 hover:text-neutral-700 hover:bg-white/50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="hidden sm:inline text-sm">{label}</span>
                  {count > 0 && (
                    <span className={`min-w-[20px] h-5 px-1.5 rounded-full text-xs flex items-center justify-center font-bold ${
                      activeSection === id ? 'bg-primary-600 text-white' : 'bg-neutral-300 text-white'
                    }`}>
                      {count}
                    </span>
                  )}
                  </button>
              ))}
                </div>

            <div className="p-5 sm:p-6">
              {/* Hotels Section */}
              {activeSection === 'hotels' && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-lg text-neutral-900">
                      Select Your Hotel
                    </h3>
                    <span className="text-sm text-neutral-500">
                      Budget: up to {formatCurrency(budgetBreakdown.lodging.perNight)}/night
                    </span>
              </div>

                  {hotelsLoading ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-center gap-2 text-neutral-500 py-8">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Loading hotels...</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[1,2,3,4].map(i => (
                          <div key={i} className="animate-pulse bg-neutral-100 rounded-xl h-72" />
            ))}
          </div>
        </div>
                  ) : hotels.length > 0 ? (
                    (() => {
                      const maxBudget = budgetBreakdown.lodging.perNight;
                      // Sort hotels: within budget first (sorted by price desc), then over budget (sorted by price asc)
                      const sortedHotels = [...hotels].sort((a, b) => {
                        const priceA = hotelPrices[a.hotel_id] || 200;
                        const priceB = hotelPrices[b.hotel_id] || 200;
                        const aInBudget = priceA <= maxBudget;
                        const bInBudget = priceB <= maxBudget;
                        
                        // In-budget hotels come first
                        if (aInBudget && !bInBudget) return -1;
                        if (!aInBudget && bInBudget) return 1;
                        
                        // Within same category, sort by rating×reviews score
                        const scoreA = (a.review_score || 0) * Math.log10((a.review_count || 0) + 1);
                        const scoreB = (b.review_score || 0) * Math.log10((b.review_count || 0) + 1);
                        return scoreB - scoreA;
                      });
                      
                      const inBudgetHotels = sortedHotels.filter(h => (hotelPrices[h.hotel_id] || 200) <= maxBudget);
                      const overBudgetHotels = sortedHotels.filter(h => (hotelPrices[h.hotel_id] || 200) > maxBudget);
                      
                      return (
                        <div className="space-y-6">
                          {/* In-budget hotels */}
                          {inBudgetHotels.length > 0 && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {inBudgetHotels.map((hotel) => {
                                const isSelected = selectedHotel?.id === hotel.hotel_id;
                                const firstImage = hotel.images?.[0] as { url?: string; variants?: { url?: string }[] } | undefined;
                                const imageUrl = firstImage?.url || firstImage?.variants?.[0]?.url;
                                const price = hotelPrices[hotel.hotel_id] || 200;
                                const rating = hotel.review_score || 0;
                                
                                return (
                                  <div 
                                    key={hotel.hotel_id}
                                    className={`relative bg-white rounded-xl border-2 overflow-hidden transition-all duration-300 ${
                                      isSelected 
                                        ? 'border-primary-500 shadow-lg ring-2 ring-primary-200' 
                                        : 'border-neutral-200 hover:border-primary-300 hover:shadow-md'
                                    }`}
                                  >
                                    {isSelected && (
                                      <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary-600 text-white text-sm font-bold shadow-lg">
                                        <Check className="w-4 h-4" />
                                        Selected
                                      </div>
                                    )}

                                    <div className="relative h-40 bg-neutral-100">
                                      {imageUrl ? (
                                        <img
                                          src={imageUrl}
                                          alt={hotel.name || 'Hotel'}
                                          className="w-full h-full object-cover"
                                          loading="lazy"
                                        />
                                      ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-neutral-100 to-neutral-200">
                                          <Hotel className="w-8 h-8 text-neutral-300" />
                                        </div>
                                      )}
                                      
                                      {/* Price badge - green tint for in-budget */}
                                      <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur px-3 py-1.5 rounded-lg shadow-lg border border-green-200">
                                        <div className="flex items-baseline gap-1">
                                          <span className="text-xs text-green-600">From</span>
                                          <span className="text-lg font-bold text-green-700">{formatCurrency(price)}</span>
                                          <span className="text-xs text-green-600">/night</span>
                                        </div>
                                      </div>
                                    </div>

                                    <div className="p-4">
                                      <h4 className="font-bold text-neutral-900 text-lg mb-1 line-clamp-1">{hotel.name}</h4>
                                      
                                      <div className="flex items-center gap-3 text-sm text-neutral-600 mb-3">
                                        {rating > 0 && (
                                          <div className="flex items-center gap-1">
                                            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                                            <span className="font-semibold">{rating.toFixed(1)}</span>
                                          </div>
                                        )}
                                        <p className="text-xs text-neutral-500">
                                          ~{formatCurrency(price * nights)} for {nights} night{nights > 1 ? 's' : ''}
                                        </p>
                                      </div>

                                      <button
                                        onClick={() => handleHotelSelect(hotel)}
                                        className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-semibold transition-all ${
                                          isSelected
                                            ? 'bg-primary-100 text-primary-700 hover:bg-primary-200'
                                            : 'bg-primary-600 text-white hover:bg-primary-700'
                                        }`}
                                      >
                                        {isSelected ? (
                                          <>
                                            <X className="w-4 h-4" />
                                            Remove Selection
                                          </>
                                        ) : (
                                          <>
                                            <Plus className="w-4 h-4" />
                                            Select This Hotel
                                          </>
                                        )}
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                          
                          {/* Over-budget hotels section */}
                          {overBudgetHotels.length > 0 && (
                            <>
                              <div className="border-t border-neutral-200 pt-4">
                                <p className="text-sm text-neutral-500 mb-4 flex items-center gap-2">
                                  <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                                  Above your {formatCurrency(maxBudget)}/night budget
                                </p>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 opacity-75">
                                {overBudgetHotels.slice(0, 4).map((hotel) => {
                                  const isSelected = selectedHotel?.id === hotel.hotel_id;
                                  const firstImage = hotel.images?.[0] as { url?: string; variants?: { url?: string }[] } | undefined;
                                  const imageUrl = firstImage?.url || firstImage?.variants?.[0]?.url;
                                  const price = hotelPrices[hotel.hotel_id] || 200;
                                  const rating = hotel.review_score || 0;
                                  const overBy = price - maxBudget;
                                  
                                  return (
                                    <div 
                                      key={hotel.hotel_id}
                                      className={`relative bg-white rounded-xl border-2 overflow-hidden transition-all duration-300 ${
                                        isSelected 
                                          ? 'border-primary-500 shadow-lg ring-2 ring-primary-200 opacity-100' 
                                          : 'border-amber-200 hover:border-amber-300 hover:shadow-md hover:opacity-100'
                                      }`}
                                    >
                                      {/* Over budget badge */}
                                      <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5 px-2 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-medium shadow">
                                        +{formatCurrency(overBy)}/night
                                      </div>
                                      
                                      {isSelected && (
                                        <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary-600 text-white text-sm font-bold shadow-lg">
                                          <Check className="w-4 h-4" />
                                        </div>
                                      )}

                                      <div className="relative h-40 bg-neutral-100">
                                        {imageUrl ? (
                                          <img
                                            src={imageUrl}
                                            alt={hotel.name || 'Hotel'}
                                            className="w-full h-full object-cover"
                                            loading="lazy"
                                          />
                                        ) : (
                                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-neutral-100 to-neutral-200">
                                            <Hotel className="w-8 h-8 text-neutral-300" />
                                          </div>
                                        )}
                                        
                                        {/* Price badge - amber tint for over-budget */}
                                        <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur px-3 py-1.5 rounded-lg shadow-lg border border-amber-200">
                                          <div className="flex items-baseline gap-1">
                                            <span className="text-xs text-amber-600">From</span>
                                            <span className="text-lg font-bold text-amber-700">{formatCurrency(price)}</span>
                                            <span className="text-xs text-amber-600">/night</span>
                                          </div>
                                        </div>
                                      </div>

                                      <div className="p-4">
                                        <h4 className="font-bold text-neutral-900 text-lg mb-1 line-clamp-1">{hotel.name}</h4>
                                        
                                        <div className="flex items-center gap-3 text-sm text-neutral-600 mb-3">
                                          {rating > 0 && (
                                            <div className="flex items-center gap-1">
                                              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                                              <span className="font-semibold">{rating.toFixed(1)}</span>
                                            </div>
                                          )}
                                          <p className="text-xs text-neutral-500">
                                            ~{formatCurrency(price * nights)} for {nights} night{nights > 1 ? 's' : ''}
                                          </p>
                                        </div>

                                        <button
                                          onClick={() => handleHotelSelect(hotel)}
                                          className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-semibold transition-all ${
                                            isSelected
                                              ? 'bg-primary-100 text-primary-700 hover:bg-primary-200'
                                              : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                                          }`}
                                        >
                                          {isSelected ? (
                                            <>
                                              <X className="w-4 h-4" />
                                              Remove
                                            </>
                                          ) : (
                                            <>
                                              <Plus className="w-4 h-4" />
                                              Select Anyway
                                            </>
                                          )}
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </>
                          )}
                          
                          {/* No hotels in budget message */}
                          {inBudgetHotels.length === 0 && (
                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
                              <p className="text-amber-700 text-sm">
                                No hotels found within your {formatCurrency(maxBudget)}/night budget. 
                                Consider increasing your budget or adjusting the lodging allocation.
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })()
                  ) : (
                    <div className="text-center py-12 text-neutral-500">
                      <Hotel className="w-12 h-12 mx-auto mb-3 text-neutral-300" />
                      <p>No hotels found for your dates. Try different dates.</p>
                    </div>
                  )}

                  <div className="mt-6 text-center">
                    <a 
                      href={`/places-to-stay?checkin=${checkIn}&checkout=${checkOut}&guests=${guests}`}
                      className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-semibold"
                    >
                      Browse All Hotels <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              )}

              {/* Activities Section */}
              {activeSection === 'activities' && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-lg text-neutral-900">
                      Add Activities
                    </h3>
                    <span className="text-sm text-neutral-500">
                      Budget: {formatCurrency(budgetBreakdown.activities.perPerson)}/person
                    </span>
                  </div>

                  {activitiesLoading ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-center gap-2 text-neutral-500 py-8">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Loading activities...</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[1,2,3,4].map(i => (
                          <div key={i} className="animate-pulse bg-neutral-100 rounded-xl h-64" />
                        ))}
                      </div>
                    </div>
                  ) : activities.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {activities.map((activity) => {
                        const isSelected = isActivitySelected(activity.productCode);
                        const price = activity.pricing?.summary?.fromPrice || 0;
                        const imageUrl = activity.images?.[0]?.variants?.find((v: any) => v.width >= 400)?.url || 
                                         activity.images?.[0]?.variants?.[0]?.url;
                        const rating = activity.reviews?.combinedAverageRating;
                        const reviewCount = activity.reviews?.totalReviews;
                        const duration = activity.duration?.fixedDurationInMinutes;
                        
                        return (
                          <div 
                            key={activity.productCode}
                            className={`relative bg-white rounded-xl border-2 overflow-hidden transition-all duration-300 ${
                              isSelected 
                                ? 'border-secondary-500 shadow-lg ring-2 ring-secondary-200' 
                                : 'border-neutral-200 hover:border-secondary-300 hover:shadow-md'
                            }`}
                          >
                            {isSelected && (
                              <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary-600 text-white text-sm font-bold shadow-lg">
                                <Check className="w-4 h-4" />
                                Added
                              </div>
                            )}

                            <div className="relative h-36 bg-neutral-100">
                              {imageUrl ? (
                                <img
                                  src={imageUrl}
                                  alt={activity.title}
                                  className="w-full h-full object-cover"
                                  loading="lazy"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-neutral-100 to-neutral-200">
                                  <Compass className="w-8 h-8 text-neutral-300" />
                                </div>
                              )}
                              
                              {price > 0 && (
                                <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur px-3 py-1.5 rounded-lg shadow-lg">
                                  <div className="flex items-baseline gap-1">
                                    <span className="text-xs text-neutral-500">from</span>
                                    <span className="font-bold text-neutral-900">{formatCurrency(price)}</span>
                                  </div>
                                </div>
                              )}
                            </div>

                            <div className="p-4">
                              <h4 className="font-bold text-neutral-900 text-sm mb-2 line-clamp-2 min-h-[2.5rem]">{activity.title}</h4>
                              
                              <div className="flex items-center gap-3 text-xs text-neutral-600 mb-3">
                                {rating && (
                                  <div className="flex items-center gap-1">
                                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                                    <span className="font-semibold">{rating.toFixed(1)}</span>
                                    {reviewCount && <span className="text-neutral-400">({reviewCount})</span>}
                                  </div>
                                )}
                                {duration && (
                                  <div className="flex items-center gap-1">
                                    <Clock className="w-3.5 h-3.5 text-neutral-400" />
                                    <span>{formatDuration(duration)}</span>
                                  </div>
                                )}
                              </div>

                              <div className="flex items-center gap-1 text-xs text-neutral-400 mb-3">
                                <ExternalLink className="w-3 h-3" />
                                <span>Books on Viator</span>
                              </div>

                              <button
                                onClick={() => handleActivitySelect(activity)}
                                className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-semibold text-sm transition-all ${
                                  isSelected
                                    ? 'bg-secondary-100 text-secondary-700 hover:bg-secondary-200'
                                    : 'bg-secondary-600 text-white hover:bg-secondary-700'
                                }`}
                              >
                                {isSelected ? (
                                  <>
                                    <X className="w-4 h-4" />
                                    Remove
                                  </>
                                ) : (
                                  <>
                                    <Plus className="w-4 h-4" />
                                    Add to Trip
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-neutral-500">
                      <Compass className="w-12 h-12 mx-auto mb-3 text-neutral-300" />
                      <p>No activities found. Check back later!</p>
                    </div>
                  )}

                  <div className="mt-6 text-center">
            <a
              href="/things-to-do"
                      className="inline-flex items-center gap-2 text-secondary-600 hover:text-secondary-700 font-semibold"
                    >
                      Browse All Activities <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              )}

              {/* Events Section */}
              {activeSection === 'events' && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-lg text-neutral-900">
                      Events During Your Trip
                    </h3>
                    <span className="text-sm text-neutral-500">
                      {format(parseISO(checkIn), 'MMM d')} - {format(parseISO(checkOut), 'MMM d')}
                    </span>
                  </div>

                  {tripEvents.length > 0 ? (
                    <div className="space-y-3">
                      {tripEvents.map((event) => {
                        const isSelected = isEventSelected(event.id);
                        const eventDate = parseISO(event.date);
                        
                        const getTypeColor = (type: string) => {
                          switch (type) {
                            case 'festival': return 'bg-purple-100 text-purple-700';
                            case 'concert': return 'bg-pink-100 text-pink-700';
                            case 'sports': return 'bg-blue-100 text-blue-700';
                            case 'art': return 'bg-amber-100 text-amber-700';
                            case 'community': return 'bg-green-100 text-green-700';
                            default: return 'bg-neutral-100 text-neutral-700';
                          }
                        };

                        return (
                          <div 
                            key={event.id}
                            className={`relative flex items-start gap-4 p-4 rounded-xl border-2 transition-all duration-300 ${
                              isSelected 
                                ? 'border-purple-500 bg-purple-50 shadow-md' 
                                : 'border-neutral-200 bg-white hover:border-purple-300 hover:bg-purple-50/50'
                            }`}
                          >
                            <div className={`flex-shrink-0 w-16 h-16 rounded-xl flex flex-col items-center justify-center ${
                              isSelected ? 'bg-purple-600 text-white' : 'bg-purple-100 text-purple-700'
                            }`}>
                              <span className="text-xs font-semibold uppercase">
                                {format(eventDate, 'MMM')}
                              </span>
                              <span className="text-2xl font-bold leading-none">
                                {format(eventDate, 'd')}
                              </span>
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2 mb-1">
                                <h4 className="font-semibold text-neutral-900 line-clamp-1">{event.name}</h4>
                                <span className={`flex-shrink-0 px-2 py-0.5 rounded text-xs font-medium capitalize ${getTypeColor(event.type)}`}>
                                  {event.type}
                                </span>
                              </div>
                              
                              <p className="text-sm text-neutral-600 line-clamp-2 mb-2">{event.description}</p>
                              
                              <div className="flex items-center gap-3">
                                <span className="text-xs text-green-600 font-medium">Free Event</span>
                                <a 
                                  href={event.url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-xs text-purple-600 hover:text-purple-700 flex items-center gap-1"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  Details <ExternalLink className="w-3 h-3" />
                                </a>
                              </div>
                            </div>

                            <button
                              onClick={() => handleEventSelect(event)}
                              className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                                isSelected
                                  ? 'bg-purple-600 text-white hover:bg-purple-700'
                                  : 'bg-neutral-100 text-neutral-500 hover:bg-purple-100 hover:text-purple-600'
                              }`}
                            >
                              {isSelected ? <Check className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-neutral-500">
                      <CalendarCheck className="w-12 h-12 mx-auto mb-3 text-neutral-300" />
                      <p>No events scheduled during your trip dates.</p>
                      <p className="text-sm mt-2">Try adjusting your dates to discover local events!</p>
                    </div>
                  )}

                  <div className="mt-6 text-center">
                    <a 
                      href="https://www.telluride.com/festivals-events/events/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 font-semibold"
                    >
                      View Full Event Calendar <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Itinerary Panel - Fixed with internal scroll */}
        <div className="xl:w-[380px] xl:flex-shrink-0">
          <div className="xl:sticky xl:top-4 xl:max-h-[calc(100vh-2rem)] flex flex-col">
            {/* Itinerary Card - Scrollable */}
            <div ref={itineraryRef} className="bg-white rounded-2xl shadow-lg border border-neutral-200 overflow-hidden flex flex-col xl:max-h-[calc(100vh-2rem)]">
              {/* Header */}
              <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">Your Itinerary</h3>
                      <p className="text-primary-100 text-sm">
                        {format(parseISO(checkIn), 'MMM d')} — {format(parseISO(checkOut), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                  <img 
                    src="/favicon-icon.png" 
                    alt="Telluride Insider" 
                    className="h-8 w-auto opacity-90"
                  />
                </div>

                {/* Budget Progress */}
                <div className="bg-white/10 rounded-xl p-4">
                  <div className="flex justify-between items-center text-sm mb-2">
                    <span className="text-primary-100">Budget Used</span>
                    <span className="font-bold">{formatCurrency(totalCost)} / {formatCurrency(budget)}</span>
                  </div>
                  <div className="h-3 bg-white/20 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        budgetUsedPercent > 100 ? 'bg-red-400' : 
                        budgetUsedPercent > 80 ? 'bg-amber-400' : 'bg-green-400'
                      }`}
                      style={{ width: `${Math.min(budgetUsedPercent, 100)}%` }}
                    />
                  </div>
                  <p className={`text-xs mt-2 ${budgetRemaining < 0 ? 'text-red-200' : 'text-primary-100'}`}>
                    {budgetRemaining >= 0 
                      ? `${formatCurrency(budgetRemaining)} remaining` 
                      : `${formatCurrency(Math.abs(budgetRemaining))} over budget`
                    }
                  </p>
                </div>
              </div>

              {!hasSelections ? (
                <div className="p-8 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-neutral-100 flex items-center justify-center">
                    <Compass className="w-8 h-8 text-neutral-400" />
                  </div>
                  <h4 className="font-bold text-neutral-700 mb-2">Start Building Your Trip</h4>
                  <p className="text-neutral-500 text-sm">
                    Select a hotel, add activities, and choose events to build your perfect itinerary.
                  </p>
                </div>
              ) : (
                <>
                  {/* Scrollable content area */}
                  <div className="divide-y divide-neutral-100 xl:overflow-y-auto xl:max-h-[40vh]">
                    {/* Hotel */}
                    {selectedHotel && (
                      <div className="p-4">
                        <div className="flex items-center gap-2 text-sm font-semibold text-neutral-500 mb-3">
                          <Hotel className="w-4 h-4" />
                          <span>Lodging</span>
                        </div>
                        
                        <div className="flex gap-3">
                          {selectedHotel.image && (
                            <img 
                              src={selectedHotel.image} 
                              alt={selectedHotel.name}
                              className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-neutral-900 text-sm line-clamp-1">{selectedHotel.name}</h4>
                            <p className="text-xs text-neutral-500">
                              {selectedHotel.nights} night{selectedHotel.nights > 1 ? 's' : ''} @ {formatCurrency(selectedHotel.pricePerNight)}/night
                            </p>
                            <p className="text-sm font-bold text-primary-600">{formatCurrency(selectedHotel.totalPrice)}</p>
                          </div>
                          <button
                            onClick={removeHotel}
                            className="p-1.5 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Lift Tickets */}
                    {storedLiftTickets && storedLiftTickets.totalCost > 0 && (
                      <div className="p-4">
                        <div className="flex items-center gap-2 text-sm font-semibold text-neutral-500 mb-3">
                          <Snowflake className="w-4 h-4" />
                          <span>Lift Tickets</span>
                        </div>
                        
                        <div className="bg-sky-50 rounded-xl p-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-semibold text-neutral-900 text-sm">
                                {storedLiftTickets.skiDays} Day{storedLiftTickets.skiDays > 1 ? 's' : ''} of Skiing
                              </h4>
                              <p className="text-xs text-neutral-500">
                                {storedLiftTickets.adultSkiers > 0 && `${storedLiftTickets.adultSkiers} adult${storedLiftTickets.adultSkiers > 1 ? 's' : ''}`}
                                {storedLiftTickets.adultSkiers > 0 && storedLiftTickets.childSkiers > 0 && ' + '}
                                {storedLiftTickets.childSkiers > 0 && `${storedLiftTickets.childSkiers} child${storedLiftTickets.childSkiers > 1 ? 'ren' : ''}`}
                              </p>
                            </div>
                            <p className="font-bold text-sky-700">{formatCurrency(storedLiftTickets.totalCost)}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Activities */}
                    {selectedActivities.length > 0 && (
                      <div className="p-4">
                        <div className="flex items-center gap-2 text-sm font-semibold text-neutral-500 mb-3">
              <Compass className="w-4 h-4" />
                          <span>Activities ({selectedActivities.length})</span>
                        </div>
                        
                        <div className="space-y-2">
                          {selectedActivities.map((activity) => (
                            <div key={activity.id} className="flex gap-3 bg-neutral-50 rounded-lg p-2">
                              {activity.image && (
                                <img 
                                  src={activity.image} 
                                  alt={activity.name}
                                  className="w-12 h-12 rounded object-cover flex-shrink-0"
                                />
                              )}
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-neutral-900 text-xs line-clamp-1">{activity.name}</h4>
                                <p className="text-xs font-semibold text-secondary-600">{formatCurrency(activity.totalPrice)}</p>
                              </div>
                              <button
                                onClick={() => removeActivity(activity.id)}
                                className="p-1 text-neutral-400 hover:text-red-500"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Events */}
                    {selectedEvents.length > 0 && (
                      <div className="p-4">
                        <div className="flex items-center gap-2 text-sm font-semibold text-neutral-500 mb-3">
                          <CalendarCheck className="w-4 h-4" />
                          <span>Events ({selectedEvents.length})</span>
                        </div>
                        
                        <div className="space-y-2">
                          {selectedEvents.map((event) => (
                            <div key={event.id} className="flex items-center gap-2 bg-purple-50 rounded-lg p-2">
                              <div className="w-10 h-10 rounded bg-purple-600 text-white flex flex-col items-center justify-center flex-shrink-0">
                                <span className="text-[8px] font-semibold uppercase">
                                  {format(parseISO(event.date), 'MMM')}
                                </span>
                                <span className="text-sm font-bold leading-none">
                                  {format(parseISO(event.date), 'd')}
                                </span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-neutral-900 text-xs line-clamp-1">{event.name}</h4>
                                <p className="text-xs text-green-600 font-medium">Free</p>
                              </div>
                              <button
                                onClick={() => removeEvent(event.id)}
                                className="p-1 text-neutral-400 hover:text-red-500"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Cost Summary */}
                  <div className="bg-neutral-50 p-4 border-t border-neutral-200">
                    <div className="space-y-1.5 text-sm">
                      {selectedHotel && (
                        <div className="flex justify-between">
                          <span className="text-neutral-600">Lodging</span>
                          <span className="font-medium">{formatCurrency(selectedHotel.totalPrice)}</span>
                        </div>
                      )}
                      {storedLiftTickets && storedLiftTickets.totalCost > 0 && (
                        <div className="flex justify-between">
                          <span className="text-neutral-600">Lift Tickets</span>
                          <span className="font-medium">{formatCurrency(storedLiftTickets.totalCost)}</span>
                        </div>
                      )}
                      {selectedActivities.length > 0 && (
                        <div className="flex justify-between">
                          <span className="text-neutral-600">Activities</span>
                          <span className="font-medium">
                            {formatCurrency(selectedActivities.reduce((sum, a) => sum + a.totalPrice, 0))}
                          </span>
                        </div>
                      )}
                      {selectedEvents.length > 0 && (
                        <div className="flex justify-between">
                          <span className="text-neutral-600">Events</span>
                          <span className="font-medium text-green-600">Free</span>
                        </div>
                      )}
                      <div className="pt-2 mt-2 border-t border-neutral-200 flex justify-between text-base">
                        <span className="font-bold text-neutral-900">Total</span>
                        <span className="font-bold text-primary-600">{formatCurrency(totalCost)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="p-4 bg-neutral-100 border-t border-neutral-200">
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={handleExportImage}
                        disabled={isExporting}
                        className="flex flex-col items-center gap-1 py-3 px-2 bg-white rounded-xl border border-neutral-200 hover:border-primary-300 hover:bg-primary-50 transition-colors disabled:opacity-50"
                      >
                        <Download className="w-5 h-5 text-primary-600" />
                        <span className="text-xs font-medium text-neutral-700">{isExporting ? '...' : 'Save'}</span>
                      </button>
                      <button
                        onClick={handleShare}
                        className="flex flex-col items-center gap-1 py-3 px-2 bg-white rounded-xl border border-neutral-200 hover:border-primary-300 hover:bg-primary-50 transition-colors"
                      >
                        <Share2 className="w-5 h-5 text-primary-600" />
                        <span className="text-xs font-medium text-neutral-700">Share</span>
                      </button>
                      <button
                        onClick={handlePrint}
                        className="flex flex-col items-center gap-1 py-3 px-2 bg-white rounded-xl border border-neutral-200 hover:border-primary-300 hover:bg-primary-50 transition-colors"
                      >
                        <Printer className="w-5 h-5 text-primary-600" />
                        <span className="text-xs font-medium text-neutral-700">Print</span>
                      </button>
                    </div>
                    
                    {hasSelections && (
                      <button
                        onClick={clearTrip}
                        className="w-full mt-2 py-2 text-sm text-neutral-500 hover:text-red-600 transition-colors"
                      >
                        Clear All Selections
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Booking Notes */}
            {hasSelections && (
              <div className="mt-4 bg-amber-50 rounded-xl p-4 border border-amber-200">
                <h4 className="font-semibold text-amber-800 text-sm mb-2">Booking Information</h4>
                <ul className="text-xs text-amber-700 space-y-1">
                  {selectedHotel && (
                    <li className="flex items-start gap-2">
                      <Hotel className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                      <span>Hotel can be booked directly on our site</span>
                    </li>
                  )}
                  {selectedActivities.length > 0 && (
                    <li className="flex items-start gap-2">
                      <Compass className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                      <span>Activities book through Viator</span>
                    </li>
                  )}
                  {storedLiftTickets && storedLiftTickets.totalCost > 0 && (
                    <li className="flex items-start gap-2">
                      <Snowflake className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                      <span>
                        <a 
                          href="https://tellurideskiresort.com/plan-your-trip/lift-tickets/" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-amber-800 underline hover:no-underline"
                        >
                          Purchase lift tickets
                        </a>
                        {' '}from official resort site
                      </span>
                    </li>
                  )}
                </ul>
          </div>
            )}
        </div>
        </div>
      </div>
    </div>
  );
}
