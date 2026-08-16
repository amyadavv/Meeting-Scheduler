/**
 * Validated list of major IANA timezones supported and recommended for the UI.
 * The system dynamically validates any IANA timezone via Intl.supportedValuesOf('timeZone').
 */
export const POPULAR_TIMEZONES = [
  { id: 'Asia/Kolkata', label: 'Asia/Kolkata (IST - Bangalore, New Delhi)', offset: '+05:30' },
  { id: 'Europe/London', label: 'Europe/London (GMT/BST - London)', offset: '+00:00' },
  { id: 'America/Los_Angeles', label: 'America/Los_Angeles (PST/PDT - San Francisco, LA)', offset: '-08:00' },
  { id: 'Australia/Sydney', label: 'Australia/Sydney (AEDT/AEST - Sydney, Melbourne)', offset: '+11:00' },
  { id: 'America/New_York', label: 'America/New_York (EST/EDT - New York)', offset: '-05:00' },
  { id: 'America/Chicago', label: 'America/Chicago (CST/CDT - Chicago)', offset: '-06:00' },
  { id: 'Europe/Paris', label: 'Europe/Paris (CET/CEST - Paris, Berlin)', offset: '+01:00' },
  { id: 'Asia/Tokyo', label: 'Asia/Tokyo (JST - Tokyo)', offset: '+09:00' },
  { id: 'Asia/Singapore', label: 'Asia/Singapore (SGT - Singapore)', offset: '+08:00' },
  { id: 'Asia/Dubai', label: 'Asia/Dubai (GST - Dubai)', offset: '+04:00' },
  { id: 'Pacific/Auckland', label: 'Pacific/Auckland (NZDT/NZST - Auckland)', offset: '+13:00' },
  { id: 'UTC', label: 'UTC (Coordinated Universal Time)', offset: '+00:00' }
];

export const INITIAL_PARTICIPANTS = [
  {
    name: 'Maya',
    email: 'maya.bangalore@distributed.team',
    location: 'Bangalore',
    timezone: 'Asia/Kolkata',
    availability: {
      startTime: '09:00',
      endTime: '18:00',
      daysOfWeek: [1, 2, 3, 4, 5] // Mon-Fri
    }
  },
  {
    name: 'Tom',
    email: 'tom.london@distributed.team',
    location: 'London',
    timezone: 'Europe/London',
    availability: {
      startTime: '08:00',
      endTime: '17:00',
      daysOfWeek: [1, 2, 3, 4, 5] // Mon-Fri
    }
  },
  {
    name: 'Sara',
    email: 'sara.sf@distributed.team',
    location: 'San Francisco',
    timezone: 'America/Los_Angeles',
    availability: {
      startTime: '06:00',
      endTime: '15:00',
      daysOfWeek: [1, 2, 3, 4, 5] // Mon-Fri
    }
  },
  {
    name: 'Jack',
    email: 'jack.sydney@distributed.team',
    location: 'Sydney',
    timezone: 'Australia/Sydney',
    availability: {
      startTime: '10:00',
      endTime: '19:00',
      daysOfWeek: [1, 2, 3, 4, 5] // Mon-Fri
    }
  }
];
