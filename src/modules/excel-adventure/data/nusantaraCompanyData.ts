import { GridData } from '../types';

export interface CompanySalesRow {
  rowNum: number;
  kodeTransaksi: string;
  wilayah: string;
  kategori: string;
  targetUnit: number;
  realisasiUnit: number;
  totalOmzet: number;
  predikat?: string;
}

export const NUSANTARA_COMPANY_DATA: CompanySalesRow[] = [
  {
    rowNum: 2,
    kodeTransaksi: 'ELK-2026-BPP-01',
    wilayah: 'Kalimantan',
    kategori: 'Elektronik',
    targetUnit: 100,
    realisasiUnit: 125,
    totalOmzet: 185000000,
    predikat: 'Sangat Baik'
  },
  {
    rowNum: 3,
    kodeTransaksi: 'FRN-2026-SRG-02',
    wilayah: 'Jawa',
    kategori: 'Furnitur',
    targetUnit: 80,
    realisasiUnit: 75,
    totalOmzet: 92000000,
    predikat: 'Perlu Evaluasi'
  },
  {
    rowNum: 4,
    kodeTransaksi: 'ELK-2026-SMD-03',
    wilayah: 'Kalimantan',
    kategori: 'Elektronik',
    targetUnit: 100,
    realisasiUnit: 110,
    totalOmzet: 160000000,
    predikat: 'Sangat Baik'
  },
  {
    rowNum: 5,
    kodeTransaksi: 'ATK-2026-MKS-04',
    wilayah: 'Sulawesi',
    kategori: 'Alat Kantor',
    targetUnit: 150,
    realisasiUnit: 160,
    totalOmzet: 88000000,
    predikat: 'Baik'
  },
  {
    rowNum: 6,
    kodeTransaksi: 'ELK-2026-BJM-05',
    wilayah: 'Kalimantan',
    kategori: 'Elektronik',
    targetUnit: 100,
    realisasiUnit: 90,
    totalOmzet: 130000000,
    predikat: 'Perlu Evaluasi'
  },
  {
    rowNum: 7,
    kodeTransaksi: 'FRN-2026-JKT-06',
    wilayah: 'Jawa',
    kategori: 'Furnitur',
    targetUnit: 120,
    realisasiUnit: 380,
    totalOmzet: 980000000,
    predikat: 'Sangat Baik'
  }
];

export function formatRupiah(val: number): string {
  return 'Rp ' + Number(val).toLocaleString('id-ID');
}

/**
 * GridData representation for the interactive spreadsheet table
 * Columns:
 * A: Kode Transaksi
 * B: Wilayah
 * C: Kategori
 * D: Target Unit
 * E: Realisasi Unit
 * F: Total Omzet (Rp)
 * G: Predikat
 */
export const NUSANTARA_INITIAL_GRID: GridData = {
  // Headers (Row 1)
  A1: { value: 'Kode Transaksi', style: { bold: true, bg: '#064e3b', align: 'center' } },
  B1: { value: 'Wilayah', style: { bold: true, bg: '#064e3b', align: 'center' } },
  C1: { value: 'Kategori', style: { bold: true, bg: '#064e3b', align: 'center' } },
  D1: { value: 'Target Unit', style: { bold: true, bg: '#064e3b', align: 'center' } },
  E1: { value: 'Realisasi Unit', style: { bold: true, bg: '#064e3b', align: 'center' } },
  F1: { value: 'Total Omzet (Rp)', style: { bold: true, bg: '#064e3b', align: 'center' } },
  G1: { value: 'Predikat', style: { bold: true, bg: '#064e3b', align: 'center' } },

  // Row 2
  A2: { value: 'ELK-2026-BPP-01', style: { align: 'center' } },
  B2: { value: 'Kalimantan', style: { align: 'left' } },
  C2: { value: 'Elektronik', style: { align: 'left' } },
  D2: { value: 100, style: { align: 'right' } },
  E2: { value: 125, style: { align: 'right' } },
  F2: { value: 185000000, style: { align: 'right', format: 'currency' } },
  G2: { value: '', style: { align: 'center' } },

  // Row 3
  A3: { value: 'FRN-2026-SRG-02', style: { align: 'center' } },
  B3: { value: 'Jawa', style: { align: 'left' } },
  C3: { value: 'Furnitur', style: { align: 'left' } },
  D3: { value: 80, style: { align: 'right' } },
  E3: { value: 75, style: { align: 'right' } },
  F3: { value: 92000000, style: { align: 'right', format: 'currency' } },
  G3: { value: '', style: { align: 'center' } },

  // Row 4
  A4: { value: 'ELK-2026-SMD-03', style: { align: 'center' } },
  B4: { value: 'Kalimantan', style: { align: 'left' } },
  C4: { value: 'Elektronik', style: { align: 'left' } },
  D4: { value: 100, style: { align: 'right' } },
  E4: { value: 110, style: { align: 'right' } },
  F4: { value: 160000000, style: { align: 'right', format: 'currency' } },
  G4: { value: '', style: { align: 'center' } },

  // Row 5
  A5: { value: 'ATK-2026-MKS-04', style: { align: 'center' } },
  B5: { value: 'Sulawesi', style: { align: 'left' } },
  C5: { value: 'Alat Kantor', style: { align: 'left' } },
  D5: { value: 150, style: { align: 'right' } },
  E5: { value: 160, style: { align: 'right' } },
  F5: { value: 88000000, style: { align: 'right', format: 'currency' } },
  G5: { value: '', style: { align: 'center' } },

  // Row 6
  A6: { value: 'ELK-2026-BJM-05', style: { align: 'center' } },
  B6: { value: 'Kalimantan', style: { align: 'left' } },
  C6: { value: 'Elektronik', style: { align: 'left' } },
  D6: { value: 100, style: { align: 'right' } },
  E6: { value: 90, style: { align: 'right' } },
  F6: { value: 130000000, style: { align: 'right', format: 'currency' } },
  G6: { value: '', style: { align: 'center' } },

  // Row 7
  A7: { value: 'FRN-2026-JKT-06', style: { align: 'center' } },
  B7: { value: 'Jawa', style: { align: 'left' } },
  C7: { value: 'Furnitur', style: { align: 'left' } },
  D7: { value: 120, style: { align: 'right' } },
  E7: { value: 380, style: { align: 'right' } },
  F7: { value: 980000000, style: { align: 'right', format: 'currency' } },
  G7: { value: '', style: { align: 'center' } }
};

