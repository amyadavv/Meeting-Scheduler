import { participantService } from '../services/participantService.js';
import { formatSuccessResponse } from '../utils/responseEnvelope.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';

export const participantController = {
  getAll: async (req, res, next) => {
    try {
      const participants = await participantService.getAllParticipants();
      return res.status(HTTP_STATUS.OK).json(formatSuccessResponse(participants));
    } catch (error) {
      next(error);
    }
  },

  getById: async (req, res, next) => {
    try {
      const participant = await participantService.getParticipantById(req.params.id);
      return res.status(HTTP_STATUS.OK).json(formatSuccessResponse(participant));
    } catch (error) {
      next(error);
    }
  },

  create: async (req, res, next) => {
    try {
      const created = await participantService.createParticipant(req.body);
      return res.status(HTTP_STATUS.CREATED).json(formatSuccessResponse(created));
    } catch (error) {
      next(error);
    }
  },

  update: async (req, res, next) => {
    try {
      const updated = await participantService.updateParticipant(req.params.id, req.body);
      return res.status(HTTP_STATUS.OK).json(formatSuccessResponse(updated));
    } catch (error) {
      next(error);
    }
  },

  delete: async (req, res, next) => {
    try {
      const result = await participantService.deleteParticipant(req.params.id);
      return res.status(HTTP_STATUS.OK).json(formatSuccessResponse(result));
    } catch (error) {
      next(error);
    }
  }
};
