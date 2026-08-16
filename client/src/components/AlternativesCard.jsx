import React from 'react';
import { AlertTriangle, Users, Clock, HelpCircle, ArrowRight, UserX, CheckCircle2 } from 'lucide-react';
import { Badge } from './common/Badge.jsx';

export const AlternativesCard = ({ alternatives, durationMinutes }) => {
  if (!alternatives) return null;

  const { explanation, pairDiagnostics = [], subsetSuggestions = [] } = alternatives;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Primary Alert Header */}
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-6 shadow-xl">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-amber-500/20 text-amber-400 rounded-xl flex-shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="space-y-2">
            <h3 className="text-base font-bold text-white">
              No Universal {durationMinutes}-Minute Slot Works for All Participants
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed">{explanation}</p>
          </div>
        </div>
      </div>

      {/* Timezone Incompatibility Diagnostics */}
      {pairDiagnostics.length > 0 && (
        <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-3">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-blue-400" />
            Root-Cause Timezone Divergence
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {pairDiagnostics.map((diag, i) => (
              <div
                key={i}
                className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-3.5 text-xs space-y-1.5"
              >
                <div className="flex items-center justify-between font-semibold text-white">
                  <span>
                    {diag.participants[0]} ({diag.locations[0]}) ↔ {diag.participants[1]} ({diag.locations[1]})
                  </span>
                  <Badge variant="red" size="xs">
                    0h Common Overlap
                  </Badge>
                </div>
                <p className="text-slate-400 leading-relaxed">{diag.reason}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* N-1 Subset Alternative Suggestions */}
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
                className="bg-slate-800/50 border border-slate-700/70 rounded-xl p-4 space-y-3"
              >
                {/* Subset Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-700/60">
                  <div className="flex items-center gap-2">
                    <Badge variant="green" size="sm">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      {subset.includedParticipantCount} Participants Available
                    </Badge>
                    <span className="text-xs text-slate-300 font-medium">
                      ({subset.totalSlotsAvailable} slots found)
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded-lg border border-rose-500/20">
                    <UserX className="w-3.5 h-3.5" />
                    <span>
                      Excludes <strong>{subset.excludedParticipant.name}</strong> ({subset.excludedParticipant.location})
                    </span>
                  </div>
                </div>

                {/* Sample Slots for this subset */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {subset.suggestedSlots.slice(0, 3).map((slot, sIdx) => {
                    const utcStart = new Date(slot.startUtc).toUTCString().slice(0, 22);
                    const utcEnd = new Date(slot.endUtc).toUTCString().slice(17, 22);

                    return (
                      <div
                        key={sIdx}
                        className="bg-slate-900/80 border border-slate-800 rounded-lg p-3 space-y-2 text-xs"
                      >
                        <div className="flex items-center justify-between font-mono font-semibold text-white">
                          <span className="text-blue-400 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {utcStart} – {utcEnd} UTC
                          </span>
                        </div>

                        {/* Participant local summary */}
                        <div className="space-y-1 text-[11px] text-slate-300">
                          {slot.participantTimes.map((pt) => (
                            <div key={pt.participantId} className="flex justify-between">
                              <span className="text-slate-400">{pt.name} ({pt.location}):</span>
                              <span className="font-medium text-emerald-300">{pt.localStartTime12h} – {pt.localEndTime12h} ({pt.tzAbbreviation})</span>
                            </div>
                          ))}
                        </div>

                        {/* Excluded person's time */}
                        {slot.excludedParticipantTime && (
                          <div className="pt-1.5 border-t border-slate-800/80 text-[11px] text-rose-400 flex justify-between">
                            <span>{slot.excludedParticipantTime.name}'s local time:</span>
                            <span className="italic">{slot.excludedParticipantTime.localStartTime12h} ({slot.excludedParticipantTime.tzAbbreviation} · Outside working hours)</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
