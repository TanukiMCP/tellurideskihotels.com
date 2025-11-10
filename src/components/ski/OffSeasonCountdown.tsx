/**
 * Off-Season Countdown Component
 * Displays animated countdown to ski season opening with links to summer activities
 */

import { useState, useEffect } from 'react';
import { Calendar, Mountain, MapPin } from 'lucide-react';

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

interface OffSeasonCountdownProps {
  seasonStartDate: Date;
}

function calculateTimeRemaining(targetDate: Date): TimeRemaining {
  const now = new Date().getTime();
  const target = targetDate.getTime();
  const diff = target - now;

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((diff % (1000 * 60)) / 1000),
  };
}

export function OffSeasonCountdown({ seasonStartDate }: OffSeasonCountdownProps) {
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>(
    calculateTimeRemaining(seasonStartDate)
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRemaining(calculateTimeRemaining(seasonStartDate));
    }, 1000);

    return () => clearInterval(interval);
  }, [seasonStartDate]);

  return (
    <div className="space-y-8">
      {/* Countdown Card */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 rounded-3xl p-12 lg:p-16 shadow-elevated">
        {/* Animated background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>

        <div className="relative text-center text-white">
          <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full">
            <Mountain className="w-5 h-5" />
            <span className="font-semibold">Off-Season</span>
          </div>

          <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold mb-4 drop-shadow-2xl">
            Countdown to Ski Season
          </h2>
          <p className="text-lg lg:text-xl text-white/90 mb-12 max-w-2xl mx-auto drop-shadow-lg">
            The slopes are preparing for another epic season. Here's how long until opening day!
          </p>

          {/* Countdown Display */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6 mb-12">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
              <div className="text-5xl lg:text-6xl font-extrabold mb-2 tabular-nums">
                {timeRemaining.days}
              </div>
              <div className="text-sm lg:text-base font-semibold text-white/80 uppercase tracking-wide">
                Days
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
              <div className="text-5xl lg:text-6xl font-extrabold mb-2 tabular-nums">
                {timeRemaining.hours}
              </div>
              <div className="text-sm lg:text-base font-semibold text-white/80 uppercase tracking-wide">
                Hours
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
              <div className="text-5xl lg:text-6xl font-extrabold mb-2 tabular-nums">
                {timeRemaining.minutes}
              </div>
              <div className="text-sm lg:text-base font-semibold text-white/80 uppercase tracking-wide">
                Minutes
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
              <div className="text-5xl lg:text-6xl font-extrabold mb-2 tabular-nums">
                {timeRemaining.seconds}
              </div>
              <div className="text-sm lg:text-base font-semibold text-white/80 uppercase tracking-wide">
                Seconds
              </div>
            </div>
          </div>

          {/* Season Start Date */}
          <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-sm px-6 py-3 rounded-xl border border-white/20">
            <Calendar className="w-5 h-5" />
            <span className="font-semibold">
              Season Opens: {seasonStartDate.toLocaleDateString('en-US', { 
                month: 'long', 
                day: 'numeric', 
                year: 'numeric' 
              })}
            </span>
          </div>
        </div>
      </div>

      {/* Summer Activities CTA */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-8 border border-green-200 shadow-card hover:shadow-card-hover transition-all">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-green-500 flex items-center justify-center flex-shrink-0 shadow-card">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h3 className="text-2xl font-extrabold text-neutral-900 mb-2">
                Summer Adventures
              </h3>
              <p className="text-neutral-700 leading-relaxed mb-4">
                Don't let the off-season stop you! Discover hiking, mountain biking, festivals, and more incredible summer activities in Telluride.
              </p>
              <a 
                href="/things-to-do" 
                className="inline-flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-green-700 transition-colors"
              >
                Explore Summer Activities
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </a>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-2xl p-8 border border-amber-200 shadow-card hover:shadow-card-hover transition-all">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500 flex items-center justify-center flex-shrink-0 shadow-card">
              <MapPin className="w-7 h-7 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-extrabold text-neutral-900 mb-2">
                Plan Your Visit
              </h3>
              <p className="text-neutral-700 leading-relaxed mb-4">
                Book your accommodations now to secure the best rates and locations for the upcoming ski season.
              </p>
              <a 
                href="/places-to-stay" 
                className="inline-flex items-center gap-2 bg-amber-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-amber-700 transition-colors"
              >
                Browse Accommodations
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Info */}
      <div className="bg-neutral-50 rounded-2xl p-8 border border-neutral-200">
        <h3 className="text-xl font-bold text-neutral-900 mb-4">While You Wait...</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <a href="/blog" className="flex items-center gap-3 p-4 bg-white rounded-xl border border-neutral-200 hover:border-primary-300 hover:bg-primary-50 transition-all">
            <svg className="w-6 h-6 text-primary-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <div>
              <div className="font-bold text-neutral-900">Read Our Blog</div>
              <div className="text-sm text-neutral-600">Telluride travel tips & guides</div>
            </div>
          </a>
          <a href="/about" className="flex items-center gap-3 p-4 bg-white rounded-xl border border-neutral-200 hover:border-primary-300 hover:bg-primary-50 transition-all">
            <svg className="w-6 h-6 text-primary-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <div className="font-bold text-neutral-900">About Telluride</div>
              <div className="text-sm text-neutral-600">Learn about the region</div>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}

