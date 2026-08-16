import React from 'react';
import {
  AlertTriangle,
  Users,
  Clock,
  HelpCircle,
  ArrowRight,
  UserX,
  CheckCircle2,
  Calendar,
  Sparkles,
  ShieldAlert,
  MapPin
} from 'lucide-react';
import { Badge } from './common/Badge.jsx';

export const AlternativesCard = ({ alternatives, durationMinutes = 45 }) => {
  if (!alternatives) return null;

  const {
    explanation,
    pairDiagnostics = [],
    subsetSuggestions = []
  } = alternatives;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Primary Conflict Alert Header */}
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-6 shadow-xl">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-amber-500/20 text-amber-400 rounded-xl flex-shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Zero Common Overlap
              </span>
            </div>
            <h3 className="text-base font-bold text-white">
              No Universal {durationMinutes}-Minute Window Found for All Selected Participants
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed">{explanation}</p>
          </div>
        </div>
      </div>

      {/* Root-Cause Timezone Incompatibility Diagnostics */}
      {pairDiagnostics.length > 0 && (
        <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-4">
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-rose-400" />
              Timezone Working Hour Divergence (Root Causes)
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              The following participant pairs have disjoint standard working hours:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pairDiagnostics.map((diag, i) => (
              <div
                key={i}
                className="bg-slate-800/50 border border-slate-700/70 rounded-xl p-4 text-xs space-y-2.5"
              >
                <div className="flex items-center justify-between font-bold text-white">
                  <span className="truncate pr-2">
                    {diag.participants[0]} ({diag.locations[0]}) ↔ {diag.participants[1]} ({diag.locations[1]})
                  </span>
                  <Badge variant="red" size="xs" className="flex-shrink-0">
                    0h Mutual Overlap
                  </Badge>
                </div>
                <p className="text-slate-300 leading-relaxed">{diag.reason}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* N-1 Subset Alternative Suggestions (when 3+ participants are selected) */}
      {subsetSuggestions.length > 0 && (
        <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-400" />
                Intelligent Compromises: (N-1) Participant Subsets
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                The meeting can proceed if one participant is optional or recorded.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {subsetSuggestions.map((subset, idx) => (
              <div
                key={idx}
                className="bg-slate-800/50 border border-slate-700/70 rounded-2xl p-5 space-y-4"
              >
                {/* Subset Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-700/60">
                  <div className="flex items-center gap-2">
                    <Badge variant="green" size="sm">
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                      {subset.includedParticipantCount} Participants Available
                    </Badge>
                    <span className="text-xs text-slate-300 font-medium">
                      ({subset.totalSlotsAvailable} slots found)
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-rose-400 bg-rose-500/10 px-3 py-1.5 rounded-lg border border-rose-500/20 font-medium">
                    <UserX className="w-3.5 h-3.5" />
                    <span>
                      Excludes <strong>{subset.excludedParticipant.name}</strong> ({subset.excludedParticipant.location})
                    </span>
                  </div>
                </div>

                {/* All Suggested Slots for this subset */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {subset.suggestedSlots.map((slot, sIdx) => {
                    const utcStart = new Date(slot.startUtc).toUTCString().slice(0, 22);
                    const utcEnd = new Date(slot.endUtc).toUTCString().slice(17, 22);

                    return (
                      <div
                        key={sIdx}
                        className="bg-slate-900/90 border border-slate-700/80 hover:border-emerald-500/40 rounded-xl p-4 text-xs space-y-3 transition-all"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-blue-300 font-bold flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-blue-400" />
                            {utcStart} – {utcEnd} UTC
                          </span>
                        </div>

                        {/* Local times of included participants */}
                        <div className="space-y-2 pt-2 border-t border-slate-800">
                          {slot.participantTimes.map((pt, pIdx) => (
                            <div
                              key={pIdx}
                              className="flex items-center justify-between text-slate-300"
                            >
                              <span className="font-medium text-slate-200">
                                {pt.name} ({pt.location}):
                              </span>
                              <span className="font-mono text-emerald-400 font-semibold">
                                {pt.localStartTime12h && pt.localEndTime12h
                                  ? `${pt.localStartTime12h} – ${pt.localEndTime12h}`
                                  : pt.formattedLocalRange || pt.localTimeString || ''}{' '}
                                <span className="text-slate-400 font-normal">
                                  ({pt.tzAbbreviation || pt.timezoneAbbreviation || pt.timezone})
                                </span>
                              </span>
                            </div>
                          ))}

                          {/* Excluded Participant Off-hours Time */}
                          {slot.excludedParticipantTime && (
                            <div className="flex items-center justify-between text-rose-400/90 pt-2 border-t border-slate-800/80">
                              <span className="font-medium">
                                {slot.excludedParticipantTime.name} (Off-hours):
                              </span>
                              <span className="font-mono text-rose-400 font-semibold">
                                {slot.excludedParticipantTime.localStartTime12h && slot.excludedParticipantTime.localEndTime12h
                                  ? `${slot.excludedParticipantTime.localStartTime12h} – ${slot.excludedParticipantTime.localEndTime12h}`
                                  : slot.excludedParticipantTime.formattedLocalRange || ''}{' '}
                                <span className="text-rose-300/70 font-normal">
                                  ({slot.excludedParticipantTime.tzAbbreviation || slot.excludedParticipantTime.timezoneAbbreviation || slot.excludedParticipantTime.timezone})
                                </span>
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations when 2-Person or Disjoint Meetings */}
      {subsetSuggestions.length === 0 && (
        <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-400" />
            <h4 className="text-sm font-bold text-white">
              Recommended Scheduling Strategies
            </h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-1.5">
              <span className="font-semibold text-blue-300 block">1. Asynchronous Update</span>
              <p className="text-slate-400 leading-relaxed">
                Record a video update or share written sync notes if both participants cannot meet live.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-1.5">
              <span className="font-semibold text-emerald-300 block">2. Flexible Working Hours</span>
              <p className="text-slate-400 leading-relaxed">
                Expand working hours slightly (e.g. early morning or evening) to create an overlap window.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-1.5">
              <span className="font-semibold text-purple-300 block">3. Shorter Duration</span>
              <p className="text-slate-400 leading-relaxed">
                Try selecting a 15-minute or 30-minute duration with a wider date range.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
