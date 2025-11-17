'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { ArticleBookingWidget } from '@/components/blog/ArticleBookingWidget';
import { Calendar, CheckCircle2, Clock, Users } from 'lucide-react';

export interface EventPlanningTimelineProps {
  eventType?: 'wedding' | 'birthday' | 'corporate-retreat' | 'memorial' | 'celebration';
  eventDate?: string;
  groupSize?: number;
}

interface TimelineItem {
  monthsOut: number;
  task: string;
  description: string;
  completed: boolean;
}

const EVENT_TIMELINES: Record<string, TimelineItem[]> = {
  wedding: [
    { monthsOut: 12, task: 'Book Venue & Lodging', description: 'Reserve ceremony venue and group accommodations', completed: false },
    { monthsOut: 9, task: 'Send Save-the-Dates', description: 'Notify guests of dates and lodging options', completed: false },
    { monthsOut: 6, task: 'Book Activities', description: 'Reserve group activities and transportation', completed: false },
    { monthsOut: 3, task: 'Finalize Guest Count', description: 'Confirm final numbers for lodging and events', completed: false },
    { monthsOut: 1, task: 'Final Details', description: 'Confirm all reservations and send final reminders', completed: false },
  ],
  birthday: [
    { monthsOut: 6, task: 'Book Group Lodging', description: 'Reserve accommodations for all guests', completed: false },
    { monthsOut: 4, task: 'Plan Activities', description: 'Book group activities and dining reservations', completed: false },
    { monthsOut: 2, task: 'Send Invitations', description: 'Send invites with lodging and activity details', completed: false },
    { monthsOut: 1, task: 'Finalize Details', description: 'Confirm guest count and finalize all bookings', completed: false },
  ],
  'corporate-retreat': [
    { monthsOut: 6, task: 'Book Meeting Spaces', description: 'Reserve conference rooms and group lodging', completed: false },
    { monthsOut: 4, task: 'Plan Team Activities', description: 'Book group activities and team building events', completed: false },
    { monthsOut: 2, task: 'Send Details', description: 'Share itinerary and lodging information with team', completed: false },
    { monthsOut: 1, task: 'Final Confirmations', description: 'Confirm all bookings and send final details', completed: false },
  ],
  memorial: [
    { monthsOut: 3, task: 'Book Group Lodging', description: 'Reserve accommodations for family and guests', completed: false },
    { monthsOut: 2, task: 'Plan Gathering', description: 'Organize memorial service and group meals', completed: false },
    { monthsOut: 1, task: 'Finalize Arrangements', description: 'Confirm all details and notify attendees', completed: false },
  ],
  celebration: [
    { monthsOut: 4, task: 'Book Group Lodging', description: 'Reserve accommodations for all attendees', completed: false },
    { monthsOut: 3, task: 'Plan Activities', description: 'Book group activities and special events', completed: false },
    { monthsOut: 2, task: 'Send Invitations', description: 'Share event details and lodging options', completed: false },
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

  const timeline = EVENT_TIMELINES[eventType] || EVENT_TIMELINES.celebration;

  const calculateMonthsUntil = (monthsOut: number) => {
    if (!date) return null;
    const event = new Date(date);
    const target = new Date(event);
    target.setMonth(target.getMonth() - monthsOut);
    return target;
  };

  const formatDate = (date: Date | null) => {
    if (!date) return '';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getEventTypeLabel = () => {
    const labels: Record<string, string> = {
      wedding: 'Wedding',
      birthday: 'Birthday Celebration',
      'corporate-retreat': 'Corporate Retreat',
      memorial: 'Memorial Service',
      celebration: 'Celebration',
    };
    return labels[eventType] || 'Event';
  };

  return (
    <Card className="my-8 border-2 border-primary-200">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-primary-600 rounded-lg flex items-center justify-center">
            <Calendar className="w-6 h-6 text-white" />
          </div>
          <div>
            <CardTitle className="text-2xl">Event Planning Timeline</CardTitle>
            <p className="text-neutral-600 mt-1">
              Key milestones and deadlines for planning your {getEventTypeLabel().toLowerCase()}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-semibold text-neutral-900 mb-2">
              <Calendar className="w-4 h-4 inline mr-2" />
              Event Date
            </label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-neutral-900 mb-2">
              <Users className="w-4 h-4 inline mr-2" />
              Group Size
            </label>
            <Input
              type="number"
              min="5"
              max="100"
              value={size}
              onChange={(e) => setSize(parseInt(e.target.value) || 10)}
              className="w-full"
            />
          </div>
        </div>

        {date && (
          <div className="mt-6 space-y-4">
            <div className="border-t border-neutral-200 pt-4">
              <h3 className="text-lg font-semibold text-neutral-900 mb-4">Planning Timeline</h3>
              <div className="space-y-4">
                {timeline.map((item, index) => {
                  const targetDate = calculateMonthsUntil(item.monthsOut);
                  return (
                    <div key={index} className="flex gap-4">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center text-white font-semibold">
                          {item.monthsOut}
                        </div>
                      </div>
                      <div className="flex-1 pb-4 border-b border-neutral-200">
                        <div className="flex items-start justify-between mb-1">
                          <div>
                            <div className="font-semibold text-neutral-900">{item.task}</div>
                            <div className="text-sm text-neutral-600 mt-1">{item.description}</div>
                          </div>
                          {targetDate && (
                            <div className="text-sm text-neutral-500 ml-4 whitespace-nowrap">
                              {formatDate(targetDate)}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="border-t border-neutral-200 pt-4">
              <div className="p-4 bg-primary-50 border-2 border-primary-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-5 h-5 text-primary-600" />
                  <span className="font-semibold text-neutral-900">Next Steps</span>
                </div>
                <p className="text-neutral-700 text-sm mb-3">
                  Start by booking group lodging for {size} guests. Early booking ensures availability and better rates.
                </p>
                <ArticleBookingWidget
                  variant="default"
                  title="Reserve Group Lodging Now"
                  description={`Find accommodations for ${size} guests`}
                />
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

