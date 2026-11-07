const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

export const pad = (n: number, largo = 2): string => String(n).padStart(largo, '0');
export const mesCorto = (indice: number): string => MESES[indice] ?? '';
export const soles = (c: number): string =>
  `S/ ${(c / 100).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
export const fechaCorta = (iso: string): string => {
  const [a, m, d] = iso.slice(0, 10).split('-');
  return `${d}/${m}/${a}`;
};
