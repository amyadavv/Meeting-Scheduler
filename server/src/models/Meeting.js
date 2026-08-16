import mongoose from 'mongoose';

const meetingSchema = new mongoose.Schema(
  {
    participantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Participant',
      required: [true, 'Meeting participantId is required'],
      index: true
    },
    title: {
      type: String,
      required: [true, 'Meeting title is required'],
      trim: true,
      default: 'Busy Block',
      maxlength: [200, 'Title cannot exceed 200 characters']
    },
    startTime: {
      type: Date,
      required: [true, 'Meeting startTime is required']
    },
    endTime: {
      type: Date,
      required: [true, 'Meeting endTime is required']
    }
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      }
    }
  }
);

// Database-level invariant: startTime must be strictly before endTime
meetingSchema.pre('validate', function (next) {
  if (this.startTime && this.endTime) {
    if (new Date(this.startTime).getTime() >= new Date(this.endTime).getTime()) {
      this.invalidate('endTime', 'Meeting endTime must be strictly after startTime');
    }
  }
  next();
});

// Compound index for high-performance range lookups per participant
meetingSchema.index({ participantId: 1, startTime: 1, endTime: 1 });

export const Meeting = mongoose.model('Meeting', meetingSchema);
