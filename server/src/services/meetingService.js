import { meetingRepository } from '../repositories/meetingRepository.js';
import { participantRepository } from '../repositories/participantRepository.js';
import { NotFoundError, BusinessRuleError } from '../errors/index.js';

export const meetingService = {
  getMeetingsByParticipant: async (participantId) => {
    const participant = await participantRepository.findById(participantId);
    if (!participant) {
      throw new NotFoundError('Participant', participantId);
    }
    return meetingRepository.findByParticipantId(participantId);
  },

  getAllMeetings: async () => {
    return meetingRepository.findAll();
  },

  createMeeting: async (participantId, meetingData) => {
    const participant = await participantRepository.findById(participantId);
    if (!participant) {
      throw new NotFoundError('Participant', participantId);
    }

    const start = new Date(meetingData.startTime);
    const end = new Date(meetingData.endTime);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new BusinessRuleError('Meeting startTime and endTime must be valid ISO dates');
    }

    if (start.getTime() >= end.getTime()) {
      throw new BusinessRuleError('Meeting endTime must be strictly after startTime');
    }

    const newMeeting = await meetingRepository.create({
      participantId,
      title: meetingData.title || 'Busy Block',
      startTime: start,
      endTime: end
    });

    return newMeeting;
  },

  deleteMeeting: async (meetingId) => {
    const existing = await meetingRepository.findById(meetingId);
    if (!existing) {
      throw new NotFoundError('Meeting', meetingId);
    }

    await meetingRepository.deleteById(meetingId);
    return { id: meetingId, deleted: true };
  }
};
