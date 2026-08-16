import React, { useState } from 'react';
import { Clock, MapPin, Eye, Calendar, Sparkles, User, AlertCircle } from 'lucide-react';
import { Badge } from './common/Badge.jsx';

export const TimezoneMatrix = ({ participants = [], meetingsMap = {}, selectedDate = '2026-03-09' }) => {
  if (!participants || participants.length === 0) return null;

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const [hoveredHour, setHoveredHour] = useState(null);

  // Timezone offsets for timeline mapping
  const tzOffsets = {
    'Asia/Kolkata': 5.5,
    'Europe/London': 0,
    'America/Los_Angeles': -7, // PDT (Post March 8, 2026 DST)
    'Australia/Sydney': 11,
    'America/New_York': -4,
    'America/Chicago': -5,
    'Europe/Paris': 1,
    'Asia/Tokyo': 9,
    'Asia/Singapore': 8,
    'Asia/Dubai': 4,
    'Pacific/Auckland': 13,
    'UTC': 0
  };

  return (
    <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-5">
      {/* Header with Legends */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Eye className="w-4 h-4 text-blue-400" />
            24-Hour Working Window Matrix (UTC Overview)
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Visual alignment of each participant's working availability and busy blocks relative to UTC.
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs">
          <span className="flex items-center gap-1.5 text-slate-300 font-medium">
            <span className="w-3 h-3 rounded-sm bg-emerald-500/80 border border-emerald-400 inline-block shadow-sm shadow-emerald-500/30" />
            Available (Working)
          </span>
          <span className="flex items-center gap-1.5 text-amber-300 font-medium">
            <span className="w-3 h-3 rounded-sm bg-amber-500/80 border border-amber-400 inline-block shadow-sm shadow-amber-500/30" />
            Busy Block
          </span>
          <span className="flex items-center gap-1.5 text-slate-400">
            <span className="w-3 h-3 rounded-sm bg-slate-800/80 border border-slate-700 inline-block" />
            Off-Hours / Sleeping
          </span>
        </div>
      </div>

      {/* 24-Hour Timeline Container */}
      <div className="overflow-x-auto pb-2">
        <div className="min-w-[760px] space-y-2.5">
          {/* Top UTC Hours Header */}
          <div className="flex items-center">
            {/* Left Spacer matching participant column */}
            <div className="w-48 flex-shrink-0 text-[11px] font-bold text-slate-400 uppercase tracking-wider pl-1">
              Participant (Location)
            </div>

            {/* 24 Hour Ticks */}
            <div
              className="flex-1 gap-1"
              style={{ display: 'grid', gridTemplateColumns: 'repeat(24, minmax(0, 1fr))' }}
            >
              {hours.map((h) => {
                const isHovered = hoveredHour === h;
                return (
                  <div
                    key={h}
                    className={`text-center font-mono text-[10px] py-1 rounded transition-colors ${
                      isHovered
                        ? 'bg-blue-500/20 text-blue-300 font-bold'
                        : 'text-slate-400'
                    }`}
                  >
                    {h.toString().padStart(2, '0')}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Participant Rows */}
          {participants.map((p) => {
            const [startH] = (p.availability?.startTime || '09:00').split(':').map(Number);
            const [endH] = (p.availability?.endTime || '18:00').split(':').map(Number);

            const offset = tzOffsets[p.timezone] ?? 0;
            // Approximate local start/end mapped to UTC
            const startUtcHour = Math.floor((startH - offset + 24) % 24);
            const endUtcHour = Math.floor((endH - offset + 24) % 24);

            const participantMeetings = meetingsMap[p.id] || [];

            return (
              <div
                key={p.id}
                className="flex items-center bg-slate-800/40 hover:bg-slate-800/70 p-2 rounded-xl border border-slate-800/80 transition-all"
              >
                {/* Participant Info Column */}
                <div className="w-48 flex-shrink-0 pr-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white text-xs truncate" title={p.name}>
                      {p.name}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono flex items-center gap-0.5">
                      <MapPin className="w-3 h-3 text-rose-400 flex-shrink-0" />
                      {p.location}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 truncate mt-0.5 flex items-center justify-between">
                    <span>{p.availability?.startTime}–{p.availability?.endTime}</span>
                    {participantMeetings.length > 0 && (
                      <span className="text-amber-400 font-medium">
                        {participantMeetings.length} busy
                      </span>
                    )}
                  </div>
                </div>

                {/* 24-Hour Blocks Grid */}
                <div
                  className="flex-1 gap-1"
                  style={{ display: 'grid', gridTemplateColumns: 'repeat(24, minmax(0, 1fr))' }}
                >
                  {hours.map((h) => {
                    let isWorking = false;
                    if (startUtcHour <= endUtcHour) {
                      isWorking = h >= startUtcHour && h < endUtcHour;
                    } else {
                      // Crosses UTC midnight
                      isWorking = h >= startUtcHour || h < endUtcHour;
                    }

                    // Check if this hour overlaps with any logged meeting/busy block
                    const conflictingMeeting = participantMeetings.find((m) => {
                      const mStart = new Date(m.startTime);
                      const mEnd = new Date(m.endTime);
                      const mStartHour = mStart.getUTCHours();
                      const mEndHour = mEnd.getUTCHours() || 24;
                      return h >= mStartHour && h < mEndHour;
                    });

                    const isBusy = Boolean(conflictingMeeting);
                    const isHovered = hoveredHour === h;

                    let blockClass = 'bg-slate-900/80 text-slate-600 border border-slate-800/90 hover:border-slate-700';
                    let symbol = '';

                    if (isBusy) {
                      blockClass = 'bg-amber-500/30 text-amber-300 border border-amber-500/60 hover:bg-amber-500/40 shadow-sm shadow-amber-500/20';
                      symbol = '✕';
                    } else if (isWorking) {
                      blockClass = 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/50 hover:bg-emerald-500/40 shadow-sm';
                      symbol = '●';
                    }

                    let tooltip = `${p.name} at ${h.toString().padStart(2, '0')}:00 UTC: `;
                    if (isBusy) {
                      tooltip += `BUSY [${conflictingMeeting.title}]`;
                    } else if (isWorking) {
                      tooltip += 'Available (Working Hours)';
                    } else {
                      tooltip += 'Off-Hours / Sleeping';
                    }

                    return (
                      <div
                        key={h}
                        onMouseEnter={() => setHoveredHour(h)}
                        onMouseLeave={() => setHoveredHour(null)}
                        className={`h-7 rounded transition-all flex items-center justify-center cursor-pointer text-[10px] font-mono select-none ${blockClass} ${
                          isHovered ? 'ring-2 ring-blue-400 scale-105 z-10' : ''
                        }`}
                        title={tooltip}
                      >
                        {symbol}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Info / Timezone Legend */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-800/80 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-blue-400" />
          <span>
            Hover over any hour cell to view working hours and busy block commitments in UTC.
          </span>
        </div>
        <div className="text-[11px] text-slate-400 font-mono">
          All timeline intervals canonicalized to UTC (00:00 – 23:00)
        </div>
      </div>
    </div>
  );
};
