import { participantRepository } from '../repositories/participantRepository.js';
import { meetingRepository } from '../repositories/meetingRepository.js';
import { NotFoundError, ConflictError } from '../errors/index.js';
import { INITIAL_PARTICIPANTS } from '../constants/timezones.js';

export const participantService = {
  /**
   * Retrieves all participants sorted by name.
   */
  getAllParticipants: async () => {
    return participantRepository.findAll();
  },

  /**
   * Retrieves a single participant by ID.
   */
  getParticipantById: async (id) => {
    const participant = await participantRepository.findById(id);
    if (!participant) {
      throw new NotFoundError('Participant', id);
    }
    return participant;
  },

  /**
   * Creates a new participant with validation & uniqueness checks.
   */
  createParticipant: async (data) => {
    const existing = await participantRepository.findByEmail(data.email);
    if (existing) {
      throw new ConflictError(`Participant with email '${data.email}' already exists.`);
    }

    return participantRepository.create(data);
  },

  /**
   * Updates an existing participant.
   */
  updateParticipant: async (id, updateData) => {
    const existing = await participantRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Participant', id);
    }

    if (updateData.email && updateData.email.toLowerCase() !== existing.email.toLowerCase()) {
      const emailConflict = await participantRepository.findByEmail(updateData.email);
      if (emailConflict) {
        throw new ConflictError(`Participant with email '${updateData.email}' already exists.`);
      }
    }

    const updated = await participantRepository.update(id, updateData);
    return updated;
  },

  /**
   * Deletes a participant and cascades deletion of their meetings.
   */
  deleteParticipant: async (id) => {
    const participant = await participantRepository.findById(id);
    if (!participant) {
      throw new NotFoundError('Participant', id);
    }

    // Cascade delete associated meetings
    await meetingRepository.deleteByParticipantId(id);
    await participantRepository.delete(id);

    return { id, deleted: true, name: participant.name };
  },

  /**
   * Seeds the 4 initial participants (Maya, Tom, Sara, Jack) from the assignment.
   */
  seedDefaultParticipants: async (forceReset = false) => {
    if (forceReset) {
      await meetingRepository.deleteAll();
      await participantRepository.deleteAll();
    }

    const count = await participantRepository.count();
    if (count > 0 && !forceReset) {
      return participantRepository.findAll();
    }

    const created = await participantRepository.bulkCreate(INITIAL_PARTICIPANTS);
    return created;
  }
};
