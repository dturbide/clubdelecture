
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

// Google Apps Script requires specific handling:
// 1. POST requests should use text/plain to avoid CORS preflight options request which GAS doesn't handle well.
// 2. GET requests might follow redirects.

export const fetchFromCloud = async (url: string): Promise<{ books: Book[], reviews: Review[], genres: string[], members: string[] } | null> => {
  try {
    console.log("Fetching from:", url);
    // Add cache buster to avoid browser caching
    const fetchUrl = url.includes('?') ? `${url}&t=${Date.now()}` : `${url}?t=${Date.now()}`;
    const response = await fetch(fetchUrl);
    if (!response.ok) throw new Error(`Erreur réseau: ${response.status} ${response.statusText}`);

    const text = await response.text();
    try {
      const data = JSON.parse(text);

      // Validation basique (Supporte Livres ou books)
      if (!data.Livres && !data.books && !data.Avis && !data.reviews) {
        console.warn("Format de données suspect (pas de Livres/Avis ni books/reviews):", data);
      }

      // Helper to clean keys (remove \n from headers)
      const cleanKeys = (obj: any) => {
        const newObj: any = {};
        Object.keys(obj).forEach(key => {
          // Log weird keys to help debug
          if (key.includes('\n')) console.log(`Found newline in key: "${key}" -> cleaned to "${key.trim()}"`);
          newObj[key.trim()] = obj[key];
        });
        return newObj;
      };

      const rawBooks = (data.Livres || data.books || []).map(cleanKeys);
      const rawReviews = (data.Avis || data.reviews || []).map(cleanKeys);
      const rawGenres = data.Genres || data.genres || [];
      const rawMembers = data.Membres || data.members || [];

      console.log("Raw books after cleaning:", rawBooks[0]); // Inspect first book

      // Map French headers (or English fallbacks) back to internal structure
      // IMPORTANT: Use String() to coerce values - Google Sheets may store "1984" as a number!
      const books = rawBooks.map((b: any) => ({
        id: String(b.id || b["id"] || `book-${Date.now()}-${Math.random()}`),
        createdAt: String(b["Horodatage"] || b.createdAt || new Date().toISOString()),
        addedBy: String(b["Présenté.e par"] || b.addedBy || "Inconnu"),
        title: String(b["Titre du livre"] || b.title || "Sans titre"),
        genre: String(b["Genre littéraire"] || b.genre || "Roman"),
        author: String(b["Auteur"] || b.author || "Inconnu"),
        summary: String(b["Résumé"] || b.summary || ""),
        coverUrl: String(b.coverUrl || ""),
        recommendations: String(b.recommendations || ""),
        personalRating: Number(b.personalRating) || 5
      }));

      console.log("Mapped books sample:", books[0]);

      // Parse nested JSON if needed
      const reviews = rawReviews.map((r: any) => ({
        ...r,
        aiAnalysis: typeof r.aiAnalysis === 'string' ? JSON.parse(r.aiAnalysis) : r.aiAnalysis
      }));

      if (books.length === 0) console.warn("Attention: Aucune donnée 'livres' trouvée dans la réponse JSON.");

      return {
        books,
        reviews,
        genres: rawGenres,
        members: rawMembers
      };
    } catch (e) {
      console.error("JSON Parse Error. Received:", text.substring(0, 500));
      // Check if it's an HTML response (login page or error)
      if (text.includes('<!DOCTYPE') || text.includes('<html')) {
        throw new Error("Google renvoie une page HTML au lieu de JSON. Causes possibles:\n1. Script non déployé en 'Anyone' (Tout le monde)\n2. Nouveau déploiement requis après modification du script\n3. URL incorrecte (utilisez l'URL de déploiement Web App)");
      }
      throw new Error(`Réponse invalide de Google: ${text.substring(0, 100)}...`);
    }
  } catch (error: any) {
    console.error("Cloud fetch failed:", error);
    throw error; // Re-throw to let UI handle the message
  }
};

let syncTimeout: any = null;
let lastSyncTime = 0;
const SYNC_DEBOUNCE_MS = 5000; // Wait 5 seconds after last change

/**
 * Trigger automatic background sync
 * Non-blocking, debounced to avoid rate limits
 */
export const autoSync = (
  scriptUrl: string | undefined,
  data: { books: Book[], reviews: Review[], genres: string[], members: string[] },
  onStatusChange?: (status: 'syncing' | 'success' | 'error') => void
) => {
  if (!scriptUrl) return;

  // Clear pending sync
  if (syncTimeout) clearTimeout(syncTimeout);

  // Set visual status to "waiting to sync" (optional, for now we just use syncing when it actually starts)

  syncTimeout = setTimeout(async () => {
    try {
      if (onStatusChange) onStatusChange('syncing');
      console.log("☁️ Auto-syncing to Google Sheets...");

      const result = await syncWithCloud(scriptUrl, data);

      if (result.success) {
        console.log("✅ Auto-sync success");
        if (onStatusChange) {
          onStatusChange('success');
          // Reset status after a few seconds
          setTimeout(() => onStatusChange('idle' as any), 3000);
        }
      } else {
        console.error("❌ Auto-sync failed");
        if (onStatusChange) onStatusChange('error');
      }
    } catch (e) {
      console.error("❌ Auto-sync error:", e);
      if (onStatusChange) onStatusChange('error');
    }
  }, SYNC_DEBOUNCE_MS);
};

export const syncWithCloud = async (url: string, data: { books: Book[], reviews: Review[], genres: string[], members: string[] }) => {
  try {
    // We use text/plain to avoid CORS preflight (OPTIONS) which often fails with GAS
    // MAP DATA TO FRENCH HEADERS
    const mappedBooks = data.books.map(b => ({
      "Horodatage": b.createdAt,
      "Présenté.e par": b.addedBy,
      "Titre du livre": b.title,
      "Genre littéraire": b.genre,
      "Auteur": b.author,
      "Résumé": b.summary,
      // Keep other fields for compatibility or if needed later
      "id": b.id,
      "coverUrl": b.coverUrl,
      "recommendations": b.recommendations,
      "personalRating": b.personalRating
    }));

    const payload = {
      Livres: mappedBooks,
      Avis: data.reviews,
      Genres: data.genres,
      Membres: data.members
    };

    const response = await fetch(url, {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
      },
    });

    // Validating response from GAS Web App
    const result = await response.json();
    return { success: result.success !== false };
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
