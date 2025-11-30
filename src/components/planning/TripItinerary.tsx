'use client';

import { useState } from 'react';
import { 
  Calendar, MapPin, Users, Snowflake, Hotel, Compass, CalendarCheck,
  Printer, Download, Share2, X, ExternalLink, Clock, Star,
  CreditCard, ChevronDown, ChevronUp
} from 'lucide-react';
import { useTripPlannerStore } from '@/stores/tripPlannerStore';
import { format, parseISO } from 'date-fns';

interface TripItineraryProps {
  onExportImage: () => void;
}

export function TripItinerary({ onExportImage }: TripItineraryProps) {
  const { 
    selectedHotel,
    selectedActivities,
    selectedEvents,
    liftTickets,
    tripDates,
    getTotalCost,
    budgetTotal,
    removeHotel,
    removeActivity,
    removeEvent,
  } = useTripPlannerStore();

  const [expanded, setExpanded] = useState(true);
  const totalCost = getTotalCost();
  const budgetRemaining = budgetTotal - totalCost;
  const budgetUsedPercent = budgetTotal > 0 ? Math.min((totalCost / budgetTotal) * 100, 100) : 0;
  
  const hasSelections = selectedHotel || selectedActivities.length > 0 || selectedEvents.length > 0 || (liftTickets && liftTickets.totalCost > 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return format(parseISO(dateStr), 'MMM d, yyyy');
  };

  const handleShare = async () => {
    const shareText = generateShareText();
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My Telluride Trip',
          text: shareText,
          url: window.location.href,
        });
      } catch (err) {
        copyToClipboard(shareText);
      }
    } else {
      copyToClipboard(shareText);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Trip details copied to clipboard!');
  };

  const generateShareText = () => {
    let text = `My Telluride Trip\n`;
    if (tripDates.checkIn && tripDates.checkOut) {
      text += `${formatDate(tripDates.checkIn)} - ${formatDate(tripDates.checkOut)}\n\n`;
    }
    
    if (selectedHotel) {
      text += `Hotel: ${selectedHotel.name}\n`;
    }
    
    if (liftTickets && liftTickets.totalCost > 0) {
      text += `Skiing: ${liftTickets.skiDays} day${liftTickets.skiDays > 1 ? 's' : ''}\n`;
    }
    
    if (selectedActivities.length > 0) {
      text += `\nActivities:\n`;
      selectedActivities.forEach(a => {
        text += `  - ${a.name}\n`;
      });
    }
    
    if (selectedEvents.length > 0) {
      text += `\nEvents:\n`;
      selectedEvents.forEach(e => {
        text += `  - ${e.name} (${formatDate(e.date)})\n`;
      });
    }
    
    text += `\nTotal: ${formatCurrency(totalCost)}\n`;
    text += `\nPlanned on TellurideInsider.com`;
    
    return text;
  };

  const handlePrint = () => {
    window.print();
  };

  if (!hasSelections) {
    return (
      <div className="bg-gradient-to-br from-neutral-50 to-neutral-100 rounded-2xl border border-neutral-200 p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-neutral-200 flex items-center justify-center">
          <Compass className="w-8 h-8 text-neutral-400" />
        </div>
        <h3 className="font-bold text-neutral-700 text-lg mb-2">Your Trip Itinerary</h3>
        <p className="text-neutral-500 text-sm max-w-xs mx-auto">
          Start building your trip by selecting a hotel, activities, and events from the options below.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-neutral-200 shadow-xl overflow-hidden print:shadow-none print:border-none">
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Your Telluride Trip</h3>
              {tripDates.checkIn && tripDates.checkOut && (
                <p className="text-primary-100 text-sm">
                  {formatDate(tripDates.checkIn)} - {formatDate(tripDates.checkOut)}
                </p>
              )}
            </div>
          </div>
          
          <button 
            className="lg:hidden p-2 hover:bg-white/20 rounded-lg transition-colors"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>

        <div className="bg-white/10 rounded-xl p-4">
          <div className="flex justify-between items-center text-sm mb-2">
            <span className="text-primary-100">Budget Used</span>
            <span className="font-bold">{formatCurrency(totalCost)} / {formatCurrency(budgetTotal)}</span>
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

      <div className={`transition-all duration-300 ${expanded ? 'max-h-[2000px]' : 'max-h-0 overflow-hidden lg:max-h-[2000px]'}`}>
        <div className="divide-y divide-neutral-100">
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
                    className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-neutral-900 line-clamp-1">{selectedHotel.name}</h4>
                  <p className="text-xs text-neutral-500 mb-1">
                    {selectedHotel.nights} night{selectedHotel.nights > 1 ? 's' : ''} @ {formatCurrency(selectedHotel.pricePerNight)}/night
                  </p>
                  <p className="text-sm font-bold text-primary-600">{formatCurrency(selectedHotel.totalPrice)}</p>
                </div>
                <div className="flex flex-col gap-1">
                  <a 
                    href={selectedHotel.bookingUrl}
                    className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                    title="View details"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  <button
                    onClick={removeHotel}
                    className="p-2 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Remove"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {liftTickets && liftTickets.totalCost > 0 && (
            <div className="p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-neutral-500 mb-3">
                <Snowflake className="w-4 h-4" />
                <span>Lift Tickets</span>
              </div>
              
              <div className="bg-blue-50 rounded-xl p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold text-neutral-900">
                      {liftTickets.skiDays} Day{liftTickets.skiDays > 1 ? 's' : ''} of Skiing
                    </h4>
                    <p className="text-xs text-neutral-500 mt-1">
                      {liftTickets.adultSkiers > 0 && `${liftTickets.adultSkiers} adult${liftTickets.adultSkiers > 1 ? 's' : ''}`}
                      {liftTickets.adultSkiers > 0 && liftTickets.childSkiers > 0 && ' + '}
                      {liftTickets.childSkiers > 0 && `${liftTickets.childSkiers} child${liftTickets.childSkiers > 1 ? 'ren' : ''}`}
                      {(liftTickets.adultSkiers > 0 || liftTickets.childSkiers > 0) && liftTickets.toddlerSkiers > 0 && ' + '}
                      {liftTickets.toddlerSkiers > 0 && `${liftTickets.toddlerSkiers} under 5 (free)`}
                    </p>
                    {liftTickets.discount > 0 && (
                      <p className="text-xs text-green-600 font-medium mt-1">
                        {liftTickets.discount}% multi-day discount applied
                      </p>
                    )}
                  </div>
                  <p className="font-bold text-primary-600 text-lg">{formatCurrency(liftTickets.totalCost)}</p>
                </div>
                
                <a 
                  href="https://tellurideskiresort.com/plan-your-trip/lift-tickets/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 flex items-center justify-center gap-2 w-full py-2 px-4 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  Purchase Tickets <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          )}

          {selectedActivities.length > 0 && (
            <div className="p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-neutral-500 mb-3">
                <Compass className="w-4 h-4" />
                <span>Activities ({selectedActivities.length})</span>
              </div>
              
              <div className="space-y-3">
                {selectedActivities.map((activity) => (
                  <div key={activity.id} className="flex gap-3 bg-neutral-50 rounded-xl p-3">
                    {activity.image && (
                      <img 
                        src={activity.image} 
                        alt={activity.name}
                        className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-neutral-900 text-sm line-clamp-2">{activity.name}</h4>
                      <div className="flex items-center gap-2 mt-1 text-xs text-neutral-500">
                        {activity.duration && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {activity.duration}
                          </span>
                        )}
                        {activity.rating && (
                          <span className="flex items-center gap-1">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                            {activity.rating.toFixed(1)}
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-semibold text-secondary-600 mt-1">{formatCurrency(activity.totalPrice)}</p>
                    </div>
                    <div className="flex flex-col gap-1">
                      <a 
                        href={activity.bookingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-secondary-600 hover:bg-secondary-50 rounded-lg transition-colors"
                        title="Book on Viator"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                      <button
                        onClick={() => removeActivity(activity.id)}
                        className="p-2 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Remove"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedEvents.length > 0 && (
            <div className="p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-neutral-500 mb-3">
                <CalendarCheck className="w-4 h-4" />
                <span>Events ({selectedEvents.length})</span>
              </div>
              
              <div className="space-y-2">
                {selectedEvents.map((event) => (
                  <div key={event.id} className="flex items-center gap-3 bg-purple-50 rounded-xl p-3">
                    <div className="w-12 h-12 rounded-lg bg-purple-600 text-white flex flex-col items-center justify-center flex-shrink-0">
                      <span className="text-[10px] font-semibold uppercase">
                        {format(parseISO(event.date), 'MMM')}
                      </span>
                      <span className="text-lg font-bold leading-none">
                        {format(parseISO(event.date), 'd')}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-neutral-900 text-sm line-clamp-1">{event.name}</h4>
                      <p className="text-xs text-green-600 font-medium">Free Event</p>
                    </div>
                    <div className="flex gap-1">
                      <a 
                        href={event.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-purple-600 hover:bg-purple-100 rounded-lg transition-colors"
                        title="Event details"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                      <button
                        onClick={() => removeEvent(event.id)}
                        className="p-2 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Remove"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="bg-neutral-50 p-4 border-t border-neutral-200">
          <div className="space-y-2 text-sm">
            {selectedHotel && (
              <div className="flex justify-between">
                <span className="text-neutral-600">Lodging</span>
                <span className="font-medium">{formatCurrency(selectedHotel.totalPrice)}</span>
              </div>
            )}
            {liftTickets && liftTickets.totalCost > 0 && (
              <div className="flex justify-between">
                <span className="text-neutral-600">Lift Tickets</span>
                <span className="font-medium">{formatCurrency(liftTickets.totalCost)}</span>
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
            <div className="pt-2 mt-2 border-t border-neutral-200 flex justify-between text-lg">
              <span className="font-bold text-neutral-900">Total</span>
              <span className="font-bold text-primary-600">{formatCurrency(totalCost)}</span>
            </div>
          </div>
        </div>

        <div className="p-4 bg-neutral-100 border-t border-neutral-200 print:hidden">
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={onExportImage}
              className="flex flex-col items-center gap-1 py-3 px-2 bg-white rounded-xl border border-neutral-200 hover:border-primary-300 hover:bg-primary-50 transition-colors"
            >
              <Download className="w-5 h-5 text-primary-600" />
              <span className="text-xs font-medium text-neutral-700">Save</span>
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
        </div>

        <div className="p-4 bg-amber-50 border-t border-amber-200 print:hidden">
          <div className="flex items-start gap-3">
            <CreditCard className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-amber-800">Booking Note</p>
              <p className="text-amber-700 text-xs mt-1">
                Hotels can be booked directly through our site. Activities are booked via Viator, 
                and lift tickets through the official Telluride Ski Resort website.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

