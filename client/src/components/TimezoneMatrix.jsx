import React from 'react';
import { Clock, MapPin, Eye } from 'lucide-react';
import { Badge } from './common/Badge.jsx';

export const TimezoneMatrix = ({ participants = [] }) => {
  if (!participants || participants.length === 0) return null;

  const hours = Array.from({ length: 24 }, (_, i) => i);

  return (
    <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Eye className="w-4 h-4 text-blue-400" />
            24-Hour Working Window Matrix (UTC Overview)
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Visual alignment of each participant's local working hours relative to UTC.
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1 text-slate-300">
            <span className="w-3 h-3 rounded-sm bg-emerald-500/80 inline-block" /> Available
          </span>
          <span className="flex items-center gap-1 text-slate-400">
            <span className="w-3 h-3 rounded-sm bg-slate-800 inline-block border border-slate-700" /> Off-Hours
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[650px] space-y-3">
          {/* UTC Header Row */}
          <div className="grid grid-cols-24 gap-1 text-[10px] text-slate-500 font-mono text-center pl-36">
            {hours.map((h) => (
              <div key={h} className="truncate">
                {h.toString().padStart(2, '0')}
              </div>
            ))}
          </div>

          {/* Participant Rows */}
          {participants.map((p) => {
            // Compute working hour range in approximate UTC for visualization
            const [startH] = p.availability.startTime.split(':').map(Number);
            const [endH] = p.availability.endTime.split(':').map(Number);

            // Rough offset mapping for visual timeline bar
            const tzOffsets = {
              'Asia/Kolkata': 5.5,
              'Europe/London': 0,
              'America/Los_Angeles': -7, // PDT March 2026
              'Australia/Sydney': 11,
              'America/New_York': -4,
              'America/Chicago': -5
            };

            const offset = tzOffsets[p.timezone] || 0;
            const startUtcHour = Math.floor((startH - offset + 24) % 24);
            const endUtcHour = Math.floor((endH - offset + 24) % 24);

            return (
              <div key={p.id} className="flex items-center gap-2 text-xs">
                {/* Participant Label */}
                <div className="w-34 flex-shrink-0 flex items-center justify-between pr-2">
                  <span className="font-semibold text-white truncate max-w-[80px]" title={p.name}>
                    {p.name}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {p.location}
                  </span>
                </div>

                {/* 24 Hour Bar */}
                <div className="grid grid-cols-24 gap-1 flex-1">
                  {hours.map((h) => {
                    let isWorking = false;
                    if (startUtcHour <= endUtcHour) {
                      isWorking = h >= startUtcHour && h < endUtcHour;
                    } else {
                      // Spans across UTC midnight
                      isWorking = h >= startUtcHour || h < endUtcHour;
                    }

                    return (
                      <div
                        key={h}
                        className={`h-6 rounded-sm transition-all text-[9px] flex items-center justify-center font-mono ${
                          isWorking
                            ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/50 shadow-sm'
                            : 'bg-slate-800/60 text-slate-600 border border-slate-800'
                        }`}
                        title={`${p.name} at ${h}:00 UTC: ${isWorking ? 'Working' : 'Off-hours'}`}
                      >
                        {isWorking ? '•' : ''}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
