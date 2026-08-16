const API_BASE = '/api';

/**
 * Generic API request wrapper that unwraps the uniform response envelope
 * or throws a formatted Error on failure.
 */
async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  };

  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }

  let response;
  try {
    response = await fetch(url, config);
  } catch (netErr) {
    throw new Error(`Network Error: Failed to connect to server at ${url}. Is the backend running?`);
  }

  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error(`Server returned non-JSON response with HTTP status ${response.status}`);
  }

  if (!response.ok || data.success === false) {
    const err = new Error(data?.error?.message || `Request failed with HTTP status ${response.status}`);
    err.code = data?.error?.code || 'UNKNOWN_ERROR';
    err.details = data?.error?.details || [];
    err.status = response.status;
    throw err;
  }

  return data.data;
}

export const api = {
  // Health
  getHealth: () => request('/health'),

  // Participants
  getParticipants: () => request('/participants'),
  getParticipant: (id) => request(`/participants/${id}`),
  createParticipant: (data) => request('/participants', { method: 'POST', body: data }),
  updateParticipant: (id, data) => request(`/participants/${id}`, { method: 'PUT', body: data }),
  deleteParticipant: (id) => request(`/participants/${id}`, { method: 'DELETE' }),

  // Meetings
  getParticipantMeetings: (participantId) => request(`/participants/${participantId}/meetings`),
  createMeeting: (participantId, data) => request(`/participants/${participantId}/meetings`, { method: 'POST', body: data }),
  deleteMeeting: (meetingId) => request(`/meetings/${meetingId}`, { method: 'DELETE' }),

  // Scheduling
  findSlots: (params) => request('/scheduling/slots', { method: 'POST', body: params }),

  // Seed / Reset
  seedDatabase: (reset = false) => request('/seed', { method: 'POST', body: { reset } })
};
