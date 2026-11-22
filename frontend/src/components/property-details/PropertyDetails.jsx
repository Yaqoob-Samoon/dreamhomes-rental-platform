import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api';
import {
  MapPin, Bed, Bath, ArrowLeft, CheckCircle,
  XCircle, MessageSquare, Heart, Building2, Share2,
  Grid, Star, Maximize
} from 'lucide-react';
import { jwtDecode } from 'jwt-decode';
import ChatWindow from '../components/ChatWindow';
import ApplicationModal from '../components/ApplicationModal';

import PropertyDetailsSkeleton from '../components/property-details/PropertyDetailsSkeleton';
import ErrorState from '../components/property-details/ErrorState';
import PropertyDetailsErrorBoundary from '../components/property-details/PropertyDetailsErrorBoundary';
import ImageGalleryModal from '../components/property-details/ImageGalleryModal';
import ReviewsSection from '../components/property-details/ReviewsSection';
import StickyActionCard from '../components/property-details/StickyActionCard';

const PropertyDetailsContent = () => {
  const { id } = useParams();
  const [property, setProperty] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);

  // Modals & Gallery State
  const [showChatModal, setShowChatModal] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Review Form State
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState('');

  const token = localStorage.getItem('token');
  let isTenant = false;
  let currentUserId = null;

  if (token) {
    try {
      const decoded = jwtDecode(token);
      isTenant = decoded.role === 'TENANT';
      currentUserId = decoded.id || decoded.sub;
    } catch (e) {
      console.error("Invalid token");
    }
  }

  const fetchPropertyData = async () => {
    try {
      setLoading(true);
      setError('');
      const [propResponse, reviewsResponse] = await Promise.all([
        api.get(`/properties/${id}`),
        api.get(`/properties/${id}/reviews`)
      ]);

      setProperty(propResponse.data);
      setReviews(reviewsResponse.data);

      if (isTenant) {
        const favResponse = await api.get('/properties/me/favorites');
        const isSaved = favResponse.data.some(p => p.id === parseInt(id));
        setIsFavorite(isSaved);
      }
    } catch (err) {
      setError('Failed to load property details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPropertyData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isTenant]);

  const handleToggleFavorite = async () => {
    if (!isTenant) {
      alert("Please log in as a Tenant to save properties.");
      return;
    }

    // Optimistic UI Update
    const previousState = isFavorite;
    setIsFavorite(!isFavorite);

    try {
      await api.post(`/properties/${id}/favorite`);
    } catch (error) {
      setIsFavorite(previousState);
      alert("Failed to update favorite.");
    }
  };

  const handleContactClick = () => {
    if (!token) {
      alert("Please log in to contact the landlord.");
      return;
    }
    if (property?.landlord_id === currentUserId) {
      alert("You cannot chat with yourself on your own property.");
      return;
    }
    setShowChatModal(true);
  };

  const handleApplyClick = () => {
    if (!token) {
      alert("Please log in to apply for this property.");
      return;
    }
    if (!isTenant) {
      alert("Only tenants can apply for properties.");
      return;
    }
    setShowApplyModal(true);
  };

  const submitReview = async (e) => {
    e.preventDefault();
    if (!reviewForm.comment.trim()) return;
    setSubmittingReview(true);
    setReviewError('');

    try {
      const res = await api.post(`/properties/${id}/reviews`, reviewForm);
      setReviews([res.data, ...reviews]);
      setReviewForm({ rating: 5, comment: '' });
    } catch (err) {
      setReviewError(err.response?.data?.detail || 'Failed to submit review.');
    } finally {
      setSubmittingReview(false);
    }
  };

  const hasReviewed = reviews.some(r => r.tenant_id === currentUserId);
  const averageRating = reviews.length > 0
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : 0;

  if (loading) return <PropertyDetailsSkeleton />;

  if (error) return <ErrorState message={error} onRetry={fetchPropertyData} />;

  if (!property) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-28 lg:pb-24 pt-8 font-sans text-slate-900 bg-white">

      {/* Top Bar */}
      <div className="flex items-center justify-between mb-6">
        <Link to="/properties" className="inline-flex items-center text-slate-500 hover:text-slate-900 font-medium text-sm transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to explore
        </Link>
        <div className="flex items-center gap-4">
          <button className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
            <Share2 className="w-4 h-4" /> Share
          </button>
          <button
            onClick={handleToggleFavorite}
            aria-pressed={isFavorite}
            className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
          >
            <Heart className={`w-4 h-4 transition-colors ${isFavorite ? 'text-red-500 fill-red-500' : ''}`} />
            {isFavorite ? 'Saved' : 'Save'}
          </button>
        </div>
      </div>

      <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-slate-900 mb-6 leading-tight">
        {property.title}
      </h1>

      {/* Gallery */}
      <div className="relative w-full h-[400px] sm:h-[500px] rounded-2xl overflow-hidden mb-12 bg-slate-100 group">
        {property.images && property.images.length > 0 ? (
          <div className="flex h-full gap-2">
            <button
              type="button"
              className={`h-full cursor-pointer relative overflow-hidden ${property.images.length >= 3 ? 'w-full md:w-1/2' : 'w-full'}`}
              onClick={() => { setCurrentImageIndex(0); setShowGallery(true); }}
              aria-label="Open photo gallery"
            >
              <img src={property.images[0].image_url} alt="Main view" className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500" />
              <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors duration-300" />
            </button>

            {property.images.length >= 3 && (
              <div className="hidden md:grid w-1/2 h-full grid-cols-2 grid-rows-2 gap-2">
                {property.images.slice(1, 5).map((img, index) => (
                  <button
                    type="button"
                    key={img.id}
                    className="h-full cursor-pointer relative overflow-hidden"
                    onClick={() => { setCurrentImageIndex(index + 1); setShowGallery(true); }}
                    aria-label={`Open photo gallery, image ${index + 2}`}
                  >
                    <img src={img.image_url} alt={`View ${index + 2}`} className="w-full h-full object-cover hover:scale-[1.05] transition-transform duration-500" />
                    <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors duration-300" />
                  </button>
                ))}
              </div>
            )}

            <button
              onClick={() => { setCurrentImageIndex(0); setShowGallery(true); }}
              className="absolute bottom-5 right-5 bg-white px-4 py-2 rounded-xl font-medium text-slate-900 shadow-sm border border-slate-200 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-900 transition-colors flex items-center gap-2 text-sm z-10"
            >
              <Grid className="w-4 h-4" /> Show all photos
            </button>
          </div>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center">
            <Building2 className="w-12 h-12 text-slate-300 mb-4" strokeWidth={1.5} />
            <span className="text-slate-400 font-medium">No photos provided</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-16">

        {/* LEFT COLUMN: DETAILS */}
        <div className="lg:col-span-2">

          <div className="pb-8 border-b border-slate-200">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <span className="bg-slate-100 text-slate-800 px-3 py-1 rounded-full text-sm font-medium">
                {property.property_type}
              </span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${property.status === 'available' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {property.status === 'available' ? 'Available for Rent' : 'Currently Rented'}
              </span>
              {reviews.length > 0 && (
                <span className="flex items-center gap-1 text-sm font-medium text-slate-700 ml-2">
                  <Star className="w-4 h-4 fill-slate-900 text-slate-900" /> {averageRating} &middot; <span className="underline">{reviews.length} reviews</span>
                </span>
              )}
            </div>
            <div className="text-slate-600 text-lg flex items-center gap-1.5 font-medium">
              <MapPin className="w-5 h-5 text-slate-400" />
              {property.location}, {property.city}
            </div>
          </div>

          <div className="py-8 border-b border-slate-200 flex flex-wrap gap-8 sm:gap-12">
            <div className="flex items-center gap-3">
              <Bed className="w-6 h-6 text-slate-400" strokeWidth={1.5} />
              <p className="font-semibold text-slate-900">{property.bedrooms} bedrooms</p>
            </div>
            <div className="flex items-center gap-3">
              <Bath className="w-6 h-6 text-slate-400" strokeWidth={1.5} />
              <p className="font-semibold text-slate-900">{property.bathrooms} bathrooms</p>
            </div>
            <div className="flex items-center gap-3">
              <Maximize className="w-6 h-6 text-slate-400" strokeWidth={1.5} />
              <p className="font-semibold text-slate-900">{property.area} sqft</p>
            </div>
          </div>

          <div className="py-8 border-b border-slate-200">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">About this space</h2>
            <p className="text-slate-600 leading-relaxed text-[15px] whitespace-pre-line">
              {property.description}
            </p>
          </div>

          <div className="py-8 border-b border-slate-200">
            <h2 className="text-xl font-semibold text-slate-900 mb-6">What this place offers</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8">
              <div className="flex items-center gap-4 text-slate-700">
                {property.parking ? <CheckCircle className="w-6 h-6 text-slate-900" strokeWidth={1.5} /> : <XCircle className="w-6 h-6 text-slate-300" strokeWidth={1.5} />}
                <span className={!property.parking ? "text-slate-400 line-through decoration-slate-300" : ""}>Dedicated Parking</span>
              </div>
              <div className="flex items-center gap-4 text-slate-700">
                {property.furnished ? <CheckCircle className="w-6 h-6 text-slate-900" strokeWidth={1.5} /> : <XCircle className="w-6 h-6 text-slate-300" strokeWidth={1.5} />}
                <span className={!property.furnished ? "text-slate-400 line-through decoration-slate-300" : ""}>Fully Furnished</span>
              </div>
            </div>
          </div>

          <ReviewsSection
            reviews={reviews}
            averageRating={averageRating}
            isTenant={isTenant}
            hasReviewed={hasReviewed}
            propertyStatus={property.status}
            reviewForm={reviewForm}
            setReviewForm={setReviewForm}
            submitReview={submitReview}
            submittingReview={submittingReview}
            reviewError={reviewError}
          />
        </div>

        {/* RIGHT COLUMN: STICKY ACTION CARD (desktop sidebar + mobile fixed bar) */}
        <StickyActionCard
          property={property}
          onApply={handleApplyClick}
          onContact={handleContactClick}
        />
      </div>

      {/* MODALS */}
      {showChatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-lg w-full h-[600px] max-h-[85vh] shadow-2xl relative overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setShowChatModal(false)}
              aria-label="Close chat"
              className="absolute top-4 right-4 z-20 bg-white/50 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-900 p-2 rounded-full text-slate-700 transition-colors"
            >
              &times;
            </button>
            <ChatWindow receiverId={property.landlord_id} propertyId={property.id} receiverName="Landlord" />
          </div>
        </div>
      )}

      <ApplicationModal isOpen={showApplyModal} onClose={() => setShowApplyModal(false)} propertyId={property.id} propertyTitle={property.title} />

      {showGallery && property.images && property.images.length > 0 && (
        <ImageGalleryModal
          images={property.images}
          currentIndex={currentImageIndex}
          setCurrentIndex={setCurrentImageIndex}
          onClose={() => setShowGallery(false)}
        />
      )}
    </div>
  );
};

const PropertyDetails = () => (
  <PropertyDetailsErrorBoundary>
    <PropertyDetailsContent />
  </PropertyDetailsErrorBoundary>
);

export default PropertyDetails;
