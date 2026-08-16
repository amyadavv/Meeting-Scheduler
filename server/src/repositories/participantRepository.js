import { Participant } from '../models/Participant.js';

export const participantRepository = {
  findAll: async (filter = {}) => {
    return Participant.find(filter).sort({ name: 1 }).exec();
  },

  findById: async (id) => {
    return Participant.findById(id).exec();
  },

  findByEmail: async (email) => {
    return Participant.findOne({ email: email.toLowerCase().trim() }).exec();
  },

  findMultipleByIds: async (ids) => {
    return Participant.find({ _id: { $in: ids } }).exec();
  },

  create: async (data) => {
    return Participant.create(data);
  },

  update: async (id, updateData) => {
    return Participant.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true
    }).exec();
  },

  delete: async (id) => {
    return Participant.findByIdAndDelete(id).exec();
  },

  bulkCreate: async (participants) => {
    return Participant.insertMany(participants, { ordered: true });
  },

  count: async () => {
    return Participant.countDocuments().exec();
  },

  deleteAll: async () => {
    return Participant.deleteMany({}).exec();
  }
};
