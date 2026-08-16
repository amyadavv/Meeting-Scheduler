import React from 'react';
import { CalendarCheck, Clock, Globe, CheckCircle, Sparkles, MapPin } from 'lucide-react';
import { Badge } from './common/Badge.jsx';

export const SlotResults = ({ results, slots: propSlots, durationMinutes }) => {
  const data = results || {};
  const slots = data.slots || propSlots || [];
  const totalSlotsFound = data.totalSlotsFound ?? slots.length;
  const searchWindow = data.searchWindow || {};

  if (!slots || slots.length === 0) return null;

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20 flex-shrink-0">
            <CalendarCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              Suggested Universal Meeting Slots
              <Badge variant="green" size="sm">
                {totalSlotsFound} {totalSlotsFound === 1 ? 'Slot' : 'Slots'} Found
              </Badge>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              All selected participants are mutually available during these windows.
            </p>
          </div>
        </div>

        {searchWindow.startDate && searchWindow.endDate && (
          <div className="text-xs text-slate-400 font-mono self-start sm:self-auto bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700/60">
            {searchWindow.startDate} to {searchWindow.endDate}
          </div>
        )}
      </div>

      {/* Slots List */}
      <div className="grid grid-cols-1 gap-4">
        {slots.map((slot, idx) => {
          const utcStart = new Date(slot.startUtc).toUTCString().slice(0, 22);
          const utcEnd = new Date(slot.endUtc).toUTCString().slice(17, 22);

          return (
            <div
              key={slot.slotId || idx}
              className="bg-slate-900/90 border border-slate-800 hover:border-blue-500/40 rounded-2xl p-5 shadow-lg transition-all duration-200 space-y-4"
            >
              {/* Slot Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800/80">
                <div className="flex items-center gap-2.5">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500/10 text-blue-400 text-xs font-bold font-mono">
                    #{idx + 1}
                  </span>
                  <div className="flex items-center gap-2 font-mono text-sm font-semibold text-white">
                    <Clock className="w-4 h-4 text-blue-400 flex-shrink-0" />
                    <span>
                      {utcStart} – {utcEnd} <span className="text-blue-400 font-bold">UTC</span>
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {slot.participantTimes.map((pt, pIdx) => (
                  <div
                    key={pt.participantId || pIdx}
                    className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-3.5 space-y-1.5"
                  >
                    {/* Participant Header */}
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-white text-xs truncate">
                        {pt.name}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono flex items-center gap-0.5">
                        <MapPin className="w-3 h-3 text-slate-500 flex-shrink-0" />
                        {pt.location}
                      </span>
                    </div>

                    {/* Local Range */}
                    <div className="text-xs font-semibold text-emerald-400 font-mono">
                      {pt.localTimeString || `${pt.localStartTime12h || ''} – ${pt.localEndTime12h || ''}`}
                    </div>

                    {/* Date and Day */}
                    <div className="text-[11px] text-slate-400 flex items-center justify-between">
                      <span>{pt.localDate || ''}</span>
                      <span className="font-mono text-slate-400">{pt.timezoneAbbreviation || pt.tzAbbreviation || ''}</span>
                    </div>
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
