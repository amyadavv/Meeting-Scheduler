import React from 'react';
import { MapPin, Clock, Calendar, Trash2, Edit3, PlusCircle, CalendarX } from 'lucide-react';
import { Badge } from './common/Badge.jsx';
import { formatTimeTo12h, formatDaysOfWeek } from '../utils/formatters.js';

export const ParticipantCard = ({
  participant,
  isSelected,
  onToggleSelect,
  onEdit,
  onDelete,
  onAddMeeting,
  onDeleteMeeting,
  meetings = []
}) => {
  const { name, email, location, timezone, availability } = participant;

  return (
    <div
      className={`relative rounded-2xl border p-4 sm:p-5 transition-all duration-200 overflow-hidden flex flex-col justify-between ${
        isSelected
          ? 'bg-slate-900/95 border-blue-500/60 shadow-xl shadow-blue-500/10 ring-1 ring-blue-500/30'
          : 'bg-slate-900/70 border-slate-800/90 hover:border-slate-700 shadow-lg'
      }`}
    >
      <div>
        {/* Header with Checkbox, Name, Email, and Action Buttons */}
        <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-800/80">
          {/* Checkbox and Name info (Properly contained & truncated) */}
          <label className="flex items-center gap-2.5 cursor-pointer select-none flex-1 min-w-0 pr-1">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={onToggleSelect}
              className="w-4 h-4 rounded border-slate-700 text-blue-600 focus:ring-blue-500 focus:ring-offset-slate-900 bg-slate-800 cursor-pointer flex-shrink-0"
            />
            <div className="min-w-0 flex-1">
              <h4 className="font-bold text-white text-sm sm:text-base leading-tight truncate">
                {name}
              </h4>
              <span className="text-[11px] text-slate-400 font-mono truncate block mt-0.5" title={email}>
                {email}
              </span>
            </div>
          </label>

          {/* Action Buttons (Fixed width, never pushed outside) */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={() => onEdit(participant)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Edit participant"
              aria-label="Edit participant"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onDelete(participant.id)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
              title="Delete participant"
              aria-label="Delete participant"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Details Grid */}
        <div className="mt-3.5 space-y-2.5 text-xs text-slate-300">
          {/* Location & Timezone Badge */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-slate-300 font-medium min-w-0 truncate">
              <MapPin className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
              <span className="truncate">{location}</span>
            </div>
            <Badge variant="purple" size="xs" className="flex-shrink-0 font-mono max-w-[130px] truncate" title={timezone}>
              {timezone}
            </Badge>
          </div>

          {/* Working Hours */}
          <div className="flex items-center justify-between gap-2 text-slate-300">
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <Clock className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
              <span className="font-mono text-[11px]">
                {formatTimeTo12h(availability.startTime)} – {formatTimeTo12h(availability.endTime)}
              </span>
            </div>
            <span className="text-[11px] text-slate-400 truncate">
              {formatDaysOfWeek(availability.daysOfWeek)}
            </span>
          </div>
        </div>
      </div>

      {/* Busy Blocks / Meetings Section */}
      <div className="mt-4 pt-3 border-t border-slate-800/80">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <CalendarX className="w-3 h-3 text-amber-400" />
            Busy Blocks ({meetings.length})
          </span>
          <button
            onClick={() => onAddMeeting(participant)}
            className="text-[11px] text-blue-400 hover:text-blue-300 font-semibold inline-flex items-center gap-1 transition-colors"
          >
            <PlusCircle className="w-3 h-3" />
            Add Busy Block
          </button>
        </div>

        {meetings.length === 0 ? (
          <p className="text-[11px] text-slate-500 italic py-0.5">No existing busy blocks recorded.</p>
        ) : (
          <div className="space-y-1.5 max-h-24 overflow-y-auto pr-1">
            {meetings.map((m) => {
              const start = new Date(m.startTime).toUTCString().slice(0, 22);
              const end = new Date(m.endTime).toUTCString().slice(17, 22);
              return (
                <div
                  key={m.id}
                  className="flex items-center justify-between text-[11px] bg-slate-800/60 px-2 py-1 rounded-lg border border-slate-700/50 text-slate-300 gap-2"
                >
                  <span className="truncate flex-1 min-w-0" title={`${m.title} (${start}–${end} UTC)`}>
                    <span className="text-amber-300 font-medium">{m.title}: </span>
                    {start}–{end} UTC
                  </span>
                  <button
                    onClick={() => onDeleteMeeting(m.id)}
                    className="text-slate-400 hover:text-rose-400 flex-shrink-0 p-0.5 transition-colors"
                    title="Remove busy block"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
