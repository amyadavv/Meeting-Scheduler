import { Meeting } from '../models/Meeting.js';

export const meetingRepository = {
  findAll: async (filter = {}) => {
    return Meeting.find(filter).sort({ startTime: 1 }).populate('participantId', 'name email location timezone').exec();
  },

  findById: async (id) => {
    return Meeting.findById(id).exec();
  },

  findByParticipantId: async (participantId) => {
    return Meeting.find({ participantId }).sort({ startTime: 1 }).exec();
  },

  findByParticipantIdsAndDateRange: async (participantIds, startUtcDate, endUtcDate) => {
    return Meeting.find({
      participantId: { $in: participantIds },
      startTime: { $lt: endUtcDate },
      endTime: { $gt: startUtcDate }
    })
      .sort({ startTime: 1 })
      .exec();
  },

  create: async (data) => {
    return Meeting.create(data);
  },

  deleteById: async (id) => {
    return Meeting.findByIdAndDelete(id).exec();
  },

  deleteByParticipantId: async (participantId) => {
    return Meeting.deleteMany({ participantId }).exec();
  },

  deleteAll: async () => {
    return Meeting.deleteMany({}).exec();
  }
};
