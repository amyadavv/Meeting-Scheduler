import React from 'react';
import { Search, Calendar, Clock, Sliders, Users } from 'lucide-react';
import { Button } from './common/Button.jsx';

export const SchedulerForm = ({
  searchParams,
  onChange,
  onSearch,
  isLoading,
  selectedParticipantCount,
  totalParticipantCount,
  onSelectAll
}) => {
  const durationOptions = [
    { value: 15, label: '15 mins' },
    { value: 30, label: '30 mins' },
    { value: 45, label: '45 mins (Assignment)' },
    { value: 60, label: '60 mins (1 hr)' },
    { value: 90, label: '90 mins' },
    { value: 120, label: '120 mins (2 hrs)' }
  ];

  const granularityOptions = [
    { value: 15, label: '15 min increments' },
    { value: 30, label: '30 min increments' },
    { value: 60, label: '60 min increments' }
  ];

  const handleApplyPreset = () => {
    onChange({
      startDate: '2026-03-08',
      endDate: '2026-03-14',
      durationMinutes: 45,
      granularityMinutes: 15
    });
    if (onSelectAll) {
      onSelectAll();
    }
  };

  return (
    <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 shadow-xl relative overflow-hidden">
      {/* Glow accent */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Sliders className="w-4 h-4 text-blue-400" />
            Scheduling Configuration
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure target date window, duration, and participant constraints.
          </p>
        </div>

        <button
          type="button"
          onClick={handleApplyPreset}
          className="text-xs text-blue-400 hover:text-blue-300 font-medium px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 transition-all self-start sm:self-auto"
        >
          ⚡ Load Assignment Spec (8–14 Mar 2026, 45m)
        </button>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSearch();
        }}
        className="mt-5 space-y-4"
      >
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Start Date */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-400" />
              Start Date
            </label>
            <input
              type="date"
              required
              value={searchParams.startDate}
              onChange={(e) => onChange({ ...searchParams, startDate: e.target.value })}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-400" />
              End Date
            </label>
            <input
              type="date"
              required
              value={searchParams.endDate}
              onChange={(e) => onChange({ ...searchParams, endDate: e.target.value })}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Meeting Duration */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              Meeting Duration
            </label>
            <select
              value={searchParams.durationMinutes}
              onChange={(e) =>
                onChange({ ...searchParams, durationMinutes: Number(e.target.value) })
              }
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
            >
              {durationOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Step Granularity */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-purple-400" />
              Alignment Granularity
            </label>
            <select
              value={searchParams.granularityMinutes}
              onChange={(e) =>
                onChange({ ...searchParams, granularityMinutes: Number(e.target.value) })
              }
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
            >
              {granularityOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Footer info & CTA */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 border-t border-slate-800/80">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Users className="w-4 h-4 text-blue-400" />
            <span>
              <strong className="text-white">{selectedParticipantCount}</strong> of{' '}
              {totalParticipantCount} participants selected for meeting
            </span>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="md"
            icon={Search}
            isLoading={isLoading}
            disabled={selectedParticipantCount === 0}
            className="w-full sm:w-auto"
          >
            Calculate Optimal Meeting Slots
          </Button>
        </div>
      </form>
    </div>
  );
};
