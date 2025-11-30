export interface DayBounds {
  start: Date;
  end: Date;
}

export interface ProteinEntry {
  id: number;
  proteinGrams: number;
  description: string;
  timestamp: string;
  createdAt: string;
}

export interface DailyConsumption {
  date: string;
  entries: ProteinEntry[];
  total: number;
}

export interface DeleteResult {
  success: boolean;
  error?: string;
  deletedEntry?: {
    id: number;
    proteinGrams: number;
    description: string;
    date: string;
  };
  newDailyTotal?: number;
}

