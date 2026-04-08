const REVIEW_EDIT_WINDOW_MS = 24 * 60 * 60 * 1000;

export const getEditableUntil = (createdAt: Date) => {
  return new Date(createdAt.getTime() + REVIEW_EDIT_WINDOW_MS);
};
