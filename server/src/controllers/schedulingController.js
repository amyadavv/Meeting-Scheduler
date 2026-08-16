import { schedulingService } from '../services/schedulingService.js';
import { formatSuccessResponse } from '../utils/responseEnvelope.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';

export const schedulingController = {
  findSlots: async (req, res, next) => {
    try {
      const { participantIds, startDate, endDate, durationMinutes, granularityMinutes } = req.body;
      const result = await schedulingService.findAvailableSlots({
        participantIds,
        startDate,
        endDate,
        durationMinutes: durationMinutes ? Number(durationMinutes) : 45,
        granularityMinutes: granularityMinutes ? Number(granularityMinutes) : 15
      });

      return res.status(HTTP_STATUS.OK).json(formatSuccessResponse(result));
    } catch (error) {
      next(error);
    }
  }
};
