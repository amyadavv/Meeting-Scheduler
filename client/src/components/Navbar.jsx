import React, { useState, useEffect } from 'react';
import { Clock, RefreshCw, UserPlus, Globe, Sparkles } from 'lucide-react';
import { Button } from './common/Button.jsx';

export const Navbar = ({ onAddParticipant, onResetSeed, isResetting }) => {
  const [utcTime, setUtcTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setUtcTime(
        now.toUTCString().replace('GMT', 'UTC')
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-900/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-xl shadow-lg shadow-blue-500/20 text-white">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-white tracking-tight">
                  Distributed Meeting Scheduler
                </h1>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  Assignment Demo
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Multi-Timezone Availability & Deterministic Slot Optimizer
              </p>
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            {/* Live UTC Clock */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs font-mono text-slate-300">
              <Clock className="w-3.5 h-3.5 text-blue-400" />
              <span>{utcTime || 'Loading UTC...'}</span>
            </div>

            {/* Reset to Assignment Scenario Button */}
            <Button
              variant="secondary"
              size="sm"
              icon={RefreshCw}
              isLoading={isResetting}
              onClick={onResetSeed}
              title="Resets data to Maya (Bangalore), Tom (London), Sara (SF), Jack (Sydney)"
            >
              Reset Seed Scenario
            </Button>

            {/* Add Participant */}
            <Button
              variant="primary"
              size="sm"
              icon={UserPlus}
              onClick={onAddParticipant}
            >
              Add Participant
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};
