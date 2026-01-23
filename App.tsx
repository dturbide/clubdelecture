
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Book, Review, AppState } from './types';
import * as storage from './services/storageService';
import BookCard from './components/BookCard';
import BookRow from './components/BookRow';
import ReviewList from './components/ReviewList';

const DEFAULT_COVER = "https://images.unsplash.com/photo-1541963463532-d68292c34b19?q=80&w=400&auto=format&fit=crop";

// Hash SHA-256 du mot de passe "livre2026"
// Pour générer un nouveau hash: console.log(await hashPassword("nouveau_mot_de_passe"))
const PASSWORD_HASH = "33eb8405e01fcb5609bcbf6faa0bb83de9925cdfafe698c859bdd8dc7c63034c";

// Fonction de hachage SHA-256
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + "clubdelecture_salt_2026");
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

const App: React.FC = () => {
  // État d'authentification globale
  const [isAppAuthenticated, setIsAppAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('clubdelecture_auth') === 'true';
  });
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const [state, setState] = useState<AppState>({
    books: [],
    reviews: [],
    genres: [],
    members: [],
    scriptUrl: "https://script.google.com/macros/s/AKfycbw8sfAt4FbspEoSuteXbBkZ8F-XdY-1ac6NJBGAo8UCLReSY2uTWWawrhgGGPDE4x2C/exec",
    isLoading: true
  });

  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');

  const [currentUser, setCurrentUser] = useState<string>('Visiteur');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [filterGenre, setFilterGenre] = useState('Tous');
  const [filterMember, setFilterMember] = useState('Tous');
  const [filterYear, setFilterYear] = useState('Tous');
  const [sortBy, setSortBy] = useState<'recent' | 'alpha'>('recent');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState('');

  const [isAddBookOpen, setIsAddBookOpen] = useState(false);
  const [csvPasteContent, setCsvPasteContent] = useState('');
  const [importPreview, setImportPreview] = useState<Book[]>([]);

  // New state for management inputs
  const [newGenre, setNewGenre] = useState('');
  const [newMember, setNewMember] = useState('');

  const [bookForm, setBookForm] = useState({
    title: '', author: '', genre: '', coverUrl: '', summary: '', recommendations: '', personalRating: 5, addedBy: ''
  });
  const [isSearchingCover, setIsSearchingCover] = useState(false);
  const [coverResults, setCoverResults] = useState<string[]>([]);
  const [confirmDelete, setConfirmDelete] = useState<Book | null>(null);
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  const csvInputRef = useRef<HTMLInputElement>(null);

  // Fonction avancée pour chercher les couvertures (plusieurs sources)
  const searchBookCover = async () => {
    if (!bookForm.title && !bookForm.author) {
      alert("Entrez un titre ou un auteur pour chercher une couverture.");
      return;
    }
    setIsSearchingCover(true);
    setCoverResults([]);
    
    const allCovers: string[] = [];
    const title = bookForm.title.trim();
    const author = bookForm.author.trim();
    
    try {
      // Stratégie 1: Open Library - recherche exacte
      try {
        const query1 = encodeURIComponent(`${title} ${author}`);
        const res1 = await fetch(`https://openlibrary.org/search.json?q=${query1}&limit=6`);
        const data1 = await res1.json();
        if (data1.docs) {
          data1.docs.forEach((doc: any) => {
            if (doc.cover_i && allCovers.length < 12) {
              allCovers.push(`https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`);
            }
          });
        }
      } catch (e) { console.log("Open Library exact failed"); }

      // Stratégie 2: Google Books API
      try {
        const query2 = encodeURIComponent(`${title} ${author}`);
        const res2 = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${query2}&maxResults=6`);
        const data2 = await res2.json();
        if (data2.items) {
          data2.items.forEach((item: any) => {
            if (item.volumeInfo?.imageLinks?.thumbnail && allCovers.length < 12) {
              const url = item.volumeInfo.imageLinks.thumbnail
                .replace('zoom=1', 'zoom=2')
                .replace('http://', 'https://');
              if (!allCovers.includes(url)) allCovers.push(url);
            }
          });
        }
      } catch (e) { console.log("Google Books failed"); }

      // Stratégie 3: Open Library - titre seul
      if (allCovers.length < 6 && title) {
        try {
          const cleanTitle = title.replace(/[,.:;!?()]/g, '').trim();
          const query3 = encodeURIComponent(cleanTitle);
          const res3 = await fetch(`https://openlibrary.org/search.json?title=${query3}&limit=6`);
          const data3 = await res3.json();
          if (data3.docs) {
            data3.docs.forEach((doc: any) => {
              if (doc.cover_i && allCovers.length < 12) {
                const url = `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`;
                if (!allCovers.includes(url)) allCovers.push(url);
              }
            });
          }
        } catch (e) { console.log("Open Library title failed"); }
      }

      // Stratégie 4: Open Library - auteur seul
      if (allCovers.length < 6 && author) {
        try {
          const cleanAuthor = author.replace(/^(De |Par )/i, '').split(/[|,]/)[0].trim();
          const query4 = encodeURIComponent(cleanAuthor);
          const res4 = await fetch(`https://openlibrary.org/search.json?author=${query4}&limit=6`);
          const data4 = await res4.json();
          if (data4.docs) {
            data4.docs.forEach((doc: any) => {
              if (doc.cover_i && allCovers.length < 12) {
                const url = `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`;
                if (!allCovers.includes(url)) allCovers.push(url);
              }
            });
          }
        } catch (e) { console.log("Open Library author failed"); }
      }

      // Résultats
      if (allCovers.length > 0) {
        setCoverResults(allCovers.slice(0, 12));
      } else {
        alert("Aucune couverture trouvée. Essayez avec un titre plus simple.");
      }
    } catch (error) {
      console.error("Erreur recherche couverture:", error);
      alert("Erreur lors de la recherche. Réessayez.");
    }
    setIsSearchingCover(false);
  };

  useEffect(() => {
    try {
      const init = async () => {
        // Charger les données locales comme fallback
        let books = storage.getLocalBooks();
        let reviews = storage.getLocalReviews();
        let genres = storage.getLocalGenres();
        let members = storage.getLocalMembers();
        const scriptUrl = storage.getConfig() || "https://script.google.com/macros/s/AKfycbw8sfAt4FbspEoSuteXbBkZ8F-XdY-1ac6NJBGAo8UCLReSY2uTWWawrhgGGPDE4x2C/exec";
        
        // TOUJOURS charger depuis Google Sheets pour avoir les données à jour
        if (scriptUrl) {
          console.log("📥 Chargement des données depuis Google Sheets...");
          try {
            const cloudData = await storage.fetchFromCloud(scriptUrl);
            if (cloudData && cloudData.books.length > 0) {
              books = cloudData.books;
              reviews = cloudData.reviews;
              genres = cloudData.genres.length > 0 ? cloudData.genres : genres;
              members = cloudData.members.length > 0 ? cloudData.members : members;
              // Mettre à jour le cache local
              storage.saveAllData({ books, reviews, genres, members });
              console.log(`✅ ${books.length} livres synchronisés depuis Google Sheets`);
            }
          } catch (e) {
            console.warn("⚠️ Impossible de charger depuis Google Sheets, utilisation des données locales:", e);
          }
        }
        
        // Fallback vers MOCK_BOOKS seulement si toujours vide
        if (books.length === 0) books = storage.MOCK_BOOKS;
        // Ensure members has at least default values
        if (members.length === 0) members = ['Admin', 'Visiteur'];
        setState({ books, reviews, genres, members, scriptUrl, isLoading: false });
        // Set currentUser to the first member in the list
        setCurrentUser(members[0]);
      };
      init();
    } catch (e) {
      console.error("Initialization error:", e);
      alert("Erreur lors du chargement : " + e);
    }
  }, []);

  // Fonction de test pour vérifier si JS tourne
  const testSystem = () => {
    alert("✅ Le système JavaScript fonctionne correctement.\nSi l'importation ne marche pas, le problème vient du format de vos données.");
  };

  const parseAndPreview = (text: string) => {
    setCsvPasteContent(text);
    if (!text.trim()) {
      setImportPreview([]);
      return;
    }

    try {
      const lines = text.trim().split(/\r?\n/);
      if (lines.length < 2) return;

      const headerLine = lines[0];
      const separators = ['\t', ';', ','];
      const delimiter = separators.reduce((prev, curr) =>
        (headerLine.split(curr).length > headerLine.split(prev).length) ? curr : prev
      );

      const headers = headerLine.split(delimiter).map(h => h.trim().replace(/^"|"$/g, ''));

      const findCol = (keys: string[]) => {
        const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z]/g, "");
        const targetKeys = keys.map(norm);
        return headers.findIndex(h => targetKeys.some(k => norm(h).includes(k)));
      };

      const idx = {
        title: findCol(["titre du livre", "titre", "livre", "nom", "title"]),
        author: findCol(["auteur", "auteur,", "présenté.e par", "author"]), // "auteur," matches the user request strictly
        genre: findCol(["genre littéraire", "genre"]),
        summary: findCol(["résumé", "description", "summary"])
      };

      if (idx.title === -1 || idx.author === -1) return;

      const preview = lines.slice(1).map((line, i) => {
        const cells = line.split(delimiter).map(c => c.trim().replace(/^"|"$/g, ''));
        if (cells.length < 2 || !cells[idx.title]) return null;
        return {
          id: `temp-${i}`,
          title: cells[idx.title],
          author: cells[idx.author] || "Inconnu",
          genre: (idx.genre !== -1 && cells[idx.genre]) ? cells[idx.genre] : "Roman",
          coverUrl: "",
          summary: (idx.summary !== -1 && cells[idx.summary]) ? cells[idx.summary] : "",
          recommendations: "",
          personalRating: 5,
          addedBy: currentUser,
          createdAt: new Date().toISOString()
        } as Book;
      }).filter((b): b is Book => b !== null);

      setImportPreview(preview.slice(0, 50)); // Max 50 pour la preview
    } catch (e) {
      console.error(e);
    }
  };

  const finalizeImport = () => {
    if (importPreview.length === 0) {
      alert("Rien à importer. Vérifiez que vos colonnes s'appellent bien 'Titre' et 'Auteur'.");
      return;
    }

    if (confirm(`Importer ${importPreview.length} livres ?`)) {
      const finalBooks = importPreview.map(b => ({ ...b, id: `book-${Date.now()}-${Math.random()}` }));
      const newState = [...state.books, ...finalBooks];
      setState(prev => ({ ...prev, books: newState }));

      storage.saveLocalBooks(newState);

      // Auto-sync
      storage.autoSync(state.scriptUrl, { ...state, books: newState }, setSyncStatus);

      setImportPreview([]);
      setCsvPasteContent('');
      setIsAdminOpen(false);
      alert("Importation réussie !");
    }
  };

  // Compteurs pour les filtres
  const memberCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    state.books.forEach(b => {
      const member = b.addedBy || 'Inconnu';
      counts[member] = (counts[member] || 0) + 1;
    });
    return counts;
  }, [state.books]);

  const genreCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    state.books.forEach(b => {
      const genre = b.genre || 'Autre';
      counts[genre] = (counts[genre] || 0) + 1;
    });
    return counts;
  }, [state.books]);

  const yearCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    state.books.forEach(b => {
      const year = b.createdAt ? new Date(b.createdAt).getFullYear().toString() : 'Inconnu';
      counts[year] = (counts[year] || 0) + 1;
    });
    return counts;
  }, [state.books]);

  const availableYears = useMemo(() => {
    return Object.keys(yearCounts).sort((a, b) => b.localeCompare(a));
  }, [yearCounts]);

  const filteredBooks = useMemo(() => {
    let result = state.books.filter(b => {
      // Search filter
      const matchesSearch = b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.author.toLowerCase().includes(searchQuery.toLowerCase());

      // Genre filter
      let matchesGenre = filterGenre === 'Tous' || b.genre === filterGenre;

      // Member filter
      let matchesMember = true;
      if (filterMember === 'MES_PROPOSITIONS') {
        matchesMember = b.addedBy?.trim().toLowerCase() === currentUser.trim().toLowerCase();
      } else if (filterMember !== 'Tous') {
        matchesMember = b.addedBy === filterMember;
      }

      // Year filter
      let matchesYear = true;
      if (filterYear !== 'Tous') {
        const bookYear = b.createdAt ? new Date(b.createdAt).getFullYear().toString() : 'Inconnu';
        matchesYear = bookYear === filterYear;
      }

      return matchesSearch && matchesGenre && matchesMember && matchesYear;
    });

    if (sortBy === 'alpha') result.sort((a, b) => a.title.localeCompare(b.title));
    else result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return result;
  }, [state.books, searchQuery, filterGenre, filterMember, filterYear, sortBy, currentUser]);

  if (state.isLoading) return <div className="min-h-screen flex items-center justify-center font-serif bg-[#fcfaf7]">Initialisation...</div>;

  // Écran de connexion - bloque toute l'application
  if (!isAppAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-stone-50 to-amber-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full border border-stone-100">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">📚</div>
            <h1 className="font-serif text-3xl font-bold text-stone-800 mb-2">Livres et tes pensées</h1>
            <p className="text-stone-500 text-sm">Votre espace de lecture partagé</p>
          </div>
          
          <form onSubmit={async (e) => {
            e.preventDefault();
            setLoginError('');
            
            const inputHash = await hashPassword(loginPassword);
            
            if (inputHash === PASSWORD_HASH) {
              sessionStorage.setItem('clubdelecture_auth', 'true');
              setIsAppAuthenticated(true);
            } else {
              setLoginError('Mot de passe incorrect');
              setLoginPassword('');
            }
          }} className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest block mb-2">
                🔐 Mot de passe
              </label>
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="Entrez le mot de passe"
                className="w-full px-4 py-3 rounded-xl border border-stone-200 outline-none focus:ring-2 focus:ring-amber-500 text-center text-lg"
                autoFocus
              />
            </div>
            
            {loginError && (
              <p className="text-red-600 text-sm text-center font-bold bg-red-50 py-2 rounded-lg">
                ⚠️ {loginError}
              </p>
            )}
            
            <button
              type="submit"
              className="w-full py-4 bg-amber-600 text-white rounded-2xl font-bold text-lg shadow-lg hover:bg-amber-700 transition-colors"
            >
              Entrer dans le club
            </button>
          </form>
          
          <p className="text-center text-xs text-stone-400 mt-6">
            Accès réservé aux membres du club de lecture
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <header className="flex flex-col sm:flex-row justify-between items-center mb-10 gap-4">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-3xl font-serif font-bold text-stone-800">📚 Livres et tes pensées</h1>
            <p className="text-stone-500 text-sm">Votre espace de lecture partagé</p>
          </div>
          <div className="bg-amber-100 border-2 border-amber-400 rounded-2xl px-5 py-3 text-center shadow-md">
            <p className="text-3xl font-bold text-amber-700">{state.books.length}</p>
            <p className="text-xs font-bold text-amber-600 uppercase tracking-wide">livres</p>
          </div>
        </div>
        <div className="flex gap-2">
          {syncStatus === 'syncing' && <span className="text-xs font-bold text-amber-600 self-center animate-pulse">☁️ Sauvegarde...</span>}
          {syncStatus === 'success' && <span className="text-xs font-bold text-green-600 self-center">✅ Sauvegardé</span>}
          {syncStatus === 'error' && <span className="text-xs font-bold text-red-600 self-center">⚠️ Erreur Synchro</span>}

          <button
            onClick={async () => {
              if (!state.scriptUrl) return alert("Aucune URL de synchronisation configurée");
              setSyncStatus('syncing');
              try {
                const result = await storage.fetchFromCloud(state.scriptUrl);
                if (result) {
                  console.log("Sync - Données reçues:", result);
                  console.log(`Sync - ${result.books.length} livres, ${result.genres.length} genres, ${result.members.length} membres`);
                  setState(prev => ({ ...prev, ...result }));
                  storage.saveAllData(result);
                  setSyncStatus('success');
                  setTimeout(() => setSyncStatus('idle' as any), 3000);
                }
              } catch (e: any) {
                setSyncStatus('error');
                alert("Erreur: " + e.message);
              }
            }}
            className="p-2.5 bg-white rounded-xl shadow-sm border border-stone-200 text-sm font-bold hover:bg-purple-50 transition-colors"
            title="Actualiser depuis Google Sheets"
          >
            🔄
          </button>
          <button onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')} className="p-2.5 bg-white rounded-xl shadow-sm border border-stone-200 text-sm font-bold">
            {viewMode === 'grid' ? '📄 Liste' : '🔲 Grille'}
          </button>
          <button onClick={() => setIsGuideOpen(true)} className="p-2.5 bg-white rounded-xl shadow-sm border border-stone-200 text-sm font-bold hover:bg-blue-50 transition-colors" title="Guide d'utilisation">
            ❓
          </button>
          <button onClick={() => setIsAdminOpen(true)} className="px-5 py-2.5 bg-amber-600 text-white rounded-xl font-bold text-sm shadow-md hover:bg-amber-700 transition-colors">⚙️ ADMINISTRATION</button>
          <button 
            onClick={() => {
              sessionStorage.removeItem('clubdelecture_auth');
              setIsAppAuthenticated(false);
            }} 
            className="p-2.5 bg-red-50 rounded-xl shadow-sm border border-red-200 text-sm font-bold hover:bg-red-100 transition-colors text-red-600" 
            title="Déconnexion"
          >
            🚪
          </button>
        </div>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <aside className="space-y-6">
          <div className="bg-stone-900 text-white p-6 rounded-2xl shadow-xl">
            <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest block mb-2">Membre Actif</label>
            <select value={currentUser} onChange={(e) => setCurrentUser(e.target.value)} className="w-full bg-stone-800 border-none rounded-xl py-2.5 px-3 text-sm outline-none">
              {state.members.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-100 space-y-4">
            {/* Recherche */}
            <div>
              <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest block mb-2">🔍 Recherche</label>
              <input type="text" placeholder="Titre ou auteur..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full px-4 py-2.5 rounded-xl bg-stone-50 border border-stone-100 outline-none text-sm focus:ring-2 focus:ring-amber-500" />
            </div>

            {/* Filtre par genre */}
            <div>
              <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest block mb-2">🏷️ Genre</label>
              <select value={filterGenre} onChange={(e) => setFilterGenre(e.target.value)} className="w-full px-4 py-2.5 rounded-xl bg-stone-50 border border-stone-100 outline-none text-sm">
                <option value="Tous">Tous les genres ({state.books.length})</option>
                {state.genres.map(g => <option key={g} value={g}>{g} ({genreCounts[g] || 0})</option>)}
              </select>
            </div>

            {/* Filtre par présentateur */}
            <div>
              <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest block mb-2">👤 Présenté par</label>
              <select value={filterMember} onChange={(e) => setFilterMember(e.target.value)} className="w-full px-4 py-2.5 rounded-xl bg-stone-50 border border-stone-100 outline-none text-sm">
                <option value="Tous">Tous les membres</option>
                <option value="MES_PROPOSITIONS">📚 Mes propositions ({memberCounts[currentUser] || 0})</option>
                {Object.keys(memberCounts).sort().map(m => (
                  <option key={m} value={m}>{m} ({memberCounts[m]})</option>
                ))}
              </select>
            </div>

            {/* Filtre par année */}
            <div>
              <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest block mb-2">📅 Année</label>
              <select value={filterYear} onChange={(e) => setFilterYear(e.target.value)} className="w-full px-4 py-2.5 rounded-xl bg-stone-50 border border-stone-100 outline-none text-sm">
                <option value="Tous">Toutes les années</option>
                {availableYears.map(y => (
                  <option key={y} value={y}>{y} ({yearCounts[y]})</option>
                ))}
              </select>
            </div>

            {/* Tri */}
            <div>
              <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest block mb-2">📊 Tri</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setSortBy('recent')}
                  className={`flex-1 px-3 py-2 rounded-xl text-xs font-bold transition-colors ${sortBy === 'recent'
                    ? 'bg-stone-800 text-white'
                    : 'bg-stone-50 border border-stone-100 text-stone-500 hover:bg-stone-100'
                    }`}
                >
                  🕒 Récents
                </button>
                <button
                  onClick={() => setSortBy('alpha')}
                  className={`flex-1 px-3 py-2 rounded-xl text-xs font-bold transition-colors ${sortBy === 'alpha'
                    ? 'bg-stone-800 text-white'
                    : 'bg-stone-50 border border-stone-100 text-stone-500 hover:bg-stone-100'
                    }`}
                >
                  🔤 A-Z
                </button>
              </div>
            </div>

            {/* Réinitialiser les filtres */}
            {(filterGenre !== 'Tous' || filterMember !== 'Tous' || filterYear !== 'Tous' || searchQuery) && (
              <button
                onClick={() => { setFilterGenre('Tous'); setFilterMember('Tous'); setFilterYear('Tous'); setSearchQuery(''); }}
                className="w-full px-4 py-2 rounded-xl text-xs font-bold text-red-600 bg-red-50 border border-red-100 hover:bg-red-100 transition-colors"
              >
                ✕ Réinitialiser les filtres
              </button>
            )}

            {/* Résumé des résultats */}
            <div className="pt-3 border-t border-stone-100 text-center">
              <p className="text-sm font-bold text-stone-700">{filteredBooks.length} livre{filteredBooks.length > 1 ? 's' : ''}</p>
              <p className="text-[10px] text-stone-400">sur {state.books.length} au total</p>
            </div>
          </div>
        </aside>

        <section className="lg:col-span-3">
          {selectedBook ? (
            <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-stone-100">
              <div className="relative">
                <button onClick={() => setSelectedBook(null)} className="absolute top-4 right-4 z-20 bg-white/90 w-10 h-10 rounded-full shadow-lg font-bold hover:scale-110 transition-transform">✕</button>
                <div className="md:flex">
                  <div className="md:w-1/3 aspect-[2/3] bg-stone-100"><img src={selectedBook.coverUrl || DEFAULT_COVER} className="w-full h-full object-cover" alt={selectedBook.title} /></div>
                  <div className="md:w-2/3 p-8 md:p-12">
                    <h2 className="text-4xl font-serif font-bold mb-2 text-stone-800">{selectedBook.title}</h2>
                    <p className="text-xl text-stone-400 italic mb-6">par {selectedBook.author}</p>
                    <div className="p-6 bg-stone-50 rounded-2xl border border-stone-100 mb-8 text-stone-600 leading-relaxed text-sm">
                      {selectedBook.summary || "Aucun résumé disponible pour ce livre."}
                    </div>
                    <ReviewList bookId={selectedBook.id} bookTitle={selectedBook.title} bookAuthor={selectedBook.author} currentUser={currentUser} reviews={state.reviews.filter(r => r.bookId === selectedBook.id)} onAddReview={(r) => {
                      const updated = [...state.reviews, r];
                      setState(prev => ({ ...prev, reviews: updated }));
                      storage.saveLocalReviews(updated);
                      storage.autoSync(state.scriptUrl, { ...state, reviews: updated }, setSyncStatus); // Auto-sync reviews
                    }} />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className={viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
              {filteredBooks.map(book => (
                viewMode === 'grid' ?
                  <BookCard key={book.id} book={book} currentUser={currentUser} reviews={state.reviews} onClick={setSelectedBook} onEdit={(b) => { setEditingBook(b); setBookForm(b); setIsAddBookOpen(true); }} /> :
                  <BookRow key={book.id} book={book} currentUser={currentUser} reviews={state.reviews} onClick={setSelectedBook} onEdit={(b) => { setEditingBook(b); setBookForm(b); setIsAddBookOpen(true); }} />
              ))}
              {filteredBooks.length === 0 && (
                <div className="col-span-full py-20 text-center bg-white rounded-3xl border border-dashed border-stone-200">
                  <p className="text-stone-400 font-serif italic">Aucun livre ne correspond à votre recherche.</p>
                </div>
              )}
            </div>
          )}
        </section>
      </main>

      {!selectedBook && (
        <button onClick={() => {
          setEditingBook(null);
          setBookForm({
            title: '',
            author: '',
            genre: state.genres[0] || 'Roman',
            coverUrl: '',
            summary: '',
            recommendations: '',
            personalRating: 5,
            addedBy: currentUser
          });
          setIsAddBookOpen(true);
        }} className="fixed bottom-8 right-8 bg-stone-900 text-white px-8 py-4 rounded-full shadow-2xl font-bold hover:bg-amber-600 transition-all z-40 flex items-center gap-2">
          <span className="text-2xl">+</span> Proposer un livre
        </button>
      )}

      {/* ADMIN MODAL */}
      {isAdminOpen && (
        <div className="fixed inset-0 bg-stone-900/90 backdrop-blur-md z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] p-8 max-w-3xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="font-serif text-3xl font-bold text-stone-800">Administration</h2>
                <p className="text-stone-400 text-xs font-bold uppercase tracking-widest mt-1">Zone sécurisée</p>
              </div>
              <button onClick={() => setIsAdminOpen(false)} className="w-10 h-10 flex items-center justify-center bg-stone-100 rounded-full font-bold">✕</button>
            </div>

            {!isAdminAuthenticated ? (
              <div className="flex flex-col items-center justify-center space-y-4 py-10">
                <p className="text-stone-600 font-serif">Veuillez entrer le mot de passe administrateur</p>
                <input
                  type="password"
                  className="px-4 py-2 border border-stone-300 rounded-xl outline-none focus:ring-2 focus:ring-amber-500"
                  value={adminPasswordInput}
                  onChange={(e) => setAdminPasswordInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      if (adminPasswordInput === 'club-lecture-2024') {
                        setIsAdminAuthenticated(true);
                        setAdminPasswordInput('');
                      } else {
                        alert('Mot de passe incorrect');
                      }
                    }
                  }}
                />
                <button
                  onClick={() => {
                    if (adminPasswordInput === 'club-lecture-2024') {
                      setIsAdminAuthenticated(true);
                      setAdminPasswordInput('');
                    } else {
                      alert('Mot de passe incorrect');
                    }
                  }}
                  className="px-6 py-2 bg-amber-600 text-white rounded-xl font-bold hover:bg-amber-700 transition"
                >
                  Accéder
                </button>
              </div>
            ) : (
              <div className="flex-grow overflow-y-auto space-y-8 pr-2">
                <section className="bg-blue-50 p-4 rounded-2xl border border-blue-100 flex items-center justify-between">
                  <p className="text-blue-700 text-sm font-medium">Vérifiez si le système répond correctement :</p>
                  <button onClick={testSystem} className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold text-xs shadow-sm hover:bg-blue-700 transition-colors">🚀 TESTER LE SYSTÈME</button>
                </section>

                {/* GESTION DES GENRES */}
                <section className="space-y-4 border-b border-stone-100 pb-8">
                  <h3 className="font-bold text-stone-800">🏷️ Gérer les Genres Littéraires</h3>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Nouveau genre..."
                      className="flex-1 px-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm"
                      value={newGenre}
                      onChange={(e) => setNewGenre(e.target.value)}
                    />
                    <button
                      onClick={() => {
                        if (!newGenre.trim()) return;
                        const updated = [...state.genres, newGenre.trim()];
                        setState(prev => ({ ...prev, genres: updated }));
                        storage.saveLocalGenres(updated);
                        storage.autoSync(state.scriptUrl, { ...state, genres: updated }, setSyncStatus); // Sync
                        setNewGenre('');
                      }}
                      className="px-4 py-2 bg-stone-800 text-white rounded-xl text-sm font-bold"
                    >Ajouter</button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {state.genres.map((g, idx) => (
                      <div key={`${g}-${idx}`} className="flex items-center gap-1 pl-3 pr-1 py-1 bg-white border border-stone-200 rounded-full text-xs font-medium">
                        <span>{g}</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            if (window.confirm(`Voulez-vous vraiment supprimer le genre "${g}" ?`)) {
                              const updated = state.genres.filter((_, i) => i !== idx);
                              const newState = { ...state, genres: updated };
                              setState(prev => ({ ...prev, genres: updated }));
                              storage.saveLocalGenres(updated);
                              storage.autoSync(state.scriptUrl, newState, setSyncStatus);
                            }
                          }}
                          className="w-6 h-6 flex items-center justify-center text-stone-400 hover:text-red-600 hover:bg-stone-50 rounded-full transition-colors cursor-pointer"
                          title={`Supprimer ${g}`}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </section>

                {/* GESTION DES MEMBRES */}
                <section className="space-y-4 border-b border-stone-100 pb-8">
                  <h3 className="font-bold text-stone-800">👥 Gérer les Membres</h3>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Nouveau membre..."
                      className="flex-1 px-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm"
                      value={newMember}
                      onChange={(e) => setNewMember(e.target.value)}
                    />
                    <button
                      onClick={() => {
                        if (!newMember.trim()) return;
                        const updated = [...state.members, newMember.trim()];
                        setState(prev => ({ ...prev, members: updated }));
                        storage.saveLocalMembers(updated);
                        storage.autoSync(state.scriptUrl, { ...state, members: updated }, setSyncStatus); // Sync
                        setNewMember('');
                      }}
                      className="px-4 py-2 bg-stone-800 text-white rounded-xl text-sm font-bold"
                    >Ajouter</button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {state.members.map((m, idx) => (
                      <div key={`${m}-${idx}`} className="flex items-center gap-1 pl-3 pr-1 py-1 bg-white border border-stone-200 rounded-full text-xs font-medium">
                        <span>{m}</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            if (window.confirm(`Voulez-vous vraiment supprimer le membre "${m}" ?`)) {
                              const updated = state.members.filter((_, i) => i !== idx);
                              const newState = { ...state, members: updated };
                              setState(prev => ({ ...prev, members: updated }));
                              storage.saveLocalMembers(updated);
                              storage.autoSync(state.scriptUrl, newState, setSyncStatus);
                            }
                          }}
                          className="w-6 h-6 flex items-center justify-center text-stone-400 hover:text-red-600 hover:bg-stone-50 rounded-full transition-colors cursor-pointer"
                          title={`Supprimer ${m}`}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="bg-purple-50 p-6 rounded-2xl border border-purple-100 space-y-4">
                  <h3 className="font-bold text-purple-900 flex items-center gap-2">
                    ☁️ Synchronisation Google Sheets
                  </h3>
                  <p className="text-purple-700 text-xs text-justify leading-relaxed">
                    Pour activer la sauvegarde en ligne :
                    <br />1. Créez un Google Sheet et allez dans Extensions {'>'} Apps Script.
                    <br />2. Collez le code fourni (google_apps_script.js).
                    <br />3. Déployez en tant qu'application Web (Accès: "Anyone").
                    <br />4. Collez l'URL ici :
                  </p>

                  <input
                    type="text"
                    placeholder="https://script.google.com/macros/s/..."
                    value={state.scriptUrl || ''}
                    onChange={(e) => {
                      const url = e.target.value;
                      setState(prev => ({ ...prev, scriptUrl: url }));
                      storage.saveConfig(url);
                    }}
                    className="w-full px-4 py-3 rounded-xl border border-purple-200 bg-white text-xs outline-none focus:ring-2 focus:ring-purple-500"
                  />

                  <div className="flex gap-2">
                    <button
                      onClick={async () => {
                        if (!state.scriptUrl) return alert("Veuillez entrer une URL valide.");
                        const btn = document.getElementById('load-cloud-btn');
                        if (btn) btn.innerText = "⏳ Chargement...";

                        try {
                          const result = await storage.fetchFromCloud(state.scriptUrl);
                          if (result) {
                            console.log("Données reçues:", result);
                            const msg = `Trouvé :\n• ${result.books.length} livres\n• ${result.reviews.length} avis\n• ${result.genres.length} genres\n• ${result.members.length} membres\n\nRemplacer les données locales ?`;
                            if (confirm(msg)) {
                              setState(prev => ({ ...prev, ...result }));
                              storage.saveAllData(result);
                              alert(`Données chargées avec succès !\n\nGenres: ${result.genres.join(', ')}\nMembres: ${result.members.join(', ')}`);
                            }
                          }
                        } catch (e: any) {
                          alert("Erreur : " + e.message);
                        } finally {
                          if (btn) btn.innerText = "⬇️ CHARGER DU CLOUD";
                        }
                      }}
                      id="load-cloud-btn"
                      className="flex-1 py-3 bg-purple-600 text-white rounded-xl font-bold text-xs shadow-md hover:bg-purple-700 transition-colors"
                    >
                      ⬇️ CHARGER DU CLOUD
                    </button>
                    <button
                      onClick={async () => {
                        if (!state.scriptUrl) return alert("Veuillez entrer une URL valide.");
                        const success = await storage.syncWithCloud(state.scriptUrl, {
                          books: state.books,
                          reviews: state.reviews,
                          genres: state.genres,
                          members: state.members
                        });
                        if (success.success) alert("Sauvegarde réussie !");
                        else alert("Erreur lors de la sauvegarde.");
                      }}
                      className="flex-1 py-3 bg-white text-purple-600 border border-purple-200 rounded-xl font-bold text-xs shadow-sm hover:bg-purple-50 transition-colors"
                    >
                      ⬆️ ENVOYER VERS CLOUD
                    </button>
                  </div>
                </section>

                {importPreview.length > 0 && (
                  <section className="space-y-4 animate-in fade-in slide-in-from-top-2">
                    <h3 className="font-bold text-stone-800 flex items-center gap-2">
                      2. Aperçu ({importPreview.length} livres trouvés)
                      <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded">Prêt</span>
                    </h3>
                    <div className="border border-stone-100 rounded-2xl overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-stone-50 border-b border-stone-100">
                          <tr>
                            <th className="p-3 font-bold text-stone-400">Titre</th>
                            <th className="p-3 font-bold text-stone-400">Auteur</th>
                            <th className="p-3 font-bold text-stone-400">Genre</th>
                          </tr>
                        </thead>
                        <tbody>
                          {importPreview.slice(0, 5).map((b, i) => (
                            <tr key={i} className="border-b border-stone-50">
                              <td className="p-3 font-bold">{b.title}</td>
                              <td className="p-3 text-stone-500">{b.author}</td>
                              <td className="p-3"><span className="px-2 py-0.5 bg-stone-100 rounded text-[10px]">{b.genre}</span></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {importPreview.length > 5 && <p className="p-2 text-center text-[10px] text-stone-400 font-bold">... + {importPreview.length - 5} autres lignes</p>}
                    </div>
                    <button
                      onClick={finalizeImport}
                      className="w-full py-4 bg-green-600 text-white rounded-2xl font-bold shadow-lg hover:bg-green-700 transition-colors transform active:scale-95"
                    >
                      CONFIRMER L'IMPORTATION ✨
                    </button>
                  </section>
                )}
              </div>
            )} {/* End of Authenticated check */}

            <button onClick={() => setIsAdminOpen(false)} className="mt-6 w-full py-3 bg-stone-100 text-stone-500 rounded-xl font-bold text-sm">Fermer la console</button>
          </div>
        </div>
      )}

      {/* ADD/EDIT BOOK MODAL */}
      {isAddBookOpen && (
        <div className="fixed inset-0 bg-stone-900/80 backdrop-blur-lg z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] p-8 max-w-xl w-full shadow-2xl">
            <h2 className="font-serif text-3xl font-bold mb-6 text-stone-800">{editingBook ? 'Modifier le livre' : 'Nouveau livre'}</h2>
            <form onSubmit={(e) => {
              e.preventDefault();
              let updatedBooks: Book[];
              if (editingBook) {
                updatedBooks = state.books.map(b => b.id === editingBook.id ? { ...b, ...bookForm } : b);
              } else {
                const newBook: Book = { ...bookForm, id: Date.now().toString(), createdAt: new Date().toISOString() };
                updatedBooks = [...state.books, newBook];
              }
              setState(prev => ({ ...prev, books: updatedBooks }));

              storage.saveLocalBooks(updatedBooks);

              // Auto-sync edits/additions
              storage.autoSync(state.scriptUrl, { ...state, books: updatedBooks }, setSyncStatus);

              setIsAddBookOpen(false);
              setEditingBook(null);
            }} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <input required type="text" placeholder="Titre" className="w-full px-4 py-3 rounded-xl border border-stone-200" value={bookForm.title} onChange={e => setBookForm({ ...bookForm, title: e.target.value })} />
                <input required type="text" placeholder="Auteur" className="w-full px-4 py-3 rounded-xl border border-stone-200" value={bookForm.author} onChange={e => setBookForm({ ...bookForm, author: e.target.value })} />
              </div>

              {/* Recherche de couverture */}
              <div className="border border-dashed border-stone-200 rounded-xl p-4 bg-stone-50">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">🖼️ Couverture</label>
                  <button
                    type="button"
                    onClick={searchBookCover}
                    disabled={isSearchingCover}
                    className="px-3 py-1 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {isSearchingCover ? '⏳ Recherche...' : '🔍 Chercher'}
                  </button>
                </div>
                {bookForm.coverUrl && (
                  <div className="flex items-center gap-3 mb-2">
                    <img src={bookForm.coverUrl} alt="Couverture" className="w-12 h-16 object-cover rounded shadow" />
                    <input
                      type="text"
                      placeholder="URL de la couverture"
                      className="flex-1 px-3 py-2 rounded-lg border border-stone-200 text-xs"
                      value={bookForm.coverUrl}
                      onChange={e => setBookForm({ ...bookForm, coverUrl: e.target.value })}
                    />
                    <button type="button" onClick={() => setBookForm({ ...bookForm, coverUrl: '' })} className="text-red-500 text-xs">✕</button>
                  </div>
                )}
                {coverResults.length > 0 && (
                  <div>
                    <p className="text-xs text-stone-500 mb-2">Sélectionnez une couverture ({coverResults.length} trouvées) :</p>
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-48 overflow-y-auto">
                      {coverResults.map((url, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => { setBookForm({ ...bookForm, coverUrl: url }); setCoverResults([]); }}
                          className={`aspect-[2/3] rounded overflow-hidden border-2 hover:border-amber-500 transition-all ${bookForm.coverUrl === url ? 'border-amber-500 ring-2 ring-amber-300' : 'border-stone-200'}`}
                        >
                          <img src={url} alt={`Option ${i + 1}`} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {!bookForm.coverUrl && coverResults.length === 0 && (
                  <p className="text-xs text-stone-400 text-center py-2">Entrez titre/auteur puis cliquez "Chercher"</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest block mb-1">Genre</label>
                  <select className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-white" value={bookForm.genre} onChange={e => setBookForm({ ...bookForm, genre: e.target.value })}>
                    {state.genres.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest block mb-1">👤 Présenté par</label>
                  <select className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-white" value={bookForm.addedBy} onChange={e => setBookForm({ ...bookForm, addedBy: e.target.value })}>
                    {state.members.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest block mb-2">⭐ Évaluation personnelle</label>
                <div className="flex gap-2 justify-center">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setBookForm({ ...bookForm, personalRating: star })}
                      className={`text-3xl transition-transform hover:scale-125 ${star <= bookForm.personalRating ? 'text-amber-400' : 'text-stone-200'}`}
                    >
                      ★
                    </button>
                  ))}
                </div>
                <p className="text-center text-xs text-stone-400 mt-1">{bookForm.personalRating}/5 étoiles</p>
              </div>
              <textarea placeholder="Résumé" className="w-full px-4 py-3 rounded-xl border border-stone-200 h-24 outline-none focus:ring-2 focus:ring-amber-500" value={bookForm.summary} onChange={e => setBookForm({ ...bookForm, summary: e.target.value })} />
              <button type="submit" className="w-full py-4 bg-amber-600 text-white rounded-2xl font-bold shadow-xl hover:bg-amber-700 transition-colors">
                {editingBook ? 'Mettre à jour' : 'Ajouter au club'}
              </button>
              <button type="button" onClick={() => { setIsAddBookOpen(false); setEditingBook(null); }} className="w-full py-2 text-stone-400 text-sm font-medium">Annuler</button>
              {editingBook && (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(editingBook)}
                  className="w-full py-3 mt-4 text-red-600 bg-red-50 border border-red-200 rounded-xl text-sm font-bold hover:bg-red-100 transition-colors"
                >
                  🗑️ Supprimer ce livre
                </button>
              )}
            </form>
          </div>
        </div>
      )}

      {/* Modal de confirmation de suppression */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-stone-900/80 backdrop-blur-lg z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🗑️</span>
            </div>
            <h3 className="font-serif text-xl font-bold text-stone-800 mb-2">Supprimer ce livre ?</h3>
            <p className="text-stone-600 mb-2">
              <strong>« {confirmDelete.title} »</strong>
            </p>
            <p className="text-sm text-stone-500 mb-6">
              Cette action est irréversible. Le livre sera supprimé définitivement.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 py-3 px-4 bg-stone-100 text-stone-700 rounded-xl font-bold hover:bg-stone-200 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  const updatedBooks = state.books.filter(b => b.id !== confirmDelete.id);
                  setState(prev => ({ ...prev, books: updatedBooks }));
                  storage.saveLocalBooks(updatedBooks);
                  storage.autoSync(state.scriptUrl, { ...state, books: updatedBooks }, setSyncStatus);
                  setConfirmDelete(null);
                  setIsAddBookOpen(false);
                  setEditingBook(null);
                }}
                className="flex-1 py-3 px-4 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Guide d'utilisation */}
      {isGuideOpen && (
        <div className="fixed inset-0 bg-stone-900/80 backdrop-blur-lg z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white border-b border-stone-100 p-6 flex justify-between items-center">
              <h2 className="font-serif text-2xl font-bold text-stone-800">📚 Guide d'utilisation</h2>
              <button onClick={() => setIsGuideOpen(false)} className="w-10 h-10 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-500 text-xl transition-colors">✕</button>
            </div>
            <div className="p-6 space-y-8">
              {/* Section 1: Sélectionner son profil */}
              <section className="bg-red-50 p-4 rounded-xl border border-red-200">
                <h3 className="text-lg font-bold text-red-700 mb-3 flex items-center gap-2">⚠️ IMPORTANT - Sélectionner votre profil</h3>
                <p className="text-stone-700 text-sm leading-relaxed mb-3">
                  <strong>Avant toute action</strong>, vous devez sélectionner votre nom :
                </p>
                <ol className="text-stone-600 text-sm leading-relaxed list-decimal list-inside space-y-2 ml-2">
                  <li>Regardez la <strong>barre de gauche</strong></li>
                  <li>Trouvez la boîte noire <strong>"Membre Actif"</strong> (tout en haut)</li>
                  <li>Cliquez sur le menu déroulant</li>
                  <li>Sélectionnez <strong>votre nom</strong> dans la liste</li>
                </ol>
                <p className="text-red-600 text-xs mt-3 font-bold">
                  Sans cette étape, vous ne pourrez pas modifier vos livres !
                </p>
              </section>

              {/* Section 2: Proposer un livre */}
              <section>
                <h3 className="text-lg font-bold text-amber-700 mb-3 flex items-center gap-2">📖 2. Proposer un livre</h3>
                <ol className="text-stone-600 text-sm leading-relaxed list-decimal list-inside space-y-2">
                  <li><strong>D'abord :</strong> Vérifiez que votre nom est sélectionné (voir étape 1)</li>
                  <li>Cliquez sur <strong>"+ Proposer un livre"</strong> (bouton jaune en bas de la barre de gauche)</li>
                  <li>Remplissez le titre et l'auteur</li>
                  <li>Cliquez sur <strong>"🔍 Chercher"</strong> pour trouver une couverture automatiquement</li>
                  <li>Sélectionnez le genre et donnez votre évaluation personnelle (étoiles)</li>
                  <li>Cliquez sur <strong>"Ajouter au club"</strong></li>
                </ol>
              </section>

              {/* Section 3: Modifier un livre */}
              <section className="bg-amber-50 p-4 rounded-xl border border-amber-100">
                <h3 className="text-lg font-bold text-amber-700 mb-3 flex items-center gap-2">✏️ 3. Modifier une proposition</h3>
                <p className="text-red-600 text-sm mb-3 font-bold">⚠️ Vous pouvez uniquement modifier VOS livres (ceux que vous avez proposés).</p>
                <ol className="text-stone-600 text-sm leading-relaxed list-decimal list-inside space-y-2">
                  <li><strong>D'abord :</strong> Sélectionnez votre nom dans "Membre Actif" (barre de gauche, boîte noire)</li>
                  <li><strong>Ensuite :</strong> Trouvez votre livre et survolez-le avec la souris</li>
                  <li><strong>Cliquez</strong> sur le bouton crayon ✏️ qui apparaît</li>
                  <li>Modifiez les informations dans le formulaire</li>
                  <li>Cliquez sur <strong>"Mettre à jour"</strong></li>
                </ol>
                <p className="text-stone-500 text-xs mt-3 italic">
                  💡 Le bouton crayon ✏️ n'apparaît que sur VOS livres, une fois votre nom sélectionné.
                </p>
              </section>

              {/* Section 4: Supprimer un livre */}
              <section>
                <h3 className="text-lg font-bold text-amber-700 mb-3 flex items-center gap-2">🗑️ 4. Supprimer un livre</h3>
                <p className="text-stone-600 text-sm leading-relaxed">
                  Ouvrez le formulaire de modification, puis cliquez sur <strong>"🗑️ Supprimer ce livre"</strong> en bas. 
                  Confirmez dans le modal qui apparaît. <span className="text-red-600 font-bold">Action irréversible.</span>
                </p>
              </section>

              {/* Section 5: Ajouter un avis */}
              <section>
                <h3 className="text-lg font-bold text-amber-700 mb-3 flex items-center gap-2">⭐ 5. Ajouter un avis</h3>
                <ol className="text-stone-600 text-sm leading-relaxed list-decimal list-inside space-y-2">
                  <li>Cliquez sur un livre pour voir ses détails</li>
                  <li>Cliquez sur <strong>"+ Ajouter un avis"</strong></li>
                  <li>Donnez une note (1-5 étoiles) et écrivez votre commentaire</li>
                  <li>Cliquez sur <strong>"Publier l'avis"</strong></li>
                </ol>
              </section>

              {/* Section 6: Filtres */}
              <section>
                <h3 className="text-lg font-bold text-amber-700 mb-3 flex items-center gap-2">🔍 6. Filtres et recherche</h3>
                <ul className="text-stone-600 text-sm leading-relaxed space-y-1">
                  <li><strong>Recherche :</strong> Tapez un titre ou auteur</li>
                  <li><strong>Genre :</strong> Filtrez par catégorie littéraire</li>
                  <li><strong>Présenté par :</strong> Filtrez par membre ou "Mes propositions"</li>
                  <li><strong>Année :</strong> Filtrez par année de proposition</li>
                  <li><strong>Tri :</strong> Récents ou alphabétique (A-Z)</li>
                </ul>
              </section>

              {/* Section 7: Boutons rapides */}
              <section className="bg-stone-50 p-4 rounded-xl">
                <h3 className="text-lg font-bold text-stone-700 mb-3">🎯 Résumé des boutons</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2"><span className="text-lg">🔄</span> Actualiser depuis le cloud</div>
                  <div className="flex items-center gap-2"><span className="text-lg">📄/🔲</span> Basculer liste/grille</div>
                  <div className="flex items-center gap-2"><span className="text-lg">❓</span> Ce guide</div>
                  <div className="flex items-center gap-2"><span className="text-lg">⚙️</span> Administration</div>
                </div>
              </section>

              <p className="text-center text-xs text-stone-400 pt-4 border-t border-stone-100">
                Mot de passe admin : <code className="bg-stone-100 px-2 py-1 rounded">club-lecture-2024</code>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
