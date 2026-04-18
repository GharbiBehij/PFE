export const formatCurrency = (value: number, currency = 'TND') => {
  const formatter = new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  });

  return formatter.format(value);
};
