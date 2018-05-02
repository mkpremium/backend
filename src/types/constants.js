export const Status = {
  AVAILABLE: 'AVAILABLE',
  OPENED: 'OPENED',
  SCHEDULED: 'SCHEDULED',
  CLOSED: 'CLOSED'
};

export const Queue = {
  Status,
  StatusAvailable: [
    Status.AVAILABLE,
    Status.SCHEDULED
  ]
};
