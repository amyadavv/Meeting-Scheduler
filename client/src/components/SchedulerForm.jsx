import React from 'react';
import { Search, Calendar, Clock, Sliders, Users, Sparkles } from 'lucide-react';
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
    { value: 15, label: '15 minutes' },
    { value: 30, label: '30 minutes' },
    { value: 45, label: '45 minutes (Assignment Spec)' },
    { value: 60, label: '60 minutes (1 hour)' },
    { value: 90, label: '90 minutes (1.5 hours)' },
    { value: 120, label: '120 minutes (2 hours)' }
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
    <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 shadow-2xl relative overflow-hidden">
      {/* Background radial highlight */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Form Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800/90">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Sliders className="w-4 h-4" />
            </span>
            <h3 className="text-base font-bold text-white tracking-tight">
              Meeting Parameters & Optimization
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Specify target scheduling range, duration, and step granularity to calculate mutually open windows.
          </p>
        </div>

        <button
          type="button"
          onClick={handleApplyPreset}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-400 hover:text-blue-300 px-3.5 py-2 rounded-xl bg-blue-500/10 border border-blue-500/25 hover:bg-blue-500/20 hover:border-blue-500/40 transition-all self-start sm:self-auto shadow-sm"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          Load Assignment Spec (8–14 Mar 2026, 45m)
        </button>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSearch();
        }}
        className="mt-6 space-y-5"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Start Date */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-400" />
              Start Date
            </label>
            <input
              type="date"
              required
              value={searchParams.startDate}
              onChange={(e) => onChange({ ...searchParams, startDate: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700/80 rounded-xl text-sm text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all shadow-inner"
            />
          </div>

          {/* End Date */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-400" />
              End Date
            </label>
            <input
              type="date"
              required
              value={searchParams.endDate}
              onChange={(e) => onChange({ ...searchParams, endDate: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700/80 rounded-xl text-sm text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all shadow-inner"
            />
          </div>

          {/* Meeting Duration */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              Duration
            </label>
            <select
              value={searchParams.durationMinutes}
              onChange={(e) =>
                onChange({ ...searchParams, durationMinutes: Number(e.target.value) })
              }
              className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700/80 rounded-xl text-sm text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all shadow-inner cursor-pointer"
            >
              {durationOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Granularity */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-purple-400" />
              Alignment Step
            </label>
            <select
              value={searchParams.granularityMinutes}
              onChange={(e) =>
                onChange({ ...searchParams, granularityMinutes: Number(e.target.value) })
              }
              className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700/80 rounded-xl text-sm text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all shadow-inner cursor-pointer"
            >
              {granularityOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-slate-800/80">
          <div className="flex items-center gap-2.5 text-xs text-slate-400">
            <span className="p-1 rounded-md bg-slate-800 text-blue-400">
              <Users className="w-3.5 h-3.5" />
            </span>
            <span>
              <strong className="text-white font-semibold">{selectedParticipantCount}</strong> of{' '}
              <strong className="text-slate-300">{totalParticipantCount}</strong> participants selected for calculation
            </span>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="md"
            icon={Search}
            isLoading={isLoading}
            disabled={selectedParticipantCount === 0}
            className="w-full sm:w-auto shadow-lg shadow-blue-600/25 px-6 py-2.5 font-semibold text-sm"
          >
            Calculate Optimal Meeting Slots
          </Button>
        </div>
      </form>
    </div>
  );
};
