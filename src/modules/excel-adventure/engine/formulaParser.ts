import { GridData, CellStyle } from '../types';

export const COLS = ['A', 'B', 'C', 'D', 'E'];
export const ROWS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

// Mengurai rentang sel seperti "B2:B6" atau "A1:C3" menjadi array sel ["B2", "B3", "B4", "B5", "B6"]
export const expandRange = (rangeStr: string): string[] => {
  const parts = rangeStr.trim().toUpperCase().split(':');
  if (parts.length !== 2) return [];
  const startMatch = parts[0].match(/^([A-Z]+)(\d+)$/);
  const endMatch = parts[1].match(/^([A-Z]+)(\d+)$/);
  if (!startMatch || !endMatch) return [];

  const startCol = COLS.indexOf(startMatch[1]);
  const endCol = COLS.indexOf(endMatch[1]);
  const startRow = parseInt(startMatch[2], 10);
  const endRow = parseInt(endMatch[2], 10);

  if (startCol === -1 || endCol === -1) return [];

  const c1 = Math.min(startCol, endCol);
  const c2 = Math.max(startCol, endCol);
  const r1 = Math.min(startRow, endRow);
  const r2 = Math.max(startRow, endRow);

  const cells: string[] = [];
  for (let c = c1; c <= c2; c++) {
    for (let r = r1; r <= r2; r++) {
      cells.push(`${COLS[c]}${r}`);
    }
  }
  return cells;
};

// Mendapatkan nilai terhitung dari sebuah sel (dengan proteksi rekursi melingkar)
export const getComputedCellValue = (
  cellId: string,
  grid: GridData,
  visited: Set<string> = new Set()
): string | number => {
  const id = cellId.toUpperCase().trim();
  if (visited.has(id)) return '#REF! (Melingkar)';
  const cell = grid[id];
  if (!cell || cell.value === undefined || cell.value === '') return '';

  const raw = String(cell.value).trim();
  if (!raw.startsWith('=')) {
    const num = Number(raw);
    return !isNaN(num) && raw !== '' ? num : raw;
  }

  visited.add(id);
  const res = evaluateFormula(raw, grid, visited);
  return res.error ? res.error : (res.result !== undefined ? res.result : '');
};

// Evaluasi ekspresi aritmetika dasar (+, -, *, /) secara aman menggunakan Shunting-Yard sederhana
export const evaluateSimpleArithmetic = (
  expr: string,
  grid: GridData,
  visited: Set<string>
): { result?: number; error?: string } => {
  const cleanExpr = expr.replace(/\s+/g, '');

  // Validasi karakter ilegal
  if (/[^A-E0-9.+\-*/()$]/i.test(cleanExpr)) {
    return { error: '#NAME? (Periksa penulisan rumus)' };
  }

  const tokenRegex = /(\$?[A-E]\$?(?:10|[1-9]))|(\d+(?:\.\d+)?)|([+\-*/()])/gi;
  const tokens: { type: 'num' | 'op'; value: any }[] = [];
  let match: RegExpExecArray | null;

  while ((match = tokenRegex.exec(cleanExpr)) !== null) {
    if (match[1]) {
      const cleanRef = match[1].replace(/\$/g, '').toUpperCase();
      const refVal = getComputedCellValue(cleanRef, grid, new Set(visited));
      const numVal = Number(refVal);
      if (isNaN(numVal)) {
        return { error: `#VALUE! (Sel ${cleanRef} bukan angka)` };
      }
      tokens.push({ type: 'num', value: numVal });
    } else if (match[2]) {
      tokens.push({ type: 'num', value: parseFloat(match[2]) });
    } else if (match[3]) {
      tokens.push({ type: 'op', value: match[3] });
    }
  }

  if (tokens.length === 0) return { error: '#ERROR! Rumus kosong' };

  const values: number[] = [];
  const ops: string[] = [];

  const precedence = (op: string) =>
    op === '+' || op === '-' ? 1 : op === '*' || op === '/' ? 2 : 0;

  const applyOp = (a: number, b: number, op: string) => {
    if (op === '+') return a + b;
    if (op === '-') return a - b;
    if (op === '*') return a * b;
    if (op === '/') return b === 0 ? NaN : a / b;
    return 0;
  };

  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (t.type === 'num') {
      values.push(t.value);
    } else if (t.value === '(') {
      ops.push('(');
    } else if (t.value === ')') {
      while (ops.length && ops[ops.length - 1] !== '(') {
        const op = ops.pop()!;
        const b = values.pop()!;
        const a = values.pop()!;
        values.push(applyOp(a, b, op));
      }
      ops.pop();
    } else if (t.type === 'op') {
      while (ops.length && precedence(ops[ops.length - 1]) >= precedence(t.value)) {
        const op = ops.pop()!;
        const b = values.pop()!;
        const a = values.pop()!;
        values.push(applyOp(a, b, op));
      }
      ops.push(t.value);
    }
  }

  while (ops.length) {
    const op = ops.pop()!;
    const b = values.pop()!;
    const a = values.pop()!;
    if (a === undefined || b === undefined) return { error: '#ERROR! Operator tidak lengkap' };
    const res = applyOp(a, b, op);
    if (isNaN(res)) return { error: '#DIV/0! (Pembagian dengan nol)' };
    values.push(res);
  }

  if (values.length !== 1 || isNaN(values[0])) {
    return { error: '#ERROR! Periksa kembali tanda operator' };
  }

  return { result: Math.round(values[0] * 100) / 100 };
};

// Pemisah argumen formula yang aman terhadap tanda kutip
const parseFormulaArgs = (argsRaw: string): string[] => {
  const args: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < argsRaw.length; i++) {
    const ch = argsRaw[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
      current += ch;
    } else if ((ch === ',' || ch === ';') && !inQuotes) {
      args.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  if (current) args.push(current.trim());
  return args;
};

// Fungsi utama evaluasi rumus Excel simulasi
export const evaluateFormula = (
  formulaStr: string,
  grid: GridData,
  visited: Set<string> = new Set()
): { result?: string | number; error?: string } => {
  const raw = String(formulaStr).trim();
  if (!raw.startsWith('=')) {
    return { result: raw };
  }

  const body = raw.slice(1).trim();
  if (!body) return { error: '#ERROR! Ketik rumus setelah tanda =' };

  // Cek apakah menggunakan Fungsi
  const funcMatch = body.match(/^([A-Z_]+)\((.*)\)$/i);
  if (funcMatch) {
    const funcName = funcMatch[1].toUpperCase();
    const argsRaw = funcMatch[2].trim();
    const args = parseFormulaArgs(argsRaw);

    // 1. Fungsi Logika IF: =IF(B2>=75, "Lulus", "Remedial")
    if (funcName === 'IF') {
      if (args.length !== 3) {
        return { error: '#ERROR! Format IF harus 3 bagian: =IF(syarat, "Benar", "Salah")' };
      }

      const condMatch = args[0].match(
        /^(\$?[A-E]\$?(?:10|[1-9]))\s*(>=|<=|<>|>|<|=)\s*(\d+(?:\.\d+)?|".*?")$/i
      );
      if (!condMatch) {
        return { error: '#ERROR! Syarat IF tidak valid (contoh: B2>=75)' };
      }

      const cellRef = condMatch[1].replace(/\$/g, '').toUpperCase();
      const leftCell = getComputedCellValue(cellRef, grid, new Set(visited));
      const op = condMatch[2];
      let rightVal: any = condMatch[3];
      if (rightVal.startsWith('"') && rightVal.endsWith('"')) {
        rightVal = rightVal.slice(1, -1);
      } else {
        rightVal = parseFloat(rightVal);
      }

      const leftNum = Number(leftCell);
      let isTrue = false;
      if (op === '>=') isTrue = leftNum >= rightVal;
      else if (op === '<=') isTrue = leftNum <= rightVal;
      else if (op === '>') isTrue = leftNum > rightVal;
      else if (op === '<') isTrue = leftNum < rightVal;
      else if (op === '=')
        isTrue = String(leftCell).toLowerCase() === String(rightVal).toLowerCase();
      else if (op === '<>')
        isTrue = String(leftCell).toLowerCase() !== String(rightVal).toLowerCase();

      const chosenArg = isTrue ? args[1] : args[2];
      const cleanVal = chosenArg.replace(/^["']|["']$/g, '');
      return { result: cleanVal };
    }

    // 2. Fungsi COUNTIF: =COUNTIF(C2:C6, "Lulus") atau =COUNTIF(B2:B6, ">=75")
    if (funcName === 'COUNTIF') {
      if (args.length !== 2) {
        return { error: '#ERROR! Format COUNTIF: =COUNTIF(rentang, kriteria)' };
      }
      const rangeCells = expandRange(args[0]);
      if (rangeCells.length === 0) return { error: '#ERROR! Rentang COUNTIF tidak valid' };

      const criteria = args[1].replace(/^["']|["']$/g, '').trim();
      const critMatch = criteria.match(/^(>=|<=|<>|>|<|=)?(.*)$/);
      const op = critMatch && critMatch[1] ? critMatch[1] : '=';
      const targetVal = critMatch ? critMatch[2].trim() : criteria;
      const targetNum = Number(targetVal);

      let matchCount = 0;
      rangeCells.forEach((c) => {
        const val = getComputedCellValue(c, grid, new Set(visited));
        const valNum = Number(val);

        if (!isNaN(valNum) && !isNaN(targetNum) && op !== '=') {
          if (op === '>=' && valNum >= targetNum) matchCount++;
          else if (op === '<=' && valNum <= targetNum) matchCount++;
          else if (op === '>' && valNum > targetNum) matchCount++;
          else if (op === '<' && valNum < targetNum) matchCount++;
          else if (op === '<>' && valNum !== targetNum) matchCount++;
        } else {
          if (op === '<>') {
            if (String(val).toLowerCase() !== targetVal.toLowerCase()) matchCount++;
          } else {
            if (String(val).toLowerCase() === targetVal.toLowerCase()) matchCount++;
          }
        }
      });

      return { result: matchCount };
    }

    // 3. Fungsi SUMIF: =SUMIF(B2:B6, "Robotik", C2:C6)
    if (funcName === 'SUMIF') {
      if (args.length < 2 || args.length > 3) {
        return { error: '#ERROR! Format SUMIF: =SUMIF(rentang_kriteria, kriteria, [rentang_jumlah])' };
      }
      const critRange = expandRange(args[0]);
      const sumRange = args.length === 3 ? expandRange(args[2]) : critRange;
      if (critRange.length === 0 || sumRange.length === 0) {
        return { error: '#ERROR! Rentang SUMIF tidak valid' };
      }

      const criteria = args[1].replace(/^["']|["']$/g, '').trim();
      let total = 0;

      critRange.forEach((c, idx) => {
        const critVal = getComputedCellValue(c, grid, new Set(visited));
        if (String(critVal).toLowerCase() === criteria.toLowerCase()) {
          const sumCell = sumRange[idx] || sumRange[sumRange.length - 1];
          const sumVal = Number(getComputedCellValue(sumCell, grid, new Set(visited)));
          if (!isNaN(sumVal)) {
            total += sumVal;
          }
        }
      });

      return { result: Math.round(total * 100) / 100 };
    }

    // 4. Fungsi VLOOKUP: =VLOOKUP(lookup_value, table_range, col_index, [exact_match])
    if (funcName === 'VLOOKUP') {
      if (args.length < 3) {
        return { error: '#ERROR! Format VLOOKUP: =VLOOKUP(nilai_kunci, tabel_rentang, nomor_kolom)' };
      }
      const lookupValRaw = args[0].replace(/^["']|["']$/g, '');
      const lookupVal =
        lookupValRaw.match(/^[A-E]\d+$/i)
          ? String(getComputedCellValue(lookupValRaw, grid, new Set(visited)))
          : lookupValRaw;

      const tableRangeParts = args[1].toUpperCase().split(':');
      if (tableRangeParts.length !== 2) return { error: '#ERROR! Rentang tabel VLOOKUP salah' };

      const startCol = COLS.indexOf(tableRangeParts[0][0]);
      const startRow = parseInt(tableRangeParts[0].slice(1), 10);
      const endCol = COLS.indexOf(tableRangeParts[1][0]);
      const endRow = parseInt(tableRangeParts[1].slice(1), 10);
      const colIdx = parseInt(args[2], 10);

      if (startCol === -1 || endCol === -1 || isNaN(colIdx) || colIdx < 1) {
        return { error: '#REF! Kolom VLOOKUP di luar batas tabel' };
      }

      const targetColIdx = startCol + colIdx - 1;
      if (targetColIdx > endCol) {
        return { error: '#REF! Kolom target melebihi rentang tabel' };
      }

      for (let r = startRow; r <= endRow; r++) {
        const keyCell = `${COLS[startCol]}${r}`;
        const keyVal = String(getComputedCellValue(keyCell, grid, new Set(visited))).toLowerCase();
        if (keyVal === lookupVal.toLowerCase()) {
          const targetCell = `${COLS[targetColIdx]}${r}`;
          const finalVal = getComputedCellValue(targetCell, grid, new Set(visited));
          return { result: finalVal };
        }
      }

      return { error: '#N/A! (Nilai tidak ditemukan)' };
    }

    // 5. Fungsi Teks: CONCAT, UPPER, LOWER, LEFT, RIGHT
    if (funcName === 'CONCAT' || funcName === 'CONCATENATE') {
      const combined = args
        .map((a) => {
          const clean = a.replace(/^["']|["']$/g, '');
          if (/^[A-E]\d+$/i.test(a)) {
            return String(getComputedCellValue(a, grid, new Set(visited)));
          }
          return clean;
        })
        .join('');
      return { result: combined };
    }

    if (funcName === 'UPPER') {
      const target = args[0] ? args[0].replace(/^["']|["']$/g, '') : '';
      const val = /^[A-E]\d+$/i.test(target)
        ? String(getComputedCellValue(target, grid, new Set(visited)))
        : target;
      return { result: val.toUpperCase() };
    }

    if (funcName === 'LOWER') {
      const target = args[0] ? args[0].replace(/^["']|["']$/g, '') : '';
      const val = /^[A-E]\d+$/i.test(target)
        ? String(getComputedCellValue(target, grid, new Set(visited)))
        : target;
      return { result: val.toLowerCase() };
    }

    if (funcName === 'LEFT') {
      const target = args[0] ? args[0].replace(/^["']|["']$/g, '') : '';
      const num = args[1] ? parseInt(args[1], 10) : 1;
      const val = /^[A-E]\d+$/i.test(target)
        ? String(getComputedCellValue(target, grid, new Set(visited)))
        : target;
      return { result: val.slice(0, num) };
    }

    if (funcName === 'RIGHT') {
      const target = args[0] ? args[0].replace(/^["']|["']$/g, '') : '';
      const num = args[1] ? parseInt(args[1], 10) : 1;
      const val = /^[A-E]\d+$/i.test(target)
        ? String(getComputedCellValue(target, grid, new Set(visited)))
        : target;
      return { result: val.slice(-num) };
    }

    // 6. Fungsi Statistik Rentang: SUM, AVERAGE, MIN, MAX, COUNT, COUNTA
    if (['SUM', 'AVERAGE', 'MIN', 'MAX', 'COUNT', 'COUNTA'].includes(funcName)) {
      let cellList: string[] = [];
      args.forEach((seg) => {
        if (seg.includes(':')) {
          cellList = cellList.concat(expandRange(seg));
        } else if (seg.trim()) {
          cellList.push(seg.trim().replace(/\$/g, '').toUpperCase());
        }
      });

      if (cellList.length === 0) {
        return { error: `#ERROR! Masukkan rentang sel untuk ${funcName}, misal B2:B6` };
      }

      const rawValues = cellList.map((c) => getComputedCellValue(c, grid, new Set(visited)));
      const numericValues = rawValues
        .filter((v) => v !== '' && v !== null && !isNaN(Number(v)))
        .map((v) => Number(v));

      if (funcName === 'COUNTA') {
        const nonEmpty = rawValues.filter((v) => String(v).trim() !== '').length;
        return { result: nonEmpty };
      }
      if (funcName === 'COUNT') {
        return { result: numericValues.length };
      }
      if (numericValues.length === 0) {
        return { result: 0 };
      }
      if (funcName === 'SUM') {
        const total = numericValues.reduce((acc, curr) => acc + curr, 0);
        return { result: Math.round(total * 100) / 100 };
      }
      if (funcName === 'AVERAGE') {
        const total = numericValues.reduce((acc, curr) => acc + curr, 0);
        return { result: Math.round((total / numericValues.length) * 100) / 100 };
      }
      if (funcName === 'MAX') {
        return { result: Math.max(...numericValues) };
      }
      if (funcName === 'MIN') {
        return { result: Math.min(...numericValues) };
      }
    }

    return { error: `#NAME? Fungsi '${funcName}' belum dikenali` };
  }

  // Jika bukan fungsi bertanda kurung, evaluasi sebagai operasi aritmetika (+, -, *, /)
  return evaluateSimpleArithmetic(body, grid, visited);
};

// Format tampilan angka ke Rupiah atau Persentase
export const formatDisplayValue = (val: any, style: CellStyle = {}): string => {
  if (val === undefined || val === null || val === '') return '';
  if (String(val).startsWith('#')) return String(val); // Error message
  if (style.format === 'currency' && !isNaN(Number(val)) && String(val).trim() !== '') {
    return 'Rp ' + Number(val).toLocaleString('id-ID');
  }
  if (style.format === 'percent' && !isNaN(Number(val)) && String(val).trim() !== '') {
    return `${Number(val)}%`;
  }
  return String(val);
};
