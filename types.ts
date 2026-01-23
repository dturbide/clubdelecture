
export enum Sentiment {
  ENTHUSIASTIC = 'Enthousiaste',
  MIXED = 'Mitigé',
  DISAPPOINTED = 'Déçu',
  UNKNOWN = 'Inconnu'
}

export interface AIAnalysis {
  summary: string;
  sentiment: Sentiment;
  tags: string[];
  recommendations: string[];
}

export interface Review {
  id: string;
  bookId: string;
  member: string;
  rating: number;
  content: string;
  date: string;
  aiAnalysis?: AIAnalysis;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  genre: string;
  coverUrl: string;
  summary: string;
  recommendations: string;
  personalRating: number;
  addedBy: string;
  createdAt: string;
}

export interface AppState {
  books: Book[];
  reviews: Review[];
  genres: string[];
  members: string[];
  scriptUrl: string | null;
  isLoading: boolean;
}
