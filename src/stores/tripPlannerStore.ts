/**
 * Trip Planner Store
 * Zustand store for managing trip planning state including
 * selected hotels, activities, events, and lift tickets
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ============================================
// TYPES
// ============================================

export interface SelectedHotel {
  id: string;
  name: string;
  image: string;
  pricePerNight: number;
  totalPrice: number;
  address: string;
  rating: number;
  checkIn: string;
  checkOut: string;
  nights: number;
  bookingUrl: string;
}

export interface SelectedActivity {
  id: string;
  name: string;
  image: string;
  price: number;
  totalPrice: number;
  duration?: string;
  rating?: number;
  bookingUrl: string;
}

export interface SelectedEvent {
  id: string;
  name: string;
  date: string;
  description: string;
  type: string;
  url: string;
  isFree: boolean;
}

export interface LiftTicketSelection {
  skiDays: number;
  adultSkiers: number;
  childSkiers: number;
  toddlerSkiers: number;
  totalCost: number;
  discount: number;
}

export interface TripDates {
  checkIn: string;
  checkOut: string;
}

// ============================================
// STORE STATE
// ============================================

interface TripPlannerState {
  // Trip parameters
  tripDates: TripDates;
  guests: number;
  budgetTotal: number;
  
  // Selected items
  selectedHotel: SelectedHotel | null;
  selectedActivities: SelectedActivity[];
  selectedEvents: SelectedEvent[];
  liftTickets: LiftTicketSelection | null;
  
  // Actions - Trip Setup
  setTripDates: (dates: TripDates) => void;
  setGuests: (guests: number) => void;
  setBudgetTotal: (budget: number) => void;
  
  // Actions - Hotel
  selectHotel: (hotel: SelectedHotel) => void;
  removeHotel: () => void;
  
  // Actions - Activities
  addActivity: (activity: SelectedActivity) => void;
  removeActivity: (activityId: string) => void;
  isActivitySelected: (activityId: string) => boolean;
  
  // Actions - Events
  addEvent: (event: SelectedEvent) => void;
  removeEvent: (eventId: string) => void;
  isEventSelected: (eventId: string) => boolean;
  
  // Actions - Lift Tickets
  setLiftTickets: (tickets: LiftTicketSelection) => void;
  clearLiftTickets: () => void;
  
  // Actions - Utilities
  getTotalCost: () => number;
  clearTrip: () => void;
}

// ============================================
// STORE IMPLEMENTATION
// ============================================

export const useTripPlannerStore = create<TripPlannerState>()(
  persist(
    (set, get) => ({
      // Initial state
      tripDates: { checkIn: '', checkOut: '' },
      guests: 2,
      budgetTotal: 5000,
      selectedHotel: null,
      selectedActivities: [],
      selectedEvents: [],
      liftTickets: null,

      // Trip Setup
      setTripDates: (dates) => set({ tripDates: dates }),
      setGuests: (guests) => set({ guests }),
      setBudgetTotal: (budget) => set({ budgetTotal: budget }),

      // Hotel Actions
      selectHotel: (hotel) => set({ selectedHotel: hotel }),
      removeHotel: () => set({ selectedHotel: null }),

      // Activity Actions
      addActivity: (activity) => set((state) => ({
        selectedActivities: [...state.selectedActivities, activity]
      })),
      removeActivity: (activityId) => set((state) => ({
        selectedActivities: state.selectedActivities.filter(a => a.id !== activityId)
      })),
      isActivitySelected: (activityId) => {
        return get().selectedActivities.some(a => a.id === activityId);
      },

      // Event Actions
      addEvent: (event) => set((state) => ({
        selectedEvents: [...state.selectedEvents, event]
      })),
      removeEvent: (eventId) => set((state) => ({
        selectedEvents: state.selectedEvents.filter(e => e.id !== eventId)
      })),
      isEventSelected: (eventId) => {
        return get().selectedEvents.some(e => e.id === eventId);
      },

      // Lift Ticket Actions
      setLiftTickets: (tickets) => set({ liftTickets: tickets }),
      clearLiftTickets: () => set({ liftTickets: null }),

      // Utilities
      getTotalCost: () => {
        const state = get();
        let total = 0;
        
        // Add hotel cost
        if (state.selectedHotel) {
          total += state.selectedHotel.totalPrice;
        }
        
        // Add lift ticket cost
        if (state.liftTickets) {
          total += state.liftTickets.totalCost;
        }
        
        // Add activities cost
        total += state.selectedActivities.reduce((sum, a) => sum + a.totalPrice, 0);
        
        // Events are free, so we don't add them
        
        return total;
      },

      clearTrip: () => set({
        selectedHotel: null,
        selectedActivities: [],
        selectedEvents: [],
        liftTickets: null,
      }),
    }),
    {
      name: 'telluride-trip-planner',
      partialize: (state) => ({
        tripDates: state.tripDates,
        guests: state.guests,
        budgetTotal: state.budgetTotal,
        selectedHotel: state.selectedHotel,
        selectedActivities: state.selectedActivities,
        selectedEvents: state.selectedEvents,
        liftTickets: state.liftTickets,
      }),
    }
  )
);
