import mongoose from 'mongoose';
import { isValidTimezone } from '../utils/timezoneHelper.js';

const availabilitySchema = new mongoose.Schema(
  {
    startTime: {
      type: String,
      required: [true, 'Availability startTime is required'],
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'startTime must be in HH:mm 24-hour format (e.g. 09:00)']
    },
    endTime: {
      type: String,
      required: [true, 'Availability endTime is required'],
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'endTime must be in HH:mm 24-hour format (e.g. 18:00)']
    },
    daysOfWeek: {
      type: [Number],
      default: [1, 2, 3, 4, 5], // Monday (1) to Friday (5)
      validate: {
        validator: function (days) {
          if (!Array.isArray(days) || days.length === 0) return false;
          return days.every((day) => Number.isInteger(day) && day >= 1 && day <= 7);
        },
        message: 'daysOfWeek must be an array of integers between 1 (Monday) and 7 (Sunday)'
      }
    }
  },
  { _id: false }
);

// Database-level validator: startTime must be strictly less than endTime
availabilitySchema.pre('validate', function (next) {
  if (this.startTime && this.endTime) {
    if (this.startTime >= this.endTime) {
      this.invalidate('endTime', 'Availability endTime must be strictly after startTime');
    }
  }
  next();
});

const participantSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Participant name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name cannot exceed 100 characters']
    },
    email: {
      type: String,
      required: [true, 'Participant email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Invalid email address format']
    },
    location: {
      type: String,
      required: [true, 'Participant location is required'],
      trim: true,
      minlength: [2, 'Location must be at least 2 characters']
    },
    timezone: {
      type: String,
      required: [true, 'Participant timezone is required'],
      validate: {
        validator: isValidTimezone,
        message: (props) => `'${props.value}' is not a valid IANA timezone identifier`
      }
    },
    availability: {
      type: availabilitySchema,
      required: [true, 'Participant availability configuration is required'],
      default: () => ({
        startTime: '09:00',
        endTime: '18:00',
        daysOfWeek: [1, 2, 3, 4, 5]
      })
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

// Index for name lookups
participantSchema.index({ name: 1 });

export const Participant = mongoose.model('Participant', participantSchema);
