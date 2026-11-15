import { LevelInfo } from '../types';

export const EXCEL_LEVELS: LevelInfo[] = [
  {
    level: 1,
    name: 'EXCEL BEGINNER',
    theme: 'Pengenalan Microsoft Excel',
    color: 'from-emerald-500 to-green-600',
    medalName: 'Bronze Medal',
    medalIcon: '🥉',
    description: 'Pahami fungsi utama, jenis data, perbedaan workbook vs worksheet, dan kegunaan Excel.',
    totalQuestions: 10
  },
  {
    level: 2,
    name: 'EXCEL EXPLORER',
    theme: 'Bagian-bagian dan Fungsi Antarmuka',
    color: 'from-blue-500 to-cyan-600',
    medalName: 'Silver Medal',
    medalIcon: '🥈',
    description: 'Kuasai Ribbon, Formula Bar, Name Box, Row, Column, Cell, Range, dan Status Bar.',
    totalQuestions: 10
  },
  {
    level: 3,
    name: 'FORMULA MASTER',
    theme: 'Rumus Dasar Pengolahan Data',
    color: 'from-amber-500 to-yellow-600',
    medalName: 'Gold Medal',
    medalIcon: '🥇',
    description: 'Taklukkan rumus matematika dasar, SUM, AVERAGE, MAX, MIN, COUNT, dan aturan tanda =.',
    totalQuestions: 10
  },
  {
    level: 4,
    name: 'LOGIC & TEXT EXPERT',
    theme: 'Fungsi Logika dan Pengolahan Teks',
    color: 'from-purple-500 to-indigo-600',
    medalName: 'Platinum Medal',
    medalIcon: '💠',
    description: 'Gunakan fungsi cerdas IF, AND, OR, serta manipulasi string LEFT, RIGHT, MID, LEN, dan CONCAT.',
    totalQuestions: 10
  },
  {
    level: 5,
    name: 'DATA ANALYST',
    theme: 'Perhitungan dan Analisis Data Nyata',
    color: 'from-rose-500 to-pink-600',
    medalName: 'Diamond Medal',
    medalIcon: '💎',
    description: 'Analisis tabel penjualan, persentase, pola data, dan studi kasus bisnis profesional.',
    totalQuestions: 10
  }
];
