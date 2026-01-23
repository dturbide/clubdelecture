
import React, { useState } from 'react';
import { Review } from '../types';

interface ReviewListProps {
  bookTitle: string;
  bookAuthor: string;
  bookId: string;
  currentUser: string;
  reviews: Review[];
  onAddReview: (review: Review) => void;
}

const ReviewList: React.FC<ReviewListProps> = ({ bookTitle, bookAuthor, bookId, currentUser, reviews, onAddReview }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newContent, setNewContent] = useState('');
  const [newRating, setNewRating] = useState(5);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent) return;

    const review: Review = {
      id: Date.now().toString(),
      bookId,
      member: currentUser,
      rating: newRating,
      content: newContent,
      date: new Date().toLocaleDateString('fr-FR')
    };

    onAddReview(review);
    setNewContent('');
    setNewRating(5);
    setIsAdding(false);
  };

  return (
    <div className="space-y-6 mt-6 border-t border-stone-100 pt-6">
      <div className="flex justify-between items-center">
        <h4 className="font-serif text-xl font-bold text-stone-800">Avis des membres ({reviews.length})</h4>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="text-amber-600 hover:text-amber-700 text-sm font-bold flex items-center gap-1"
        >
          {isAdding ? "Annuler" : "+ Ajouter un avis"}
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleSubmit} className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-4">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-grow">
              <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1.5 ml-1">Publier en tant que</label>
              <div className="px-4 py-2 bg-white border border-stone-200 rounded-xl text-sm font-bold text-stone-800 flex items-center gap-2">
                <span className="text-stone-400">👤</span> {currentUser}
              </div>
            </div>
            <div className="w-full md:w-48">
              <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1.5 ml-1">Note</label>
              <select
                value={newRating}
                onChange={(e) => setNewRating(parseInt(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-stone-200 focus:ring-2 focus:ring-amber-500 outline-none text-sm appearance-none cursor-pointer"
              >
                {[5, 4, 3, 2, 1].map(n => <option key={n} value={n}>{n} étoile{n > 1 ? 's' : ''}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1.5 ml-1">Votre avis</label>
            <textarea
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-amber-500 outline-none h-28 text-sm leading-relaxed"
              placeholder="Qu'avez-vous pensé de cette lecture ?"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full py-3.5 rounded-xl font-bold text-white transition-all shadow-lg bg-amber-600 hover:bg-amber-700 active:scale-95"
          >
            Publier l'avis
          </button>
        </form>
      )}

      <div className="space-y-4">
        {reviews.length === 0 && !isAdding && (
          <p className="text-stone-400 italic text-center py-8 bg-stone-50/50 rounded-2xl border border-dashed border-stone-200">Aucun avis pour le moment. Soyez le premier !</p>
        )}

        {reviews.slice().reverse().map(review => (
          <div key={review.id} className="bg-white p-5 rounded-2xl border border-stone-100 shadow-sm hover:shadow-md transition-shadow duration-300">
            <div className="flex justify-between items-start mb-3">
              <div>
                <span className="font-bold text-stone-800">{review.member}</span>
                <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider ml-3">{review.date}</span>
              </div>
              <div className="flex text-amber-400 text-sm">
                {"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}
              </div>
            </div>
            <p className="text-stone-600 text-sm leading-relaxed">{review.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReviewList;
