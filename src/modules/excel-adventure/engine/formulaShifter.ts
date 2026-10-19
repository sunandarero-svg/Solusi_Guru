import { GridData } from '../types';

/**
 * Menggeser referensi baris dalam rumus dengan memperhitungkan simbol absolut ($).
 * Contoh:
 * =B2*C2 digeser 1 baris ke bawah menjadi =B3*C3
 * =$B$1*C2 digeser 1 baris ke bawah menjadi =$B$1*C3 ($B$1 terkunci)
 */
export const shiftFormulaRow = (formula: string, deltaRow: number): string => {
  if (!formula.startsWith('=')) return formula;

  // Regex mencari pola alamat sel: ($?)([A-E])(\$?)([0-9]+)
  return formula.replace(
    /(\$?)([A-E])(\$?)([0-9]+)/gi,
    (match, absCol, col, absRow, rowStr) => {
      const row = parseInt(rowStr, 10);
      // Jika baris memiliki $, jangan geser barisnya
      if (absRow === '$') {
        return `${absCol}${col.toUpperCase()}${absRow}${row}`;
      }
      const newRow = Math.max(1, Math.min(10, row + deltaRow));
      return `${absCol}${col.toUpperCase()}${newRow}`;
    }
  );
};

/**
 * Logika AutoFill (Kotak Pengisi Otomatis ala Excel)
 * Menarik kotak kecil di sudut kanan bawah sel aktif ke baris-baris berikutnya.
 */
export const executeAutoFill = (
  sourceCellId: string,
  targetCellIds: string[],
  currentGrid: GridData
): GridData => {
  const sourceCell = currentGrid[sourceCellId];
  if (!sourceCell) return currentGrid;

  const sourceVal = String(sourceCell.value || '');
  const sourceStyle = sourceCell.style ? { ...sourceCell.style } : {};

  const sourceCol = sourceCellId[0];
  const sourceRow = parseInt(sourceCellId.slice(1), 10);

  const updatedGrid: GridData = { ...currentGrid };

  // Cek apakah ada pola deret angka sebelumnya (misal baris sebelum sourceCell berisi angka)
  const prevCellId = `${sourceCol}${sourceRow - 1}`;
  const prevVal = Number(currentGrid[prevCellId]?.value);
  const currentNumVal = Number(sourceVal);
  const isSeriesNumber =
    !sourceVal.startsWith('=') &&
    !isNaN(currentNumVal) &&
    sourceVal.trim() !== '' &&
    !isNaN(prevVal) &&
    currentGrid[prevCellId]?.value !== undefined;

  const step = isSeriesNumber ? currentNumVal - prevVal : 1;

  targetCellIds.forEach((targetId, index) => {
    const targetRow = parseInt(targetId.slice(1), 10);
    const delta = targetRow - sourceRow;

    let newVal: string | number = sourceVal;

    if (sourceVal.startsWith('=')) {
      // Duplikasi rumus dengan pergeseran relatif
      newVal = shiftFormulaRow(sourceVal, delta);
    } else if (isSeriesNumber) {
      // Melanjutkan pola deret (contoh: 1, 2 -> 3, 4, 5)
      newVal = currentNumVal + step * (index + 1);
    } else if (!isNaN(currentNumVal) && sourceVal.trim() !== '') {
      // Jika angka tunggal, duplikasi nilainya
      newVal = currentNumVal;
    }

    updatedGrid[targetId] = {
      value: newVal,
      style: { ...sourceStyle }
    };
  });

  return updatedGrid;
};
