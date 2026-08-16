import React from 'react';
import { MapPin, Clock, Calendar, Trash2, Edit3, PlusCircle, CalendarX } from 'lucide-react';
import { Badge } from './common/Badge.jsx';
import { Button } from './common/Button.jsx';
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
      className={`relative rounded-xl border p-4 transition-all duration-200 ${
        isSelected
          ? 'bg-slate-800/90 border-blue-500/60 shadow-lg shadow-blue-500/10'
          : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
      }`}
    >
      {/* Header with Checkbox & Actions */}
      <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-800/80">
        <label className="flex items-center gap-3 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onToggleSelect}
            className="w-4 h-4 rounded border-slate-700 text-blue-600 focus:ring-blue-500 focus:ring-offset-slate-900 bg-slate-800 cursor-pointer"
          />
          <div>
            <h4 className="font-semibold text-white text-base leading-tight">{name}</h4>
            <span className="text-xs text-slate-400 font-mono">{email}</span>
          </div>
        </label>

        {/* Action Buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onEdit(participant)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Edit participant"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(participant.id)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
            title="Delete participant"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Details Grid */}
      <div className="mt-3 space-y-2 text-xs text-slate-300">
        {/* Location & Timezone */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-slate-300 font-medium">
            <MapPin className="w-3.5 h-3.5 text-rose-400" />
            <span>{location}</span>
          </div>
          <Badge variant="purple" size="xs">
            {timezone}
          </Badge>
        </div>

        {/* Working Hours */}
        <div className="flex items-center justify-between text-slate-300">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-blue-400" />
            <span>
              {formatTimeTo12h(availability.startTime)} – {formatTimeTo12h(availability.endTime)}
            </span>
          </div>
          <span className="text-[11px] text-slate-400">
            {formatDaysOfWeek(availability.daysOfWeek)}
          </span>
        </div>
      </div>

      {/* Busy Blocks / Meetings */}
      <div className="mt-4 pt-3 border-t border-slate-800/80">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <CalendarX className="w-3 h-3 text-amber-400" />
            Busy Blocks ({meetings.length})
          </span>
          <button
            onClick={() => onAddMeeting(participant)}
            className="text-[11px] text-blue-400 hover:text-blue-300 font-medium inline-flex items-center gap-1"
          >
            <PlusCircle className="w-3 h-3" />
            Add Busy Block
          </button>
        </div>

        {meetings.length === 0 ? (
          <p className="text-[11px] text-slate-500 italic">No existing busy blocks recorded.</p>
        ) : (
          <div className="space-y-1.5 max-h-24 overflow-y-auto pr-1">
            {meetings.map((m) => {
              const start = new Date(m.startTime).toUTCString().slice(0, 22);
              const end = new Date(m.endTime).toUTCString().slice(17, 22);
              return (
                <div
                  key={m.id}
                  className="flex items-center justify-between text-[11px] bg-slate-800/60 px-2 py-1 rounded border border-slate-700/50 text-slate-300"
                >
                  <span className="truncate max-w-[170px]" title={m.title}>
                    <span className="text-amber-300 font-medium">{m.title}: </span>
                    {start}–{end} UTC
                  </span>
                  <button
                    onClick={() => onDeleteMeeting(m.id)}
                    className="text-slate-500 hover:text-rose-400 ml-1"
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
