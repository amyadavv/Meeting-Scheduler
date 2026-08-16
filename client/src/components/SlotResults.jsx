import React from 'react';
import { CalendarCheck, Clock, Globe, CheckCircle, Sparkles, MapPin } from 'lucide-react';
import { Badge } from './common/Badge.jsx';

export const SlotResults = ({ results, durationMinutes }) => {
  if (!results || !results.slots) return null;

  const { slots, totalSlotsFound, searchWindow } = results;

  return (
    <div className="space-y-4">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 p-4 rounded-xl shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20">
            <CalendarCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              Suggested Universal Meeting Slots
              <Badge variant="green" size="sm">
                {totalSlotsFound} {totalSlotsFound === 1 ? 'Slot' : 'Slots'} Found
              </Badge>
            </h3>
            <p className="text-xs text-slate-400">
              Every participant is mutually available without conflicting meetings during these windows.
            </p>
          </div>
        </div>

        <div className="text-xs text-slate-400 font-mono self-start sm:self-auto">
          Window: {searchWindow.startDate} to {searchWindow.endDate}
        </div>
      </div>

      {/* Slots List */}
      <div className="grid grid-cols-1 gap-4">
        {slots.map((slot, idx) => {
          const utcStart = new Date(slot.startUtc).toUTCString().slice(0, 22);
          const utcEnd = new Date(slot.endUtc).toUTCString().slice(17, 22);

          return (
            <div
              key={slot.slotId || idx}
              className="bg-slate-900/90 border border-slate-800 hover:border-blue-500/40 rounded-xl p-5 shadow-lg transition-all duration-200"
            >
              {/* Slot Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800/80">
                <div className="flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500/10 text-blue-400 text-xs font-bold font-mono">
                    #{idx + 1}
                  </span>
                  <div className="flex items-center gap-2 font-mono text-sm font-semibold text-white">
                    <Clock className="w-4 h-4 text-blue-400" />
                    <span>
                      {utcStart} – {utcEnd} <span className="text-blue-400">UTC</span>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant="blue" size="xs">
                    {slot.durationMinutes} min meeting
                  </Badge>
                  <Badge variant="green" size="xs">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    100% Availability
                  </Badge>
                </div>
              </div>

              {/* Local Participant Times Grid */}
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {slot.participantTimes.map((pt) => (
                  <div
                    key={pt.participantId}
                    className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-3 space-y-1.5"
                  >
                    {/* Participant Header */}
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-white text-xs truncate">
                        {pt.name}
                      </span>
                      <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
                        <MapPin className="w-3 h-3 text-slate-500" />
                        {pt.location}
                      </span>
                    </div>

                    {/* Local Range */}
                    <div className="text-xs font-medium text-emerald-400">
                      {pt.localStartTime12h} – {pt.localEndTime12h}
                    </div>

                    {/* Date and Day */}
                    <div className="text-[11px] text-slate-400 flex items-center justify-between">
                      <span>{pt.dayOfWeek}, {pt.localDate}</span>
                      <span className="font-mono text-slate-500">{pt.tzAbbreviation}</span>
                    </div>

                    {pt.spansMidnight && (
                      <span className="inline-block text-[10px] text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                        ⚠️ Crosses midnight
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
