
import React, { useState } from 'react';
import { Book, Review } from '../types';

const DEFAULT_COVER = "https://images.unsplash.com/photo-1541963463532-d68292c34b19?q=80&w=400&auto=format&fit=crop";

interface BookCardProps {
  book: Book;
  currentUser: string;
  reviews: Review[];
  onClick: (book: Book) => void;
  onEdit: (book: Book) => void;
}

const BookCard: React.FC<BookCardProps> = ({ book, currentUser, reviews, onClick, onEdit }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const bookReviews = reviews.filter(r => r.bookId === book.id);
  const isOwner = currentUser.trim().toLowerCase() === (book.addedBy || '').trim().toLowerCase();
  const avgRating = bookReviews.length
    ? (bookReviews.reduce((sum, r) => sum + r.rating, 0) / bookReviews.length).toFixed(1)
    : "N/A";

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-all border border-stone-100 group flex flex-col relative">
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="cursor-pointer"
      >
        <div className="relative aspect-[2/3] overflow-hidden bg-stone-200">
          <img
            src={book.coverUrl || DEFAULT_COVER}
            alt={book.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_COVER; }}
          />
          <div className="absolute top-2 right-2 flex flex-col gap-2 items-end">
            <div className="bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg text-xs font-bold shadow-sm">⭐ {avgRating}</div>
            {isOwner && (
              <button
                onClick={(e) => { e.stopPropagation(); onEdit(book); }}
                className="w-8 h-8 bg-amber-600 text-white rounded-full shadow-md flex items-center justify-center hover:scale-110 transition-all opacity-0 group-hover:opacity-100"
                title="Modifier"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
              </button>
            )}
          </div>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2">
            <div className={`bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold shadow-sm transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
              ▼
            </div>
          </div>
        </div>
        <div className="p-4 flex flex-col">
          <div className="mb-2">
            <span className="text-[10px] uppercase tracking-widest text-stone-400 font-bold">{book.genre}</span>
            <h3 className="font-serif text-lg font-bold text-stone-800 leading-tight mb-1">{book.title}</h3>
            <p className="text-sm text-stone-500 italic">{book.author}</p>
          </div>
          <div className="pt-3 border-t border-stone-50 flex justify-between items-center">
            <p className="text-[9px] text-stone-400 italic">Par {book.addedBy}</p>
            <p className="text-[9px] text-stone-400">{bookReviews.length} avis</p>
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="px-4 pb-4 border-t border-stone-100 animate-in slide-in-from-top-2 duration-200">
          <div className="pt-4 space-y-4">
            <div>
              <h4 className="text-xs font-bold text-stone-500 uppercase tracking-widest mb-2">Résumé</h4>
              <p className="text-sm text-stone-600 leading-relaxed">
                {book.summary || "Aucun résumé disponible pour ce livre."}
              </p>
            </div>

            {book.recommendations && (
              <div>
                <h4 className="text-xs font-bold text-stone-500 uppercase tracking-widest mb-2">Recommandations</h4>
                <p className="text-sm text-stone-600 leading-relaxed">{book.recommendations}</p>
              </div>
            )}

            {bookReviews.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-stone-500 uppercase tracking-widest mb-2">Avis ({bookReviews.length})</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {bookReviews.slice(0, 3).map(review => (
                    <div key={review.id} className="bg-stone-50 p-3 rounded-lg">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-bold text-stone-700">{review.member}</span>
                        <span className="text-amber-500 text-xs">{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</span>
                      </div>
                      <p className="text-xs text-stone-500 line-clamp-2">{review.content}</p>
                    </div>
                  ))}
                  {bookReviews.length > 3 && (
                    <p className="text-[10px] text-stone-400 text-center">+ {bookReviews.length - 3} autres avis</p>
                  )}
                </div>
              </div>
            )}

            <button
              onClick={(e) => { e.stopPropagation(); onClick(book); }}
              className="w-full py-2 bg-amber-600 text-white rounded-lg text-sm font-bold hover:bg-amber-700 transition-colors"
            >
              Voir tous les détails
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookCard;
