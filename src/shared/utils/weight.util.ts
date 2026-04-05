export const formatWeight = (grams: number): string => {
  if (grams < 1000) {
    return `${grams} g`;
  }

  const kilograms = grams / 1000;
  if (kilograms < 1000) {
    return `${parseFloat(kilograms.toFixed(2))} kg`;
  }

  const tons = kilograms / 1000;
  return `${parseFloat(tons.toFixed(2))} tons`;
};
