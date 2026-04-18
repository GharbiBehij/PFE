export const formatDate = (value: string | Date) => {
  const date = value instanceof Date ? value : new Date(value);
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
};
