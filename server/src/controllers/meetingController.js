import { meetingService } from '../services/meetingService.js';
import { formatSuccessResponse } from '../utils/responseEnvelope.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';

export const meetingController = {
  getByParticipant: async (req, res, next) => {
    try {
      const meetings = await meetingService.getMeetingsByParticipant(req.params.id);
      return res.status(HTTP_STATUS.OK).json(formatSuccessResponse(meetings));
    } catch (error) {
      next(error);
    }
  },

  getAll: async (req, res, next) => {
    try {
      const meetings = await meetingService.getAllMeetings();
      return res.status(HTTP_STATUS.OK).json(formatSuccessResponse(meetings));
    } catch (error) {
      next(error);
    }
  },

  create: async (req, res, next) => {
    try {
      const participantId = req.params.id || req.body.participantId;
      const created = await meetingService.createMeeting(participantId, req.body);
      return res.status(HTTP_STATUS.CREATED).json(formatSuccessResponse(created));
    } catch (error) {
      next(error);
    }
  },

  delete: async (req, res, next) => {
    try {
      const result = await meetingService.deleteMeeting(req.params.id);
      return res.status(HTTP_STATUS.OK).json(formatSuccessResponse(result));
    } catch (error) {
      next(error);
    }
  }
};
