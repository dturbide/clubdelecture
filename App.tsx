
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Book, Review, AppState } from './types';
import * as storage from './services/storageService';
import { searchBookCover } from './services/geminiService';
import BookCard from './components/BookCard';
import BookRow from './components/BookRow';
import ReviewList from './components/ReviewList';

const DEFAULT_COVER = "https://images.unsplash.com/photo-1541963463532-d68292c34b19?q=80&w=400&auto=format&fit=crop";

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    books: [],
    reviews: [],
    genres: [],
    members: [],
    scriptUrl: "https://script.google.com/macros/s/AKfycbwNFy87Mt__t5syGUAG-lo9Aap6-nLk8AEH9jBP-3PB3JntrC1fzDJ_rkAc5_SlkBlEDg/exec",
    isLoading: true
  });

  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');

  const [currentUser, setCurrentUser] = useState<string>('Visiteur');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [filterGenre, setFilterGenre] = useState('Tous');
  const [sortBy, setSortBy] = useState<'recent' | 'alpha'>('recent');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isAddBookOpen, setIsAddBookOpen] = useState(false);
  const [csvPasteContent, setCsvPasteContent] = useState('');
  const [importPreview, setImportPreview] = useState<Book[]>([]);

  const [bookForm, setBookForm] = useState({
    title: '', author: '', genre: '', coverUrl: '', summary: '', recommendations: '', personalRating: 5, addedBy: ''
  });

  const csvInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const init = async () => {
        let books = storage.getLocalBooks();
        let reviews = storage.getLocalReviews();
        let genres = storage.getLocalGenres();
        let members = storage.getLocalMembers();
        const scriptUrl = storage.getConfig() || "https://script.google.com/macros/s/AKfycbwNFy87Mt__t5syGUAG-lo9Aap6-nLk8AEH9jBP-3PB3JntrC1fzDJ_rkAc5_SlkBlEDg/exec";
        if (books.length === 0) books = storage.MOCK_BOOKS;
        setState({ books, reviews, genres, members, scriptUrl, isLoading: false });
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
        title: findCol(["titre", "livre", "nom", "title"]),
        author: findCol(["auteur", "author"]),
        genre: findCol(["genre"]),
        summary: findCol(["resume", "description", "summary"])
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

  const filteredBooks = useMemo(() => {
    let result = state.books.filter(b =>
      (b.title.toLowerCase().includes(searchQuery.toLowerCase()) || b.author.toLowerCase().includes(searchQuery.toLowerCase())) &&
      (filterGenre === 'Tous' || b.genre === filterGenre)
    );
    if (sortBy === 'alpha') result.sort((a, b) => a.title.localeCompare(b.title));
    else result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return result;
  }, [state.books, searchQuery, filterGenre, sortBy]);

  if (state.isLoading) return <div className="min-h-screen flex items-center justify-center font-serif bg-[#fcfaf7]">Initialisation...</div>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <header className="flex flex-col sm:flex-row justify-between items-center mb-10 gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-stone-800">📚 Livres et tes pensées</h1>
          <p className="text-stone-500 text-sm">Votre espace de lecture partagé</p>
        </div>
        <div className="flex gap-2">
          {syncStatus === 'syncing' && <span className="text-xs font-bold text-amber-600 self-center animate-pulse">☁️ Sauvegarde...</span>}
          {syncStatus === 'success' && <span className="text-xs font-bold text-green-600 self-center">✅ Sauvegardé</span>}
          {syncStatus === 'error' && <span className="text-xs font-bold text-red-600 self-center">⚠️ Erreur Synchro</span>}

          <button onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')} className="p-2.5 bg-white rounded-xl shadow-sm border border-stone-200 text-sm font-bold">
            {viewMode === 'grid' ? '📄 Liste' : '🔲 Grille'}
          </button>
          <button onClick={() => setIsAdminOpen(true)} className="px-5 py-2.5 bg-amber-600 text-white rounded-xl font-bold text-sm shadow-md hover:bg-amber-700 transition-colors">⚙️ ADMINISTRATION</button>
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
            <input type="text" placeholder="Rechercher..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full px-4 py-2.5 rounded-xl bg-stone-50 border border-stone-100 outline-none text-sm" />
            <select value={filterGenre} onChange={(e) => setFilterGenre(e.target.value)} className="w-full px-4 py-2.5 rounded-xl bg-stone-50 border border-stone-100 outline-none text-sm">
              <option value="Tous">Tous les genres</option>
              {state.genres.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
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
        <button onClick={() => { setEditingBook(null); setBookForm({ title: '', author: '', genre: state.genres[0], coverUrl: '', summary: '', recommendations: '', personalRating: 5, addedBy: currentUser }); setIsAddBookOpen(true); }} className="fixed bottom-8 right-8 bg-stone-900 text-white px-8 py-4 rounded-full shadow-2xl font-bold hover:bg-amber-600 transition-all z-40 flex items-center gap-2">
          <span className="text-2xl">+</span> Proposer un livre
        </button>
      )}

      {/* ADMIN MODAL - SANS MOT DE PASSE POUR TEST */}
      {isAdminOpen && (
        <div className="fixed inset-0 bg-stone-900/90 backdrop-blur-md z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] p-8 max-w-3xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="font-serif text-3xl font-bold text-stone-800">Gestion des Données</h2>
                <p className="text-stone-400 text-xs font-bold uppercase tracking-widest mt-1">Outils d'importation collaborative</p>
              </div>
              <button onClick={() => setIsAdminOpen(false)} className="w-10 h-10 flex items-center justify-center bg-stone-100 rounded-full font-bold">✕</button>
            </div>

            <div className="flex-grow overflow-y-auto space-y-8 pr-2">
              <section className="bg-blue-50 p-4 rounded-2xl border border-blue-100 flex items-center justify-between">
                <p className="text-blue-700 text-sm font-medium">Vérifiez si le système répond correctement :</p>
                <button onClick={testSystem} className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold text-xs shadow-sm hover:bg-blue-700 transition-colors">🚀 TESTER LE SYSTÈME</button>
              </section>

              <section className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-stone-800">1. Coller vos données (CSV ou Excel)</h3>
                  <button onClick={() => { storage.saveLocalBooks([]); setState(prev => ({ ...prev, books: [] })); alert("Bibliothèque vidée."); }} className="text-[10px] font-bold text-red-500 hover:underline">VIDER TOUT</button>
                </div>
                <textarea
                  value={csvPasteContent}
                  onChange={(e) => parseAndPreview(e.target.value)}
                  placeholder="Exemple: Titre;Auteur;Genre&#10;L'étranger;Albert Camus;Roman"
                  className="w-full h-40 p-4 text-xs font-mono bg-stone-50 border border-stone-200 rounded-2xl outline-none focus:ring-2 focus:ring-amber-500"
                />
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
                      const result = await storage.fetchFromCloud(state.scriptUrl);
                      if (result) {
                        if (confirm(`Trouvé : ${result.books.length} livres, ${result.reviews.length} avis. Remplacer les données locales ?`)) {
                          setState(prev => ({ ...prev, ...result }));
                          storage.saveAllData(result);
                          alert("Données chargées avec succès !");
                        }
                      } else {
                        alert("Échec du chargement. Vérifiez l'URL et le déploiement.");
                      }
                    }}
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
                const newBook: Book = { ...bookForm, id: Date.now().toString(), createdAt: new Date().toISOString(), addedBy: currentUser };
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
              <select className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-white" value={bookForm.genre} onChange={e => setBookForm({ ...bookForm, genre: e.target.value })}>
                {state.genres.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
              <textarea placeholder="Résumé" className="w-full px-4 py-3 rounded-xl border border-stone-200 h-32 outline-none focus:ring-2 focus:ring-amber-500" value={bookForm.summary} onChange={e => setBookForm({ ...bookForm, summary: e.target.value })} />
              <button type="submit" className="w-full py-4 bg-amber-600 text-white rounded-2xl font-bold shadow-xl hover:bg-amber-700 transition-colors">
                {editingBook ? 'Mettre à jour' : 'Ajouter au club'}
              </button>
              <button type="button" onClick={() => { setIsAddBookOpen(false); setEditingBook(null); }} className="w-full py-2 text-stone-400 text-sm font-medium">Annuler</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
