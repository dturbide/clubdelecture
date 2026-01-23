
import React from 'react';
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
  const bookReviews = reviews.filter(r => r.bookId === book.id);
  const avgRating = bookReviews.length
    ? (bookReviews.reduce((sum, r) => sum + r.rating, 0) / bookReviews.length).toFixed(1)
    : "N/A";

  return (
    <div
      onClick={() => onClick(book)}
      className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-all cursor-pointer border border-stone-100 flex items-center p-3 group"
    >
      <div className="w-16 h-24 flex-shrink-0 overflow-hidden rounded-lg bg-stone-200 mr-4">
        <img
          src={book.coverUrl || DEFAULT_COVER}
          alt={book.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_COVER; }}
        />
      </div>
      <div className="flex-grow grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
        <div className="md:col-span-2">
          <h3 className="font-serif text-lg font-bold text-stone-800 leading-tight group-hover:text-amber-600 transition-colors">{book.title}</h3>
          <p className="text-sm text-stone-500 italic">{book.author}</p>
        </div>
        <div className="hidden md:block">
          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest block mb-1">Détails</span>
          <p className="text-xs font-medium text-stone-600">{book.genre}</p>
          <p className="text-[10px] text-stone-400 italic">Par {book.addedBy}</p>
        </div>
        <div className="flex items-center justify-between md:justify-end gap-6 text-center">
          <div>
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest block mb-1">Avis</span>
            <div className="bg-stone-50 px-2 py-1 rounded-lg text-sm font-bold">⭐ {avgRating}</div>
          </div>
        </div>
      </div>
      <div className="ml-4 flex items-center gap-3">
        {currentUser === book.addedBy && (
          <button onClick={(e) => { e.stopPropagation(); onEdit(book); }} className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-all opacity-0 group-hover:opacity-100" title="Modifier">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
          </button>
        )}
        <div className="text-stone-300 group-hover:text-amber-500 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
        </div>
      </div>
    </div>
  );
};

export default BookRow;
