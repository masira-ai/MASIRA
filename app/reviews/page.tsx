'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/auth-context';

interface Review {
  id: string;
  reviewer_name: string;
  reviewer_email: string;
  rating: number;
  content: string;
  source: string | null;
  status: string;
  created_at: string;
}

interface ReviewReply {
  id: string;
  reply_content: string;
  created_at: string;
}

export default function ReviewsPage() {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [reply, setReply] = useState<ReviewReply | null>(null);
  const [replyText, setReplyText] = useState('');
  const [loading, setLoading] = useState(true);
  const [companyId, setCompanyId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchReviews() {
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .maybeSingle();

      if (!profile || !(profile as any).company_id) {
        setLoading(false);
        return;
      }

      const cid = (profile as any).company_id;
      setCompanyId(cid);

      const { data } = await supabase
        .from('reviews')
        .select('*')
        .eq('company_id', cid)
        .order('created_at', { ascending: false });

      if (data) {
        setReviews(data as Review[]);
      }

      setLoading(false);
    }

    fetchReviews();
  }, [user]);

  const fetchReply = async (reviewId: string) => {
    if (!companyId) return;

    const { data } = await supabase
      .from('review_replies')
      .select('*')
      .eq('review_id', reviewId)
      .eq('company_id', companyId)
      .maybeSingle();

    setReply(data as ReviewReply);
  };

  const handleSelectReview = async (review: Review) => {
    setSelectedReview(review);
    setReplyText('');
    await fetchReply(review.id);
  };

  const submitReply = async () => {
    if (!selectedReview || !companyId || !replyText.trim()) return;

    const { data } = await supabase
      .from('review_replies')
      .insert({
        review_id: selectedReview.id,
        company_id: companyId,
        reply_content: replyText,
      })
      .select()
      .single();

    if (data) {
      setReply(data as ReviewReply);
      setReplyText('');
    }
  };

  const renderStars = (rating: number) => {
    return '⭐'.repeat(rating) + '☆'.repeat(5 - rating);
  };

  const getAverageRating = () => {
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    return (sum / reviews.length).toFixed(1);
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-slate-600">Laden...</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      <div className="p-8 border-b border-slate-200 bg-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Bewertungen</h1>
            <p className="text-slate-600 mt-2">Verwalten Sie Ihre Kundenbewertungen</p>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold text-slate-900">{getAverageRating()}</div>
            <div className="text-2xl">{'⭐'.repeat(Math.round(Number(getAverageRating())))}</div>
            <div className="text-sm text-slate-600 mt-1">{reviews.length} Bewertungen</div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-1/3 border-r border-slate-200 bg-white overflow-y-auto">
          {reviews.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              Keine Bewertungen vorhanden
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {reviews.map((review) => (
                <div
                  key={review.id}
                  onClick={() => handleSelectReview(review)}
                  className={`p-6 cursor-pointer hover:bg-slate-50 transition-colors ${
                    selectedReview?.id === review.id ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-slate-900">{review.reviewer_name}</h3>
                    <span className={`px-2 py-1 text-xs font-medium rounded ${
                      review.status === 'published'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {review.status === 'published' ? 'Veröffentlicht' : 'Ausstehend'}
                    </span>
                  </div>
                  <div className="text-lg mb-2">{renderStars(review.rating)}</div>
                  <p className="text-sm text-slate-600 line-clamp-2">{review.content}</p>
                  <p className="text-xs text-slate-500 mt-2">
                    {new Date(review.created_at).toLocaleDateString('de-DE')}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1 bg-slate-50 overflow-y-auto">
          {selectedReview ? (
            <div className="p-8">
              <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200 mb-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">{selectedReview.reviewer_name}</h2>
                    <p className="text-slate-600">{selectedReview.reviewer_email}</p>
                  </div>
                  {selectedReview.source && (
                    <span className="px-3 py-1 bg-slate-100 text-slate-700 text-sm font-medium rounded">
                      {selectedReview.source}
                    </span>
                  )}
                </div>

                <div className="text-3xl mb-4">{renderStars(selectedReview.rating)}</div>

                <div className="prose max-w-none mb-4">
                  <p className="text-slate-700">{selectedReview.content}</p>
                </div>

                <div className="text-sm text-slate-500">
                  {new Date(selectedReview.created_at).toLocaleString('de-DE')}
                </div>
              </div>

              {reply ? (
                <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
                  <h3 className="text-lg font-bold text-slate-900 mb-4">Ihre Antwort</h3>
                  <p className="text-slate-700 mb-2">{reply.reply_content}</p>
                  <p className="text-sm text-slate-500">
                    Gesendet am {new Date(reply.created_at).toLocaleString('de-DE')}
                  </p>
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
                  <h3 className="text-lg font-bold text-slate-900 mb-4">Auf diese Bewertung antworten</h3>
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
                    rows={6}
                    placeholder="Schreiben Sie Ihre Antwort..."
                  />
                  <button
                    onClick={submitReply}
                    disabled={!replyText.trim()}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                  >
                    Antwort senden
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-500">
              Wählen Sie eine Bewertung aus
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
