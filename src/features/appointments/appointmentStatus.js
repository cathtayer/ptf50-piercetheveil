// Shared labels and colours for appointment statuses (admin and customer pages).
export const STATUS_LABEL = {
  PENDING: 'Pending',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  NO_SHOW: 'No-show',
};

export const STATUS_STYLE = {
  PENDING: 'text-[#d4af37] border-[#d4af37]/30 bg-[#d4af37]/10',
  APPROVED: 'text-[#4ade80] border-[#4ade80]/30 bg-[#4ade80]/10',
  COMPLETED: 'text-brand-muted border-brand-muted/30 bg-brand-muted/10',
  REJECTED: 'text-red-400 border-red-400/30 bg-red-400/10',
  CANCELLED: 'text-brand-muted border-brand-muted/30 bg-transparent',
  NO_SHOW: 'text-orange-400 border-orange-400/30 bg-orange-400/10',
};

export const STATUS_OPTIONS = Object.keys(STATUS_LABEL);
