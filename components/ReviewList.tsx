
import React, { useState } from 'react';
import { Review, Sentiment } from '../types';
import { analyzeReview } from '../services/geminiService';

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
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent) return;

    setIsAnalyzing(true);
    try {
      const aiAnalysis = await analyzeReview(bookTitle, bookAuthor, newContent);
      
      const review: Review = {
        id: Date.now().toString(),
        bookId,
        member: currentUser,
        rating: newRating,
        content: newContent,
        date: new Date().toLocaleDateString('fr-FR'),
        aiAnalysis
      };

      onAddReview(review);
      setNewContent('');
      setNewRating(5);
      setIsAdding(false);
    } catch (err) {
      console.error(err);
      alert("Une erreur est survenue lors de l'analyse IA. L'avis a quand même été publié.");
    } finally {
      setIsAnalyzing(false);
    }
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
                {[5,4,3,2,1].map(n => <option key={n} value={n}>{n} étoile{n > 1 ? 's' : ''}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1.5 ml-1">Votre avis</label>
            <textarea 
              value={newContent} 
              onChange={(e) => setNewContent(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-amber-500 outline-none h-28 text-sm leading-relaxed"
              placeholder="Qu'avez-vous pensé de cette lecture ? (L'IA analysera votre texte pour extraire un résumé et des mots-clés)"
              required
            />
          </div>
          <button 
            type="submit" 
            disabled={isAnalyzing}
            className={`w-full py-3.5 rounded-xl font-bold text-white transition-all shadow-lg ${isAnalyzing ? 'bg-stone-400 cursor-not-allowed animate-pulse' : 'bg-amber-600 hover:bg-amber-700 active:scale-95'}`}
          >
            {isAnalyzing ? "L'IA analyse votre avis..." : "Publier l'avis"}
          </button>
          <p className="text-[10px] text-stone-400 italic text-center">L'IA de Gemini traitera votre texte pour générer automatiquement les tags et le résumé.</p>
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
            <p className="text-stone-600 text-sm leading-relaxed mb-4">{review.content}</p>
            
            {review.aiAnalysis && (
              <div className="bg-amber-50/40 p-4 rounded-xl border border-amber-100/50">
                <div className="flex items-center gap-2 mb-3">
                  <span className="bg-stone-800 text-white text-[9px] px-2 py-0.5 rounded font-bold uppercase tracking-widest">Analyse IA</span>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                    review.aiAnalysis.sentiment === Sentiment.ENTHUSIASTIC ? 'bg-green-100 text-green-700' :
                    review.aiAnalysis.sentiment === Sentiment.MIXED ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {review.aiAnalysis.sentiment}
                  </span>
                </div>
                <p className="text-xs italic text-stone-700 mb-3 leading-relaxed font-medium">"{review.aiAnalysis.summary}"</p>
                <div className="flex flex-wrap gap-2 mb-3">
                  {review.aiAnalysis.tags.map(tag => (
                    <span key={tag} className="text-[10px] text-stone-500 bg-stone-100/50 px-2 py-0.5 rounded-md font-medium">{tag}</span>
                  ))}
                </div>
                {review.aiAnalysis.recommendations.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-amber-100/50">
                    <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest mb-2">Lectures suggérées</p>
                    <div className="flex flex-col gap-1.5">
                      {review.aiAnalysis.recommendations.map(rec => (
                        <span key={rec} className="text-xs text-amber-800 font-bold">📖 {rec}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReviewList;
