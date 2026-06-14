export const formatCurrency = (value: number, currency = 'TND') => {
  const formatter = new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  });

  return formatter.format(value);
};
