export type FestivalType =
  | 'NATIONAL_HOLIDAY'
  | 'FESTIVAL'
  | 'GAZETTED_HOLIDAY'
  | 'RESTRICTED_HOLIDAY';

export interface Festival {
  id: string;
  name: string;
  date: string; // YYYY-MM-DD
  year: number;
  description: string;
  type: FestivalType;
  isHoliday: boolean; // company holiday / office closed
  icon: string;
}

/**
 * Curated list of Indian festivals and major national/company holidays.
 * Supports distinct dates by year for lunar-based festivals (Diwali, Holi, Eid, Dussehra, etc.).
 */
export const INDIAN_FESTIVALS: Festival[] = [
  // ── 2024 ───────────────────────────────────────────
  {
    id: 'fest-2024-republic-day',
    name: 'Republic Day',
    date: '2024-01-26',
    year: 2024,
    description: 'National holiday commemorating the adoption of the Constitution of India in 1950.',
    type: 'NATIONAL_HOLIDAY',
    isHoliday: true,
    icon: '🇮🇳'
  },
  {
    id: 'fest-2024-maha-shivratri',
    name: 'Maha Shivratri',
    date: '2024-03-08',
    year: 2024,
    description: 'Hindu festival celebrating the great night of Lord Shiva.',
    type: 'GAZETTED_HOLIDAY',
    isHoliday: true,
    icon: '🔱'
  },
  {
    id: 'fest-2024-holi',
    name: 'Holi',
    date: '2024-03-25',
    year: 2024,
    description: 'Festival of colors celebrating spring, joy, and the victory of good over evil.',
    type: 'FESTIVAL',
    isHoliday: true,
    icon: '🎨'
  },
  {
    id: 'fest-2024-good-friday',
    name: 'Good Friday',
    date: '2024-03-29',
    year: 2024,
    description: 'Christian commemoration of the crucifixion of Jesus Christ.',
    type: 'GAZETTED_HOLIDAY',
    isHoliday: true,
    icon: '✝️'
  },
  {
    id: 'fest-2024-eid-ul-fitr',
    name: 'Eid ul-Fitr',
    date: '2024-04-11',
    year: 2024,
    description: 'Islamic festival marking the end of the holy month of Ramadan.',
    type: 'FESTIVAL',
    isHoliday: true,
    icon: '🌙'
  },
  {
    id: 'fest-2024-eid-al-adha',
    name: 'Eid al-Adha',
    date: '2024-06-17',
    year: 2024,
    description: 'Feast of the Sacrifice commemorating the devotion of Ibrahim.',
    type: 'FESTIVAL',
    isHoliday: true,
    icon: '🌙'
  },
  {
    id: 'fest-2024-independence-day',
    name: 'Independence Day',
    date: '2024-08-15',
    year: 2024,
    description: 'National holiday celebrating India’s independence from British rule in 1947.',
    type: 'NATIONAL_HOLIDAY',
    isHoliday: true,
    icon: '🇮🇳'
  },
  {
    id: 'fest-2024-raksha-bandhan',
    name: 'Raksha Bandhan',
    date: '2024-08-19',
    year: 2024,
    description: 'Celebration of the sacred bond between brothers and sisters.',
    type: 'FESTIVAL',
    isHoliday: false,
    icon: '🪷'
  },
  {
    id: 'fest-2024-janmashtami',
    name: 'Janmashtami',
    date: '2024-08-26',
    year: 2024,
    description: 'Celebration of the birth of Lord Krishna.',
    type: 'GAZETTED_HOLIDAY',
    isHoliday: true,
    icon: '🦚'
  },
  {
    id: 'fest-2024-ganesh-chaturthi',
    name: 'Ganesh Chaturthi',
    date: '2024-09-07',
    year: 2024,
    description: 'Festival honoring the birth of Lord Ganesha, the remover of obstacles.',
    type: 'FESTIVAL',
    isHoliday: true,
    icon: '🐘'
  },
  {
    id: 'fest-2024-gandhi-jayanti',
    name: 'Gandhi Jayanti',
    date: '2024-10-02',
    year: 2024,
    description: 'National holiday honoring Mahatma Gandhi’s birth anniversary and philosophy of peace.',
    type: 'NATIONAL_HOLIDAY',
    isHoliday: true,
    icon: '🇮🇳'
  },
  {
    id: 'fest-2024-dussehra',
    name: 'Dussehra',
    date: '2024-10-12',
    year: 2024,
    description: 'Vijayadashami celebrating the victory of Lord Rama over Ravana and Durga over Mahishasura.',
    type: 'FESTIVAL',
    isHoliday: true,
    icon: '🎉'
  },
  {
    id: 'fest-2024-diwali',
    name: 'Diwali',
    date: '2024-11-01',
    year: 2024,
    description: 'Festival of lights celebrating prosperity, wisdom, and new beginnings.',
    type: 'FESTIVAL',
    isHoliday: true,
    icon: '🪔'
  },
  {
    id: 'fest-2024-guru-nanak-jayanti',
    name: 'Guru Nanak Jayanti',
    date: '2024-11-15',
    year: 2024,
    description: 'Celebration of the birth anniversary of Guru Nanak Dev Ji, founder of Sikhism.',
    type: 'GAZETTED_HOLIDAY',
    isHoliday: true,
    icon: '🪯'
  },
  {
    id: 'fest-2024-christmas',
    name: 'Christmas',
    date: '2024-12-25',
    year: 2024,
    description: 'Celebration of the birth of Jesus Christ, marked with joyful company festivities.',
    type: 'FESTIVAL',
    isHoliday: true,
    icon: '🎄'
  },

  // ── 2025 ───────────────────────────────────────────
  {
    id: 'fest-2025-republic-day',
    name: 'Republic Day',
    date: '2025-01-26',
    year: 2025,
    description: 'National holiday commemorating the adoption of the Constitution of India in 1950.',
    type: 'NATIONAL_HOLIDAY',
    isHoliday: true,
    icon: '🇮🇳'
  },
  {
    id: 'fest-2025-maha-shivratri',
    name: 'Maha Shivratri',
    date: '2025-02-26',
    year: 2025,
    description: 'Hindu festival celebrating the great night of Lord Shiva.',
    type: 'GAZETTED_HOLIDAY',
    isHoliday: true,
    icon: '🔱'
  },
  {
    id: 'fest-2025-holi',
    name: 'Holi',
    date: '2025-03-14',
    year: 2025,
    description: 'Festival of colors celebrating spring, joy, and the victory of good over evil.',
    type: 'FESTIVAL',
    isHoliday: true,
    icon: '🎨'
  },
  {
    id: 'fest-2025-eid-ul-fitr',
    name: 'Eid ul-Fitr',
    date: '2025-03-31',
    year: 2025,
    description: 'Islamic festival marking the end of the holy month of Ramadan.',
    type: 'FESTIVAL',
    isHoliday: true,
    icon: '🌙'
  },
  {
    id: 'fest-2025-good-friday',
    name: 'Good Friday',
    date: '2025-04-18',
    year: 2025,
    description: 'Christian commemoration of the crucifixion of Jesus Christ.',
    type: 'GAZETTED_HOLIDAY',
    isHoliday: true,
    icon: '✝️'
  },
  {
    id: 'fest-2025-eid-al-adha',
    name: 'Eid al-Adha',
    date: '2025-06-07',
    year: 2025,
    description: 'Feast of the Sacrifice commemorating the devotion of Ibrahim.',
    type: 'FESTIVAL',
    isHoliday: true,
    icon: '🌙'
  },
  {
    id: 'fest-2025-independence-day',
    name: 'Independence Day',
    date: '2025-08-15',
    year: 2025,
    description: 'National holiday celebrating India’s independence from British rule in 1947.',
    type: 'NATIONAL_HOLIDAY',
    isHoliday: true,
    icon: '🇮🇳'
  },
  {
    id: 'fest-2025-raksha-bandhan',
    name: 'Raksha Bandhan',
    date: '2025-08-09',
    year: 2025,
    description: 'Celebration of the sacred bond between brothers and sisters.',
    type: 'FESTIVAL',
    isHoliday: false,
    icon: '🪷'
  },
  {
    id: 'fest-2025-janmashtami',
    name: 'Janmashtami',
    date: '2025-08-16',
    year: 2025,
    description: 'Celebration of the birth of Lord Krishna.',
    type: 'GAZETTED_HOLIDAY',
    isHoliday: true,
    icon: '🦚'
  },
  {
    id: 'fest-2025-ganesh-chaturthi',
    name: 'Ganesh Chaturthi',
    date: '2025-08-27',
    year: 2025,
    description: 'Festival honoring the birth of Lord Ganesha, the remover of obstacles.',
    type: 'FESTIVAL',
    isHoliday: true,
    icon: '🐘'
  },
  {
    id: 'fest-2025-gandhi-jayanti',
    name: 'Gandhi Jayanti',
    date: '2025-10-02',
    year: 2025,
    description: 'National holiday honoring Mahatma Gandhi’s birth anniversary and philosophy of peace.',
    type: 'NATIONAL_HOLIDAY',
    isHoliday: true,
    icon: '🇮🇳'
  },
  {
    id: 'fest-2025-dussehra',
    name: 'Dussehra',
    date: '2025-10-02',
    year: 2025,
    description: 'Vijayadashami celebrating the victory of Lord Rama over Ravana and Durga over Mahishasura.',
    type: 'FESTIVAL',
    isHoliday: true,
    icon: '🎉'
  },
  {
    id: 'fest-2025-diwali',
    name: 'Diwali',
    date: '2025-10-20',
    year: 2025,
    description: 'Festival of lights celebrating prosperity, wisdom, and new beginnings.',
    type: 'FESTIVAL',
    isHoliday: true,
    icon: '🪔'
  },
  {
    id: 'fest-2025-guru-nanak-jayanti',
    name: 'Guru Nanak Jayanti',
    date: '2025-11-05',
    year: 2025,
    description: 'Celebration of the birth anniversary of Guru Nanak Dev Ji, founder of Sikhism.',
    type: 'GAZETTED_HOLIDAY',
    isHoliday: true,
    icon: '🪯'
  },
  {
    id: 'fest-2025-christmas',
    name: 'Christmas',
    date: '2025-12-25',
    year: 2025,
    description: 'Celebration of the birth of Jesus Christ, marked with joyful company festivities.',
    type: 'FESTIVAL',
    isHoliday: true,
    icon: '🎄'
  },

  // ── 2026 ───────────────────────────────────────────
  {
    id: 'fest-2026-republic-day',
    name: 'Republic Day',
    date: '2026-01-26',
    year: 2026,
    description: 'National holiday commemorating the adoption of the Constitution of India in 1950.',
    type: 'NATIONAL_HOLIDAY',
    isHoliday: true,
    icon: '🇮🇳'
  },
  {
    id: 'fest-2026-maha-shivratri',
    name: 'Maha Shivratri',
    date: '2026-02-15',
    year: 2026,
    description: 'Hindu festival celebrating the great night of Lord Shiva.',
    type: 'GAZETTED_HOLIDAY',
    isHoliday: true,
    icon: '🔱'
  },
  {
    id: 'fest-2026-holi',
    name: 'Holi',
    date: '2026-03-04',
    year: 2026,
    description: 'Festival of colors celebrating spring, joy, and the victory of good over evil.',
    type: 'FESTIVAL',
    isHoliday: true,
    icon: '🎨'
  },
  {
    id: 'fest-2026-eid-ul-fitr',
    name: 'Eid ul-Fitr',
    date: '2026-03-20',
    year: 2026,
    description: 'Islamic festival marking the end of the holy month of Ramadan.',
    type: 'FESTIVAL',
    isHoliday: true,
    icon: '🌙'
  },
  {
    id: 'fest-2026-good-friday',
    name: 'Good Friday',
    date: '2026-04-03',
    year: 2026,
    description: 'Christian commemoration of the crucifixion of Jesus Christ.',
    type: 'GAZETTED_HOLIDAY',
    isHoliday: true,
    icon: '✝️'
  },
  {
    id: 'fest-2026-eid-al-adha',
    name: 'Eid al-Adha',
    date: '2026-05-27',
    year: 2026,
    description: 'Feast of the Sacrifice commemorating the devotion of Ibrahim.',
    type: 'FESTIVAL',
    isHoliday: true,
    icon: '🌙'
  },
  {
    id: 'fest-2026-independence-day',
    name: 'Independence Day',
    date: '2026-08-15',
    year: 2026,
    description: 'National holiday celebrating India’s independence from British rule in 1947.',
    type: 'NATIONAL_HOLIDAY',
    isHoliday: true,
    icon: '🇮🇳'
  },
  {
    id: 'fest-2026-raksha-bandhan',
    name: 'Raksha Bandhan',
    date: '2026-08-28',
    year: 2026,
    description: 'Celebration of the sacred bond between brothers and sisters.',
    type: 'FESTIVAL',
    isHoliday: false,
    icon: '🪷'
  },
  {
    id: 'fest-2026-janmashtami',
    name: 'Janmashtami',
    date: '2026-09-04',
    year: 2026,
    description: 'Celebration of the birth of Lord Krishna.',
    type: 'GAZETTED_HOLIDAY',
    isHoliday: true,
    icon: '🦚'
  },
  {
    id: 'fest-2026-ganesh-chaturthi',
    name: 'Ganesh Chaturthi',
    date: '2026-09-14',
    year: 2026,
    description: 'Festival honoring the birth of Lord Ganesha, the remover of obstacles.',
    type: 'FESTIVAL',
    isHoliday: true,
    icon: '🐘'
  },
  {
    id: 'fest-2026-gandhi-jayanti',
    name: 'Gandhi Jayanti',
    date: '2026-10-02',
    year: 2026,
    description: 'National holiday honoring Mahatma Gandhi’s birth anniversary and philosophy of peace.',
    type: 'NATIONAL_HOLIDAY',
    isHoliday: true,
    icon: '🇮🇳'
  },
  {
    id: 'fest-2026-dussehra',
    name: 'Dussehra',
    date: '2026-10-20',
    year: 2026,
    description: 'Vijayadashami celebrating the victory of Lord Rama over Ravana and Durga over Mahishasura.',
    type: 'FESTIVAL',
    isHoliday: true,
    icon: '🎉'
  },
  {
    id: 'fest-2026-diwali',
    name: 'Diwali',
    date: '2026-11-08',
    year: 2026,
    description: 'Festival of lights celebrating prosperity, wisdom, and new beginnings.',
    type: 'FESTIVAL',
    isHoliday: true,
    icon: '🪔'
  },
  {
    id: 'fest-2026-guru-nanak-jayanti',
    name: 'Guru Nanak Jayanti',
    date: '2026-11-24',
    year: 2026,
    description: 'Celebration of the birth anniversary of Guru Nanak Dev Ji, founder of Sikhism.',
    type: 'GAZETTED_HOLIDAY',
    isHoliday: true,
    icon: '🪯'
  },
  {
    id: 'fest-2026-christmas',
    name: 'Christmas',
    date: '2026-12-25',
    year: 2026,
    description: 'Celebration of the birth of Jesus Christ, marked with joyful company festivities.',
    type: 'FESTIVAL',
    isHoliday: true,
    icon: '🎄'
  },

  // ── 2027 ───────────────────────────────────────────
  {
    id: 'fest-2027-republic-day',
    name: 'Republic Day',
    date: '2027-01-26',
    year: 2027,
    description: 'National holiday commemorating the adoption of the Constitution of India in 1950.',
    type: 'NATIONAL_HOLIDAY',
    isHoliday: true,
    icon: '🇮🇳'
  },
  {
    id: 'fest-2027-maha-shivratri',
    name: 'Maha Shivratri',
    date: '2027-03-06',
    year: 2027,
    description: 'Hindu festival celebrating the great night of Lord Shiva.',
    type: 'GAZETTED_HOLIDAY',
    isHoliday: true,
    icon: '🔱'
  },
  {
    id: 'fest-2027-eid-ul-fitr',
    name: 'Eid ul-Fitr',
    date: '2027-03-10',
    year: 2027,
    description: 'Islamic festival marking the end of the holy month of Ramadan.',
    type: 'FESTIVAL',
    isHoliday: true,
    icon: '🌙'
  },
  {
    id: 'fest-2027-holi',
    name: 'Holi',
    date: '2027-03-22',
    year: 2027,
    description: 'Festival of colors celebrating spring, joy, and the victory of good over evil.',
    type: 'FESTIVAL',
    isHoliday: true,
    icon: '🎨'
  },
  {
    id: 'fest-2027-good-friday',
    name: 'Good Friday',
    date: '2027-03-26',
    year: 2027,
    description: 'Christian commemoration of the crucifixion of Jesus Christ.',
    type: 'GAZETTED_HOLIDAY',
    isHoliday: true,
    icon: '✝️'
  },
  {
    id: 'fest-2027-eid-al-adha',
    name: 'Eid al-Adha',
    date: '2027-05-17',
    year: 2027,
    description: 'Feast of the Sacrifice commemorating the devotion of Ibrahim.',
    type: 'FESTIVAL',
    isHoliday: true,
    icon: '🌙'
  },
  {
    id: 'fest-2027-independence-day',
    name: 'Independence Day',
    date: '2027-08-15',
    year: 2027,
    description: 'National holiday celebrating India’s independence from British rule in 1947.',
    type: 'NATIONAL_HOLIDAY',
    isHoliday: true,
    icon: '🇮🇳'
  },
  {
    id: 'fest-2027-raksha-bandhan',
    name: 'Raksha Bandhan',
    date: '2027-08-17',
    year: 2027,
    description: 'Celebration of the sacred bond between brothers and sisters.',
    type: 'FESTIVAL',
    isHoliday: false,
    icon: '🪷'
  },
  {
    id: 'fest-2027-janmashtami',
    name: 'Janmashtami',
    date: '2027-08-25',
    year: 2027,
    description: 'Celebration of the birth of Lord Krishna.',
    type: 'GAZETTED_HOLIDAY',
    isHoliday: true,
    icon: '🦚'
  },
  {
    id: 'fest-2027-ganesh-chaturthi',
    name: 'Ganesh Chaturthi',
    date: '2027-09-04',
    year: 2027,
    description: 'Festival honoring the birth of Lord Ganesha, the remover of obstacles.',
    type: 'FESTIVAL',
    isHoliday: true,
    icon: '🐘'
  },
  {
    id: 'fest-2027-gandhi-jayanti',
    name: 'Gandhi Jayanti',
    date: '2027-10-02',
    year: 2027,
    description: 'National holiday honoring Mahatma Gandhi’s birth anniversary and philosophy of peace.',
    type: 'NATIONAL_HOLIDAY',
    isHoliday: true,
    icon: '🇮🇳'
  },
  {
    id: 'fest-2027-dussehra',
    name: 'Dussehra',
    date: '2027-10-10',
    year: 2027,
    description: 'Vijayadashami celebrating the victory of Lord Rama over Ravana and Durga over Mahishasura.',
    type: 'FESTIVAL',
    isHoliday: true,
    icon: '🎉'
  },
  {
    id: 'fest-2027-diwali',
    name: 'Diwali',
    date: '2027-10-29',
    year: 2027,
    description: 'Festival of lights celebrating prosperity, wisdom, and new beginnings.',
    type: 'FESTIVAL',
    isHoliday: true,
    icon: '🪔'
  },
  {
    id: 'fest-2027-guru-nanak-jayanti',
    name: 'Guru Nanak Jayanti',
    date: '2027-11-14',
    year: 2027,
    description: 'Celebration of the birth anniversary of Guru Nanak Dev Ji, founder of Sikhism.',
    type: 'GAZETTED_HOLIDAY',
    isHoliday: true,
    icon: '🪯'
  },
  {
    id: 'fest-2027-christmas',
    name: 'Christmas',
    date: '2027-12-25',
    year: 2027,
    description: 'Celebration of the birth of Jesus Christ, marked with joyful company festivities.',
    type: 'FESTIVAL',
    isHoliday: true,
    icon: '🎄'
  }
];

/**
 * Returns festivals falling within a specific date window
 */
export function getFestivalsForDateRange(start: Date, end: Date): Festival[] {
  const startTime = new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime();
  const endTime = new Date(end.getFullYear(), end.getMonth(), end.getDate(), 23, 59, 59, 999).getTime();

  return INDIAN_FESTIVALS.filter(f => {
    const [y, m, d] = f.date.split('-').map(Number);
    const fTime = new Date(y, m - 1, d).getTime();
    return fTime >= startTime && fTime <= endTime;
  });
}

/**
 * Returns festivals occurring on a single date
 */
export function getFestivalsOnDate(targetDate: Date): Festival[] {
  const targetStr = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}-${String(targetDate.getDate()).padStart(2, '0')}`;
  return INDIAN_FESTIVALS.filter(f => f.date === targetStr);
}

/**
 * Returns all festivals for a specific year
 */
export function getFestivalsByYear(year: number): Festival[] {
  return INDIAN_FESTIVALS.filter(f => f.year === year);
}
