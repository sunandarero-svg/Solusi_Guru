import * as XLSX from 'xlsx';
import { GridData } from '../types';
import { COLS, ROWS, getComputedCellValue } from './formulaParser';

/**
 * Mengekspor lembar kerja aktif ke dalam file Microsoft Excel (.xlsx) nyata.
 */
export const exportGridToXLSX = (grid: GridData, filename: string = 'Excel_Adventure_LembarKerja') => {
  if (typeof window === 'undefined') return;

  const wsData: (string | number)[][] = [];

  ROWS.forEach((r, rIdx) => {
    wsData[rIdx] = [];
    COLS.forEach((c, cIdx) => {
      const cellId = `${c}${r}`;
      const cell = grid[cellId];
      if (cell) {
        // Jika berisi rumus, kita ekspor nilai terhitungnya atau string rumusnya
        const computed = getComputedCellValue(cellId, grid);
        wsData[rIdx][cIdx] = computed !== undefined && computed !== null ? computed : '';
      } else {
        wsData[rIdx][cIdx] = '';
      }
    });
  });

  const ws = XLSX.utils.aoa_to_sheet(wsData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'LembarKerja1');
  XLSX.writeFile(wb, `${filename}.xlsx`);
};

/**
 * Mengimpor file .xlsx nyata ke dalam grid simulasi (Kolom A-E, Baris 1-10).
 */
export const importXLSXToGrid = async (file: File): Promise<GridData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawJson: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        const importedGrid: GridData = {};

        rawJson.slice(0, 10).forEach((row, rowIdx) => {
          const rowNum = rowIdx + 1;
          row.slice(0, 5).forEach((val, colIdx) => {
            const col = COLS[colIdx];
            if (col && rowNum <= 10) {
              const cellId = `${col}${rowNum}`;
              importedGrid[cellId] = {
                value: val !== undefined && val !== null ? val : '',
                style: {
                  bold: rowNum === 1,
                  align: typeof val === 'number' ? 'right' : 'left'
                }
              };
            }
          });
        });

        resolve(importedGrid);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
};
