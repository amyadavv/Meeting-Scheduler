import React, { useState, useEffect } from 'react';
import { Modal } from './common/Modal.jsx';
import { Button } from './common/Button.jsx';
import { Alert } from './common/Alert.jsx';
import { AVAILABLE_TIMEZONES, DAYS_OF_WEEK } from '../utils/timezones.js';

export const ParticipantModal = ({ isOpen, onClose, onSave, participantToEdit }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    location: '',
    timezone: 'Asia/Kolkata',
    startTime: '09:00',
    endTime: '18:00',
    daysOfWeek: [1, 2, 3, 4, 5]
  });

  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (participantToEdit) {
      setFormData({
        name: participantToEdit.name || '',
        email: participantToEdit.email || '',
        location: participantToEdit.location || '',
        timezone: participantToEdit.timezone || 'Asia/Kolkata',
        startTime: participantToEdit.availability?.startTime || '09:00',
        endTime: participantToEdit.availability?.endTime || '18:00',
        daysOfWeek: participantToEdit.availability?.daysOfWeek || [1, 2, 3, 4, 5]
      });
    } else {
      setFormData({
        name: '',
        email: '',
        location: '',
        timezone: 'Asia/Kolkata',
        startTime: '09:00',
        endTime: '18:00',
        daysOfWeek: [1, 2, 3, 4, 5]
      });
    }
    setError(null);
  }, [participantToEdit, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDayToggle = (dayId) => {
    setFormData((prev) => {
      const exists = prev.daysOfWeek.includes(dayId);
      const newDays = exists
        ? prev.daysOfWeek.filter((d) => d !== dayId)
        : [...prev.daysOfWeek, dayId].sort((a, b) => a - b);
      return { ...prev, daysOfWeek: newDays };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Client-side UX validation
    if (!formData.name.trim() || !formData.email.trim() || !formData.location.trim()) {
      setError('Please fill in all required fields (Name, Email, Location).');
      return;
    }

    if (formData.startTime >= formData.endTime) {
      setError('Availability endTime must be strictly after startTime.');
      return;
    }

    if (formData.daysOfWeek.length === 0) {
      setError('Please select at least one active working day.');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSave({
        name: formData.name.trim(),
        email: formData.email.trim(),
        location: formData.location.trim(),
        timezone: formData.timezone,
        availability: {
          startTime: formData.startTime,
          endTime: formData.endTime,
          daysOfWeek: formData.daysOfWeek
        }
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save participant.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={participantToEdit ? 'Edit Participant' : 'Add New Participant'}
      subtitle="Configure location, IANA timezone, and working hours"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <Alert type="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Full Name *
            </label>
            <input
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. Maya"
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Email Address *
            </label>
            <input
              type="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              placeholder="maya@example.com"
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              City / Location *
            </label>
            <input
              type="text"
              name="location"
              required
              value={formData.location}
              onChange={handleChange}
              placeholder="e.g. Bangalore"
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              IANA Timezone *
            </label>
            <select
              name="timezone"
              value={formData.timezone}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
            >
              {AVAILABLE_TIMEZONES.map((tz) => (
                <option key={tz.id} value={tz.id}>
                  {tz.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Working Hours */}
        <div className="pt-3 border-t border-slate-800">
          <label className="block text-xs font-semibold text-slate-300 mb-2">
            Normal Working Hours (Local Time)
          </label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="text-[11px] text-slate-400 block mb-1">Start Time</span>
              <input
                type="time"
                name="startTime"
                required
                value={formData.startTime}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block mb-1">End Time</span>
              <input
                type="time"
                name="endTime"
                required
                value={formData.endTime}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Active Days */}
        <div>
          <span className="text-[11px] text-slate-400 block mb-1.5 font-medium">
            Active Working Days
          </span>
          <div className="flex flex-wrap gap-1.5">
            {DAYS_OF_WEEK.map((day) => {
              const isSelected = formData.daysOfWeek.includes(day.id);
              return (
                <button
                  type="button"
                  key={day.id}
                  onClick={() => handleDayToggle(day.id)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                    isSelected
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                  }`}
                >
                  {day.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            {participantToEdit ? 'Save Changes' : 'Create Participant'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
