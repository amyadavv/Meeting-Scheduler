import React, { useState } from 'react';
import { Modal } from './common/Modal.jsx';
import { Button } from './common/Button.jsx';
import { Alert } from './common/Alert.jsx';

export const MeetingModal = ({ isOpen, onClose, onSave, participant }) => {
  const [title, setTitle] = useState('Client Review Sync');
  const [startDate, setStartDate] = useState('2026-03-09');
  const [startTime, setStartTime] = useState('13:00');
  const [endDate, setEndDate] = useState('2026-03-09');
  const [endTime, setEndTime] = useState('14:00');

  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!participant) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const startIso = new Date(`${startDate}T${startTime}:00Z`).toISOString();
    const endIso = new Date(`${endDate}T${endTime}:00Z`).toISOString();

    if (new Date(startIso).getTime() >= new Date(endIso).getTime()) {
      setError('Meeting end time must be strictly after start time.');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSave(participant.id, {
        title: title.trim() || 'Busy Block',
        startTime: startIso,
        endTime: endIso
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to add busy block.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Add Busy Block for ${participant.name}`}
      subtitle={`Location: ${participant.location} (${participant.timezone})`}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <Alert type="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Meeting / Busy Title
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. 1:1 Sync, Doctor Appointment"
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Start Date (UTC)
            </label>
            <input
              type="date"
              required
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Start Time (UTC)
            </label>
            <input
              type="time"
              required
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              End Date (UTC)
            </label>
            <input
              type="date"
              required
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              End Time (UTC)
            </label>
            <input
              type="time"
              required
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <p className="text-[11px] text-slate-400 bg-slate-800/40 p-2.5 rounded-lg border border-slate-700/50">
          💡 The scheduling algorithm converts busy blocks and participant working hours to canonical UTC intervals to guarantee zero scheduling conflicts.
        </p>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            Log Busy Block
          </Button>
        </div>
      </form>
    </Modal>
  );
};
