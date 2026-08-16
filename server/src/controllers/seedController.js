import { participantService } from '../services/participantService.js';
import { formatSuccessResponse } from '../utils/responseEnvelope.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';

export const seedController = {
  seed: async (req, res, next) => {
    try {
      const forceReset = req.body?.reset === true || req.query?.reset === 'true';
      const participants = await participantService.seedDefaultParticipants(forceReset);
      return res.status(HTTP_STATUS.OK).json(
        formatSuccessResponse(participants, {
          message: forceReset
            ? 'Database reset and re-seeded with 4 default participants (Maya, Tom, Sara, Jack).'
            : 'Default participants verified / seeded successfully.'
        })
      );
    } catch (error) {
      next(error);
    }
  }
};
