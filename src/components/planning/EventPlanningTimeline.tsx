'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Calendar, CheckCircle2, Circle, Clock, Users, Save } from 'lucide-react';

export interface EventPlanningTimelineProps {
  eventType?: 'wedding' | 'birthday' | 'corporate-retreat' | 'memorial' | 'celebration';
  eventDate?: string;
  groupSize?: number;
}

interface TimelineItem {
  id: string;
  monthsOut: number;
  task: string;
  description: string;
  completed: boolean;
}

const EVENT_TIMELINES: Record<string, Omit<TimelineItem, 'id' | 'completed'>[]> = {
  wedding: [
    { monthsOut: 12, task: 'Book Venue & Lodging', description: 'Reserve ceremony venue and group accommodations' },
    { monthsOut: 9, task: 'Send Save-the-Dates', description: 'Notify guests of dates and lodging options' },
    { monthsOut: 6, task: 'Book Activities', description: 'Reserve group activities and transportation' },
    { monthsOut: 3, task: 'Finalize Guest Count', description: 'Confirm final numbers for lodging and events' },
    { monthsOut: 1, task: 'Final Details', description: 'Confirm all reservations and send final reminders' },
  ],
  birthday: [
    { monthsOut: 6, task: 'Book Group Lodging', description: 'Reserve accommodations for all guests' },
    { monthsOut: 4, task: 'Plan Activities', description: 'Book group activities and dining reservations' },
    { monthsOut: 2, task: 'Send Invitations', description: 'Send invites with lodging and activity details' },
    { monthsOut: 1, task: 'Finalize Details', description: 'Confirm guest count and finalize all bookings' },
  ],
  'corporate-retreat': [
    { monthsOut: 6, task: 'Book Meeting Spaces', description: 'Reserve conference rooms and group lodging' },
    { monthsOut: 4, task: 'Plan Team Activities', description: 'Book group activities and team building events' },
    { monthsOut: 2, task: 'Send Details', description: 'Share itinerary and lodging information with team' },
    { monthsOut: 1, task: 'Final Confirmations', description: 'Confirm all bookings and send final details' },
  ],
  memorial: [
    { monthsOut: 3, task: 'Book Group Lodging', description: 'Reserve accommodations for family and guests' },
    { monthsOut: 2, task: 'Plan Gathering', description: 'Organize memorial service and group meals' },
    { monthsOut: 1, task: 'Finalize Arrangements', description: 'Confirm all details and notify attendees' },
  ],
  celebration: [
    { monthsOut: 4, task: 'Book Group Lodging', description: 'Reserve accommodations for all attendees' },
    { monthsOut: 3, task: 'Plan Activities', description: 'Book group activities and special events' },
    { monthsOut: 2, task: 'Send Invitations', description: 'Share event details and lodging options' },
    { monthsOut: 1, task: 'Final Confirmations', description: 'Confirm all bookings and send reminders', completed: false },
  ],
};

export function EventPlanningTimeline({
  eventType = 'celebration',
  eventDate,
  groupSize = 10,
}: EventPlanningTimelineProps) {
  const [size, setSize] = useState(groupSize);
  const [date, setDate] = useState(eventDate || '');
  const [timelineItems, setTimelineItems] = useState<TimelineItem[]>([]);
  const [progress, setProgress] = useState(0);

  // Initialize timeline on mount or type change
  useEffect(() => {
    const baseItems = EVENT_TIMELINES[eventType] || EVENT_TIMELINES.celebration;

    // Try to load from local storage
    const savedState = localStorage.getItem(`event-timeline-${eventType}`);
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        if (parsed.date) setDate(parsed.date);
        if (parsed.size) setSize(parsed.size);
        if (parsed.items) {
          setTimelineItems(parsed.items);
          return;
        }
      } catch (e) {
        console.error('Failed to load saved timeline');
      }
    }

    // Fallback to default
    setTimelineItems(
      baseItems.map((item, index) => ({
        ...item,
        id: `item-${index}`,
        completed: false,
      }))
    );
  }, [eventType]);

  // Calculate progress whenever items change
  useEffect(() => {
    if (timelineItems.length === 0) return;
    const completed = timelineItems.filter(i => i.completed).length;
    setProgress(Math.round((completed / timelineItems.length) * 100));
    
    // Save state
    localStorage.setItem(`event-timeline-${eventType}`, JSON.stringify({
      date,
      size,
      items: timelineItems
    }));
  }, [timelineItems, date, size, eventType]);

  const toggleItem = (id: string) => {
    setTimelineItems(prev => prev.map(item => 
      item.id === id ? { ...item, completed: !item.completed } : item
    ));
  };

  const calculateDueDate = (monthsOut: number) => {
    if (!date) return null;
    const event = new Date(date);
    const target = new Date(event);
    target.setMonth(target.getMonth() - monthsOut);
    return target;
  };

  const formatDate = (date: Date | null) => {
    if (!date) return 'Set event date';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getStatusColor = (monthsOut: number, isCompleted: boolean) => {
    if (isCompleted) return 'bg-green-100 text-green-700 border-green-200';
    
    if (!date) return 'bg-neutral-100 text-neutral-500 border-neutral-200';

    const dueDate = calculateDueDate(monthsOut);
    if (!dueDate) return 'bg-neutral-100 text-neutral-500 border-neutral-200';

    const today = new Date();
    const isOverdue = today > dueDate;
    const isNext = !isCompleted && !isOverdue && (dueDate.getTime() - today.getTime() < 30 * 24 * 60 * 60 * 1000); // Due within 30 days

    if (isOverdue) return 'bg-red-50 text-red-700 border-red-200';
    if (isNext) return 'bg-amber-50 text-amber-700 border-amber-200';
    return 'bg-neutral-50 text-neutral-700 border-neutral-200';
  };

  return (
    <Card className="my-8 border-2 border-primary-200 shadow-md">
      <CardHeader className="bg-neutral-50 border-b border-neutral-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Calendar className="w-6 h-6 text-primary-600" />
              {eventType.charAt(0).toUpperCase() + eventType.slice(1).replace('-', ' ')} Planner
            </CardTitle>
            <p className="text-neutral-600 text-sm mt-1">
              Track your planning progress and milestones
            </p>
          </div>
          
          {/* Progress Ring */}
          <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-full border border-neutral-200 shadow-sm">
            <div className="text-sm font-semibold text-neutral-900">Progress</div>
            <div className="w-32 h-2.5 bg-neutral-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary-600 transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-sm font-bold text-primary-700">{progress}%</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-8 pt-6">
        {/* Inputs */}
        <div className="grid gap-6 md:grid-cols-2 p-4 bg-neutral-50 rounded-xl border border-neutral-200">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2">
              Event Date
            </label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-white"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2">
              Estimated Guests
            </label>
            <Input
              type="number"
              min="5"
              max="200"
              value={size}
              onChange={(e) => setSize(parseInt(e.target.value) || 10)}
              className="w-full bg-white"
            />
          </div>
        </div>

        {/* Timeline */}
        <div className="relative space-y-4">
          {/* Vertical Line */}
          <div className="absolute left-8 top-4 bottom-4 w-0.5 bg-neutral-200 hidden md:block" />

          {timelineItems.map((item) => {
            const dueDate = calculateDueDate(item.monthsOut);
            const statusClass = getStatusColor(item.monthsOut, item.completed);
            
                  return (
              <div 
                key={item.id}
                onClick={() => toggleItem(item.id)}
                className={`relative flex flex-col md:flex-row gap-4 p-4 rounded-xl border-2 transition-all cursor-pointer group hover:shadow-md ${statusClass} ${
                  item.completed ? 'opacity-75' : 'opacity-100'
                }`}
              >
                {/* Checkbox Circle */}
                <div className="flex-shrink-0 md:ml-3 z-10 bg-white rounded-full">
                  {item.completed ? (
                    <CheckCircle2 className="w-8 h-8 text-green-500 fill-green-50" />
                  ) : (
                    <Circle className="w-8 h-8 text-neutral-300 group-hover:text-primary-500 transition-colors" />
                          )}
                        </div>

                <div className="flex-1">
                  <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-1">
                    <h3 className={`font-bold text-lg ${item.completed ? 'line-through text-neutral-500' : 'text-neutral-900'}`}>
                      {item.task}
                    </h3>
                    <span className="text-xs font-bold uppercase tracking-wider px-2 py-1 bg-white/50 rounded-md whitespace-nowrap">
                      {dueDate ? `Due: ${formatDate(dueDate)}` : `${item.monthsOut} Months Out`}
                    </span>
                  </div>
                  <p className="text-sm mt-1 opacity-90">
                    {item.description}
                  </p>
                      </div>
                    </div>
                  );
                })}
              </div>

        {/* Action Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-neutral-200">
          <div className="flex items-center gap-2 text-sm text-neutral-500">
            <Save className="w-4 h-4" />
            <span>Your progress is saved automatically</span>
            </div>

          <a
            href={`/places-to-stay?guests=${size}`}
            className="inline-flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-bold px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 w-full sm:w-auto"
          >
            Start Booking for {size} Guests →
          </a>
          </div>
      </CardContent>
    </Card>
  );
}
