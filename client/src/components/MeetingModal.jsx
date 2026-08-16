import React, { useState, useEffect } from 'react';
import { Modal } from './common/Modal.jsx';
import { Button } from './common/Button.jsx';
import { Alert } from './common/Alert.jsx';

export const MeetingModal = ({ isOpen, onClose, onSave, participant }) => {
  const getTodayDateString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState(getTodayDateString());
  const [startTime, setStartTime] = useState('09:00');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('10:00');

  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Helper to calculate 1 hour after a given time string (HH:mm)
  const addOneHour = (timeStr) => {
    if (!timeStr) return '10:00';
    const [h, m] = timeStr.split(':').map(Number);
    const newH = (h + 1) % 24;
    return `${String(newH).padStart(2, '0')}:${String(m || 0).padStart(2, '0')}`;
  };

  // Reset form with today's date whenever modal opens
  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setStartDate(getTodayDateString());
      setStartTime('09:00');
      setEndDate('');
      setEndTime('10:00');
      setError(null);
    }
  }, [isOpen]);

  if (!participant) return null;

  const handleStartTimeChange = (newStartTime) => {
    setStartTime(newStartTime);
    // If end date is same as start date (or empty), automatically keep end time 1 hour after start time
    if (!endDate || endDate === startDate) {
      setEndTime(addOneHour(newStartTime));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!startDate) {
      setError('Please select a Start Date.');
      return;
    }

    const effectiveEndDate = endDate.trim() ? endDate.trim() : startDate;

    const padTime = (t) => {
      if (!t) return '00:00:00';
      const parts = t.split(':');
      const h = parts[0].padStart(2, '0');
      const m = (parts[1] || '00').padStart(2, '0');
      const s = (parts[2] || '00').padStart(2, '0');
      return `${h}:${m}:${s}`;
    };

    const startIso = new Date(`${startDate}T${padTime(startTime)}Z`).toISOString();
    const endIso = new Date(`${effectiveEndDate}T${padTime(endTime)}Z`).toISOString();

    const startMs = new Date(startIso).getTime();
    const endMs = new Date(endIso).getTime();

    if (isNaN(startMs) || isNaN(endMs)) {
      setError('Please provide valid date and time values.');
      return;
    }

    if (startMs >= endMs) {
      setError('Meeting end time must be strictly after start time.');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSave({
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
            placeholder="e.g. 1:1 Sync, Client Review, Doctor Appointment"
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
              onChange={(e) => handleStartTimeChange(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              End Date (UTC) <span className="text-slate-500 text-[10px] font-normal">(optional, defaults to start date)</span>
            </label>
            <input
              type="date"
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
