
import React, { useState } from 'react';
import { Book, Review } from '../types';

const DEFAULT_COVER = "https://images.unsplash.com/photo-1541963463532-d68292c34b19?q=80&w=400&auto=format&fit=crop";

interface BookRowProps {
  book: Book;
  currentUser: string;
  reviews: Review[];
  onClick: (book: Book) => void;
  onEdit: (book: Book) => void;
}

const BookRow: React.FC<BookRowProps> = ({ book, currentUser, reviews, onClick, onEdit }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const bookReviews = reviews.filter(r => r.bookId === book.id);
  const isOwner = currentUser.trim().toLowerCase() === (book.addedBy || '').trim().toLowerCase();
  const avgRating = bookReviews.length
    ? (bookReviews.reduce((sum, r) => sum + r.rating, 0) / bookReviews.length).toFixed(1)
    : "N/A";

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-all border border-stone-100 group">
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center p-3 cursor-pointer"
      >
        <div className="w-16 h-24 flex-shrink-0 overflow-hidden rounded-lg bg-stone-200 mr-4">
          <img
            src={book.coverUrl || DEFAULT_COVER}
            alt={book.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_COVER; }}
          />
        </div>
        <div className="flex-grow grid grid-cols-1 md:grid-cols-5 gap-2 md:gap-4 items-center">
          <div className="md:col-span-2">
            <h3 className="font-serif text-lg font-bold text-stone-800 leading-tight group-hover:text-amber-600 transition-colors">{book.title}</h3>
            <p className="text-sm text-stone-500 italic">{book.author}</p>
            {/* Mobile: Genre et Proposé par sur la même ligne */}
            <div className="flex gap-3 mt-1 md:hidden">
              <span className="text-xs text-stone-500">{book.genre}</span>
              <span className="text-xs text-amber-700">• {book.addedBy}</span>
            </div>
          </div>
          <div className="hidden md:block">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest block mb-1">Genre</span>
            <p className="text-xs font-medium text-stone-600">{book.genre}</p>
          </div>
          <div className="hidden md:block">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest block mb-1">Proposé par</span>
            <p className="text-xs font-medium text-amber-700">{book.addedBy}</p>
          </div>
          <div className="flex items-center justify-between md:justify-end gap-4 text-center">
            <div>
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest block mb-1">Note</span>
              <div className="text-amber-500 text-sm">
                {"★".repeat(book.personalRating || 0)}{"☆".repeat(5 - (book.personalRating || 0))}
              </div>
            </div>
            <div>
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest block mb-1">Avis</span>
              <div className="bg-stone-50 px-2 py-1 rounded-lg text-sm font-bold">⭐ {avgRating}</div>
            </div>
          </div>
        </div>
        <div className="ml-4 flex items-center gap-3">
          {isOwner && (
            <button onClick={(e) => { e.stopPropagation(); onEdit(book); }} className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-all opacity-0 group-hover:opacity-100" title="Modifier">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
            </button>
          )}
          <div className={`text-stone-300 group-hover:text-amber-500 transition-all ${isExpanded ? 'rotate-90' : ''}`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="px-4 pb-4 border-t border-stone-100 animate-in slide-in-from-top-2 duration-200">
          <div className="pt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <h4 className="text-xs font-bold text-stone-500 uppercase tracking-widest mb-2">Résumé</h4>
              <p className="text-sm text-stone-600 leading-relaxed">
                {book.summary || "Aucun résumé disponible pour ce livre."}
              </p>
              {book.recommendations && (
                <div className="mt-3">
                  <h4 className="text-xs font-bold text-stone-500 uppercase tracking-widest mb-2">Recommandations</h4>
                  <p className="text-sm text-stone-600 leading-relaxed">{book.recommendations}</p>
                </div>
              )}
            </div>

            <div>
              {bookReviews.length > 0 ? (
                <div>
                  <h4 className="text-xs font-bold text-stone-500 uppercase tracking-widest mb-2">Avis ({bookReviews.length})</h4>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {bookReviews.slice(0, 2).map(review => (
                      <div key={review.id} className="bg-stone-50 p-3 rounded-lg">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs font-bold text-stone-700">{review.member}</span>
                          <span className="text-amber-500 text-xs">{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</span>
                        </div>
                        <p className="text-xs text-stone-500 line-clamp-2">{review.content}</p>
                      </div>
                    ))}
                    {bookReviews.length > 2 && (
                      <p className="text-[10px] text-stone-400 text-center">+ {bookReviews.length - 2} autres avis</p>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-stone-400 italic">Aucun avis pour ce livre.</p>
              )}

              <button
                onClick={(e) => { e.stopPropagation(); onClick(book); }}
                className="w-full mt-3 py-2 bg-amber-600 text-white rounded-lg text-sm font-bold hover:bg-amber-700 transition-colors"
              >
                Voir tous les détails
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookRow;
