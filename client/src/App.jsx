import React, { useState, useEffect, useCallback } from 'react';
import { api } from './api/client.js';
import { Navbar } from './components/Navbar.jsx';
import { ParticipantCard } from './components/ParticipantCard.jsx';
import { ParticipantModal } from './components/ParticipantModal.jsx';
import { MeetingModal } from './components/MeetingModal.jsx';
import { SchedulerForm } from './components/SchedulerForm.jsx';
import { SlotResults } from './components/SlotResults.jsx';
import { AlternativesCard } from './components/AlternativesCard.jsx';
import { TimezoneMatrix } from './components/TimezoneMatrix.jsx';
import { Alert } from './components/common/Alert.jsx';
import { Users, Sparkles, Calendar, Layers, ShieldCheck } from 'lucide-react';

export default function App() {
  const [participants, setParticipants] = useState([]);
  const [meetingsMap, setMeetingsMap] = useState({});
  const [selectedParticipantIds, setSelectedParticipantIds] = useState([]);

  // Modals state
  const [isParticipantModalOpen, setIsParticipantModalOpen] = useState(false);
  const [participantToEdit, setParticipantToEdit] = useState(null);
  const [isMeetingModalOpen, setIsMeetingModalOpen] = useState(false);
  const [meetingTargetParticipant, setMeetingTargetParticipant] = useState(null);

  // Search parameters - Assignment Default: 8–14 March 2026, 45 minutes
  const [searchParams, setSearchParams] = useState({
    startDate: '2026-03-08',
    endDate: '2026-03-14',
    durationMinutes: 45,
    granularityMinutes: 15
  });

  // Scheduling output state
  const [schedulingResults, setSchedulingResults] = useState(null);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isResetting, setIsResetting] = useState(false);
  const [alert, setAlert] = useState(null);

  // 1. Fetch participants and their meetings
  const loadData = useCallback(async () => {
    try {
      const participantList = await api.getParticipants();
      setParticipants(participantList);

      // Select all by default if nothing selected yet
      setSelectedParticipantIds((prev) =>
        prev.length > 0 ? prev : participantList.map((p) => p.id)
      );

      // Fetch all meetings
      const meetingsData = {};
      await Promise.all(
        participantList.map(async (p) => {
          try {
            const list = await api.getParticipantMeetings(p.id);
            meetingsData[p.id] = list;
          } catch {
            meetingsData[p.id] = [];
          }
        })
      );
      setMeetingsMap(meetingsData);
    } catch (err) {
      setAlert({
        type: 'error',
        title: 'Connection Notice',
        message: err.message || 'Failed to fetch participants. Make sure backend is running.'
      });
    } finally {
      setIsInitialLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 2. Scheduling search execution
  const executeSearch = async () => {
    if (selectedParticipantIds.length === 0) {
      setAlert({
        type: 'warning',
        title: 'Selection Required',
        message: 'Please select at least one participant to calculate meeting slots.'
      });
      return;
    }

    try {
      setIsLoadingSlots(true);
      setAlert(null);
      const res = await api.findSlots({
        participantIds: selectedParticipantIds,
        startDate: searchParams.startDate,
        endDate: searchParams.endDate,
        durationMinutes: searchParams.durationMinutes,
        granularityMinutes: searchParams.granularityMinutes
      });
      setSchedulingResults(res);
    } catch (err) {
      setAlert({
        type: 'error',
        title: 'Scheduling Failed',
        message: err.message || 'Unable to calculate meeting slots.'
      });
    } finally {
      setIsLoadingSlots(false);
    }
  };

  // 3. Reset seed data to assignment defaults
  const handleResetSeed = async () => {
    try {
      setIsResetting(true);
      await api.seedDatabase(true);
      await loadData();
      setSearchParams({
        startDate: '2026-03-08',
        endDate: '2026-03-14',
        durationMinutes: 45,
        granularityMinutes: 15
      });
      setAlert({
        type: 'success',
        title: 'Scenario Reset',
        message: 'Successfully restored 4 assignment participants: Maya (Bangalore), Tom (London), Sara (SF), Jack (Sydney).'
      });
      setSchedulingResults(null);
    } catch (err) {
      setAlert({
        type: 'error',
        title: 'Reset Failed',
        message: err.message || 'Failed to reset seed data.'
      });
    } finally {
      setIsResetting(false);
    }
  };

  // 4. Save participant (Create or Update)
  const handleSaveParticipant = async (data) => {
    if (participantToEdit) {
      await api.updateParticipant(participantToEdit.id, data);
      setAlert({ type: 'success', message: `Updated participant '${data.name}'.` });
    } else {
      await api.createParticipant(data);
      setAlert({ type: 'success', message: `Added new participant '${data.name}'.` });
    }
    await loadData();
  };

  // 5. Delete participant
  const handleDeleteParticipant = async (id) => {
    if (!window.confirm('Are you sure you want to delete this participant?')) return;
    try {
      await api.deleteParticipant(id);
      setSelectedParticipantIds((prev) => prev.filter((pId) => pId !== id));
      await loadData();
      setAlert({ type: 'success', message: 'Participant deleted.' });
    } catch (err) {
      setAlert({ type: 'error', message: err.message || 'Failed to delete participant.' });
    }
  };

  // 6. Add busy block
  const handleSaveMeeting = async (participantId, meetingData) => {
    await api.createMeeting(participantId, meetingData);
    await loadData();
    setAlert({ type: 'success', message: 'Busy block logged successfully.' });
  };

  // 7. Delete busy block
  const handleDeleteMeeting = async (meetingId) => {
    try {
      await api.deleteMeeting(meetingId);
      await loadData();
      setAlert({ type: 'success', message: 'Busy block removed.' });
    } catch (err) {
      setAlert({ type: 'error', message: err.message || 'Failed to remove busy block.' });
    }
  };

  // Participant selection toggles
  const handleToggleParticipant = (id) => {
    setSelectedParticipantIds((prev) =>
      prev.includes(id) ? prev.filter((pId) => pId !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    setSelectedParticipantIds(participants.map((p) => p.id));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased">
      {/* Navigation */}
      <Navbar
        onAddParticipant={() => {
          setParticipantToEdit(null);
          setIsParticipantModalOpen(true);
        }}
        onResetSeed={handleResetSeed}
        isResetting={isResetting}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Banner Alert Notification */}
        {alert && (
          <Alert
            type={alert.type}
            title={alert.title}
            onClose={() => setAlert(null)}
            className="animate-fade-in"
          >
            {alert.message}
          </Alert>
        )}

        {/* Hero Info Card */}
        <section className="bg-gradient-to-r from-blue-900/30 via-indigo-900/20 to-slate-900/40 border border-blue-500/20 rounded-2xl p-6 shadow-xl relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5 max-w-3xl">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/30 inline-flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Production Spec
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  Target Window: 8–14 March 2026 (45 min)
                </span>
              </div>
              <h2 className="text-xl font-extrabold text-white tracking-tight">
                Global Distributed Team Coordinator
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Calculates exact meeting windows by projecting local working hours and pre-existing busy blocks into canonical UTC intervals <code className="text-blue-300">[start, end)</code> with full daylight-saving transition accuracy (such as US Spring Forward on March 8, 2026).
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleResetSeed}
                className="px-4 py-2 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Reset Assignment Data
              </button>
            </div>
          </div>
        </section>

        {/* Scheduler Form */}
        <SchedulerForm
          searchParams={searchParams}
          onChange={setSearchParams}
          onSearch={executeSearch}
          isLoading={isLoadingSlots}
          selectedParticipantCount={selectedParticipantIds.length}
          totalParticipantCount={participants.length}
          onSelectAll={handleSelectAll}
        />

        {/* 24-Hour Timezone Timeline Matrix */}
        <TimezoneMatrix
          participants={participants}
          meetingsMap={meetingsMap}
          selectedDate={searchParams.startDate}
        />

        {/* Participants Grid Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-400" />
                Team Participants ({participants.length})
              </h3>
              <p className="text-xs text-slate-400">
                Check participants to include them in the meeting calculation.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-xs text-blue-400 hover:text-blue-300 font-medium"
              >
                Select All
              </button>
              <span className="text-slate-600">|</span>
              <button
                type="button"
                onClick={() => setSelectedParticipantIds([])}
                className="text-xs text-slate-400 hover:text-slate-300"
              >
                Deselect All
              </button>
            </div>
          </div>

          {isInitialLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-44 bg-slate-900/60 rounded-xl border border-slate-800 animate-pulse" />
              ))}
            </div>
          ) : participants.length === 0 ? (
            <div className="text-center py-12 bg-slate-900/40 rounded-2xl border border-slate-800">
              <Users className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <h4 className="text-sm font-semibold text-white">No participants found</h4>
              <p className="text-xs text-slate-400 mt-1">Click below to load the default assignment scenario.</p>
              <button
                onClick={handleResetSeed}
                className="mt-4 px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-500 text-white"
              >
                Load Default Scenario
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {participants.map((p) => (
                <ParticipantCard
                  key={p.id}
                  participant={p}
                  isSelected={selectedParticipantIds.includes(p.id)}
                  onToggleSelect={() => handleToggleParticipant(p.id)}
                  onEdit={(item) => {
                    setParticipantToEdit(item);
                    setIsParticipantModalOpen(true);
                  }}
                  onDelete={handleDeleteParticipant}
                  onAddMeeting={(item) => {
                    setMeetingTargetParticipant(item);
                    setIsMeetingModalOpen(true);
                  }}
                  onDeleteMeeting={handleDeleteMeeting}
                  meetings={meetingsMap[p.id] || []}
                />
              ))}
            </div>
          )}
        </section>

        {/* Suggested Slots / Diagnostics Results Area */}
        <section className="space-y-6">
          {isLoadingSlots ? (
            <div className="py-16 text-center bg-slate-900/40 rounded-2xl border border-slate-800/80">
              <div className="inline-block animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mb-3" />
              <p className="text-sm font-medium text-white">Computing Multi-Timezone Free Intervals...</p>
              <p className="text-xs text-slate-400 mt-1">Intersecting working hours and applying DST conversions.</p>
            </div>
          ) : schedulingResults ? (
            schedulingResults.hasUniversalSlots ? (
              <SlotResults
                results={schedulingResults}
                durationMinutes={searchParams.durationMinutes}
              />
            ) : (
              <AlternativesCard
                alternatives={schedulingResults.alternatives}
                durationMinutes={searchParams.durationMinutes}
              />
            )
          ) : (
            <div className="text-center py-12 bg-slate-900/30 rounded-2xl border border-slate-800/60 text-slate-400 text-xs">
              Configure parameters above and click <strong className="text-blue-400">Calculate Optimal Meeting Slots</strong> to view suggested times.
            </div>
          )}
        </section>
      </main>

      {/* Modals */}
      <ParticipantModal
        isOpen={isParticipantModalOpen}
        onClose={() => {
          setIsParticipantModalOpen(false);
          setParticipantToEdit(null);
        }}
        onSave={handleSaveParticipant}
        participantToEdit={participantToEdit}
      />

      <MeetingModal
        isOpen={isMeetingModalOpen}
        onClose={() => {
          setIsMeetingModalOpen(false);
          setMeetingTargetParticipant(null);
        }}
        onSave={handleSaveMeeting}
        participant={meetingTargetParticipant}
      />
    </div>
  );
}
