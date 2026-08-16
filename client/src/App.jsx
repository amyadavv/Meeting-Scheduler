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
import { Users, Calendar, Layers, ShieldCheck, UserPlus } from 'lucide-react';

export default function App() {
  const [participants, setParticipants] = useState([]);
  const [meetingsMap, setMeetingsMap] = useState({});
  const [selectedParticipantIds, setSelectedParticipantIds] = useState([]);

  // Modals state
  const [isParticipantModalOpen, setIsParticipantModalOpen] = useState(false);
  const [participantToEdit, setParticipantToEdit] = useState(null);
  const [isMeetingModalOpen, setIsMeetingModalOpen] = useState(false);
  const [meetingTargetParticipant, setMeetingTargetParticipant] = useState(null);

  // Helper for today's date formatted as YYYY-MM-DD
  const getTodayDateString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Search parameters - Defaults to Today's date with empty End Date
  const [searchParams, setSearchParams] = useState({
    startDate: getTodayDateString(),
    endDate: '',
    durationMinutes: 45,
    granularityMinutes: 15
  });

  // Scheduling output state
  const [schedulingResults, setSchedulingResults] = useState(null);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [alert, setAlert] = useState(null);

  // 1. Fetch participants and their meetings from Database
  const loadData = useCallback(async () => {
    try {
      const participantList = await api.getParticipants();
      setParticipants(participantList);

      // Select all by default if nothing selected yet
      setSelectedParticipantIds((prev) =>
        prev.length > 0 ? prev : participantList.map((p) => p.id)
      );

      // Fetch all meetings for all participants
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

    if (!searchParams.startDate || !searchParams.endDate) {
      setAlert({
        type: 'warning',
        title: 'Date Range Required',
        message: 'Please specify both a Start Date and an End Date.'
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
        title: 'Scheduling Error',
        message: err.message || 'Failed to calculate meeting slots.'
      });
    } finally {
      setIsLoadingSlots(false);
    }
  };

  // 3. Create participant
  const handleCreateParticipant = async (data) => {
    const created = await api.createParticipant(data);
    await loadData();
    setSelectedParticipantIds((prev) => [...prev, created.id]);
    setAlert({ type: 'success', message: `Participant "${created.name}" created successfully.` });
  };

  // 4. Update participant
  const handleUpdateParticipant = async (id, data) => {
    const updated = await api.updateParticipant(id, data);
    await loadData();
    setAlert({ type: 'success', message: `Participant "${updated.name}" updated successfully.` });
  };

  // 5. Delete participant (Deletes from MongoDB database and cascades meetings)
  const handleDeleteParticipant = async (id) => {
    if (!window.confirm('Are you sure you want to delete this participant from the database?')) return;
    try {
      await api.deleteParticipant(id);
      setSelectedParticipantIds((prev) => prev.filter((pId) => pId !== id));
      await loadData();
      setAlert({ type: 'success', message: 'Participant deleted from database.' });
    } catch (err) {
      setAlert({ type: 'error', message: err.message || 'Failed to delete participant.' });
    }
  };

  // 6. Add busy block
  const handleSaveMeeting = async (participantId, meetingData) => {
    await api.createMeeting(participantId, meetingData);
    await loadData();
    setAlert({ type: 'success', message: 'Busy block logged successfully in database.' });
  };

  // 7. Delete busy block
  const handleDeleteMeeting = async (meetingId) => {
    try {
      await api.deleteMeeting(meetingId);
      await loadData();
      setAlert({ type: 'success', message: 'Busy block removed from database.' });
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
                  <ShieldCheck className="w-3.5 h-3.5" /> Enterprise Scheduler
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  Multi-Timezone Engine
                </span>
              </div>
              <h2 className="text-xl font-extrabold text-white tracking-tight">
                Global Distributed Team Coordinator
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Calculates exact meeting windows by projecting local working hours and pre-existing busy blocks into canonical UTC intervals <code className="text-blue-300">[start, end)</code> with full daylight-saving transition accuracy.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setParticipantToEdit(null);
                  setIsParticipantModalOpen(true);
                }}
                className="px-4 py-2 text-xs font-medium rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-all flex items-center gap-1.5 shadow-sm"
              >
                <UserPlus className="w-3.5 h-3.5" />
                Add Team Member
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
              <p className="text-xs text-slate-400 mt-1">Add your team members to start calculating meeting slots.</p>
              <button
                onClick={() => {
                  setParticipantToEdit(null);
                  setIsParticipantModalOpen(true);
                }}
                className="mt-4 px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-500 text-white inline-flex items-center gap-1.5"
              >
                <UserPlus className="w-3.5 h-3.5" />
                Add Your First Participant
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
            schedulingResults.slots.length > 0 ? (
              <SlotResults
                slots={schedulingResults.slots}
                metrics={schedulingResults.metrics}
              />
            ) : (
              <AlternativesCard
                diagnostics={schedulingResults.diagnostics}
                alternatives={schedulingResults.alternatives}
              />
            )
          ) : null}
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-6 text-center text-xs text-slate-500">
        Distributed Meeting Scheduler • Enterprise Full-Stack Availability Engine
      </footer>

      {/* Modals */}
      <ParticipantModal
        isOpen={isParticipantModalOpen}
        onClose={() => setIsParticipantModalOpen(false)}
        onSave={async (data) => {
          if (participantToEdit) {
            await handleUpdateParticipant(participantToEdit.id, data);
          } else {
            await handleCreateParticipant(data);
          }
        }}
        participantToEdit={participantToEdit}
      />

      <MeetingModal
        isOpen={isMeetingModalOpen}
        onClose={() => setIsMeetingModalOpen(false)}
        onSave={async (meetingData) => {
          if (meetingTargetParticipant) {
            await handleSaveMeeting(meetingTargetParticipant.id, meetingData);
          }
        }}
        participant={meetingTargetParticipant}
      />
    </div>
  );
}
