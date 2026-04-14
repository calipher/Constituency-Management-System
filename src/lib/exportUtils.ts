export function exportToCSV<T extends Record<string, any>>(
  filename: string,
  data: T[],
  columns: { header: string; key: keyof T }[]
) {
  if (!data || !data.length) return;

  const csvRows = [];
  
  // Add headers
  csvRows.push(columns.map(col => `"${col.header}"`).join(','));

  // Add data
  for (const row of data) {
    const values = columns.map(col => {
      const val = row[col.key];
      const escaped = ('' + (val ?? '')).replace(/"/g, '""');
      return `"${escaped}"`;
    });
    csvRows.push(values.join(','));
  }

  const csvString = csvRows.join('\n');
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
