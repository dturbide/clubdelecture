
import { Book, Review } from "../types";

const BOOKS_KEY = "bookclub_books";
const REVIEWS_KEY = "bookclub_reviews";
const CONFIG_KEY = "bookclub_config";
const GENRES_KEY = "bookclub_genres";
const MEMBERS_KEY = "bookclub_members";

export const getLocalBooks = (): Book[] => {
  const data = localStorage.getItem(BOOKS_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveLocalBooks = (books: Book[]) => {
  localStorage.setItem(BOOKS_KEY, JSON.stringify(books));
};

export const getLocalReviews = (): Review[] => {
  const data = localStorage.getItem(REVIEWS_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveLocalReviews = (reviews: Review[]) => {
  localStorage.setItem(REVIEWS_KEY, JSON.stringify(reviews));
};

export const getLocalGenres = (): string[] => {
  const data = localStorage.getItem(GENRES_KEY);
  return data ? JSON.parse(data) : ['Roman', 'Dystopie', 'Fantasy', 'Policier', 'Biographie', 'Philosophie', 'Histoire', 'Essai'];
};

export const saveLocalGenres = (genres: string[]) => {
  localStorage.setItem(GENRES_KEY, JSON.stringify(genres));
};

export const getLocalMembers = (): string[] => {
  const data = localStorage.getItem(MEMBERS_KEY);
  return data ? JSON.parse(data) : ['Admin', 'Visiteur'];
};

export const saveLocalMembers = (members: string[]) => {
  localStorage.setItem(MEMBERS_KEY, JSON.stringify(members));
};

export const getConfig = (): string | null => {
  return localStorage.getItem(CONFIG_KEY);
};

export const saveConfig = (url: string) => {
  localStorage.setItem(CONFIG_KEY, url);
};

/**
 * Récupère l'intégralité des données pour l'exportation
 */
export const getAllData = () => {
  return {
    books: getLocalBooks(),
    reviews: getLocalReviews(),
    genres: getLocalGenres(),
    members: getLocalMembers(),
    exportDate: new Date().toISOString()
  };
};

/**
 * Sauvegarde massive de données importées
 */
export const saveAllData = (data: { books: Book[], reviews: Review[], genres: string[], members: string[] }) => {
  saveLocalBooks(data.books || []);
  saveLocalReviews(data.reviews || []);
  saveLocalGenres(data.genres || []);
  saveLocalMembers(data.members || []);
};

export const fetchFromCloud = async (url: string): Promise<{books: Book[], reviews: Review[]} | null> => {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Erreur réseau");
    const data = await response.json();
    
    const reviews = data.reviews.map((r: any) => ({
      ...r,
      aiAnalysis: typeof r.aiAnalysis === 'string' ? JSON.parse(r.aiAnalysis) : r.aiAnalysis
    }));

    return { books: data.books, reviews };
  } catch (error) {
    console.error("Cloud fetch failed:", error);
    return null;
  }
};

export const syncWithCloud = async (url: string, data: { books: Book[], reviews: Review[] }) => {
  try {
    const response = await fetch(url, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return { success: true };
  } catch (error) {
    console.error("Cloud sync failed:", error);
    return { success: false };
  }
};

export const MOCK_BOOKS: Book[] = [
  {
    id: "1",
    title: "L'Alchimiste",
    author: "Paulo Coelho",
    genre: "Philosophie",
    coverUrl: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=400",
    summary: "Santiago, un jeune berger andalou, part à la recherche d'un trésor caché au pied des Pyramides. Son voyage initiatique lui fera découvrir la 'Légende Personnelle' et le langage du monde.",
    recommendations: "Indispensable pour ceux qui cherchent leur voie et aiment les contes philosophiques.",
    personalRating: 5,
    addedBy: "Admin",
    createdAt: new Date().toISOString()
  },
  {
    id: "2",
    title: "1984",
    author: "George Orwell",
    genre: "Dystopie",
    coverUrl: "https://images.unsplash.com/photo-1541963463532-d68292c34b19?auto=format&fit=crop&q=80&w=400",
    summary: "Dans un monde sous surveillance constante dirigé par Big Brother, Winston Smith tente de se rebeller contre un système qui contrôle non seulement les actes, mais aussi les pensées.",
    recommendations: "Un classique absolu pour comprendre les mécanismes du pouvoir et de la manipulation.",
    personalRating: 4,
    addedBy: "Admin",
    createdAt: new Date().toISOString()
  }
];
