import { Star, Send, Loader2 } from 'lucide-react';

const StarRow = ({ rating, interactive = false, onChange }) => (
  <div className="flex gap-0.5">
    {[...Array(5)].map((_, i) => (
      <Star
        key={i}
        onClick={() => interactive && onChange?.(i + 1)}
        role={interactive ? 'button' : undefined}
        aria-label={interactive ? `Rate ${i + 1} star${i === 0 ? '' : 's'}` : undefined}
        tabIndex={interactive ? 0 : undefined}
        onKeyDown={(e) => {
          if (interactive && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            onChange?.(i + 1);
          }
        }}
        className={`w-5 h-5 ${
          interactive
            ? 'cursor-pointer transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-slate-900 rounded-sm'
            : ''
        } ${i < rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-100'}`}
      />
    ))}
  </div>
);

// Custom empty-state illustration — a simple speech-bubble/star mark,
// no external asset needed.
const NoReviewsIllustration = () => (
  <svg
    width="88"
    height="88"
    viewBox="0 0 88 88"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <circle cx="44" cy="44" r="42" className="fill-slate-50" />
    <path
      d="M24 30 H64 A6 6 0 0 1 70 36 V54 A6 6 0 0 1 64 60 H38 L28 68 V60 H24 A6 6 0 0 1 18 54 V36 A6 6 0 0 1 24 30 Z"
      className="fill-white stroke-slate-300"
      strokeWidth="2.5"
    />
    <path
      d="M44 39 L46.2 43.9 L51.5 44.6 L47.7 48.2 L48.7 53.5 L44 50.9 L39.3 53.5 L40.3 48.2 L36.5 44.6 L41.8 43.9 Z"
      className="fill-slate-200"
    />
  </svg>
);

const ReviewsSection = ({
  reviews,
  averageRating,
  isTenant,
  hasReviewed,
  propertyStatus,
  reviewForm,
  setReviewForm,
  submitReview,
  submittingReview,
  reviewError,
}) => {
  const canReview = isTenant && !hasReviewed && propertyStatus === 'rented';

  return (
    <div className="py-8">
      <h2 className="text-xl font-semibold text-slate-900 mb-8 flex items-center gap-2">
        <Star className="w-5 h-5 fill-slate-900 text-slate-900" />
        {reviews.length > 0 ? `${averageRating} \u00b7 ${reviews.length} reviews` : 'No reviews yet'}
      </h2>

      {canReview && (
        <form
          onSubmit={submitReview}
          className="mb-10 p-6 bg-slate-50 rounded-2xl border border-slate-200/60"
        >
          <h4 className="font-semibold text-slate-900 mb-2">Rate your experience</h4>
          <div className="mb-4">
            <StarRow
              rating={reviewForm.rating}
              interactive
              onChange={(rating) => setReviewForm({ ...reviewForm, rating })}
            />
          </div>
          <label htmlFor="review-comment" className="sr-only">
            Your review
          </label>
          <textarea
            id="review-comment"
            required
            rows="3"
            value={reviewForm.comment}
            onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
            placeholder="Tell others about your experience renting this property..."
            className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none transition-shadow resize-none mb-4 text-[15px]"
          />
          {reviewError && (
            <p className="text-red-600 text-sm mb-4 font-medium">{reviewError}</p>
          )}
          <button
            type="submit"
            disabled={submittingReview}
            className="bg-slate-900 text-white px-6 py-2.5 rounded-xl font-medium text-sm hover:bg-slate-800 transition-colors flex items-center gap-2 disabled:opacity-70"
          >
            {submittingReview ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            Post Review
          </button>
        </form>
      )}

      {reviews.length === 0 ? (
        <div className="flex flex-col items-center text-center py-10">
          <NoReviewsIllustration />
          <p className="mt-4 text-slate-500 text-[15px] max-w-xs">
            {canReview
              ? 'Be the first to share how your stay went.'
              : 'This property doesn\u2019t have any reviews yet.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {reviews.map((review) => (
            <div key={review.id} className="flex flex-col">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-semibold text-slate-600 shrink-0">
                  {(review.tenant?.name || 'T')[0].toUpperCase()}
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 text-[15px]">
                    {review.tenant?.name || 'Verified Tenant'}
                  </h4>
                  <p className="text-xs text-slate-500">
                    {new Date(review.created_at).toLocaleDateString(undefined, {
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              </div>
              <StarRow rating={review.rating} />
              <p className="text-slate-700 text-[15px] leading-relaxed line-clamp-4 mt-2">
                {review.comment}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReviewsSection;