import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { MapPin, Heart, Loader2, ImageOff, Bed, Bath } from 'lucide-react';

// ---- Formatting helpers (Same as Home.jsx) ----
function formatRentPKR(amount) {
  const n = Number(amount);
  if (amount === null || amount === undefined || Number.isNaN(n)) return null;
  return `PKR ${n.toLocaleString()} / mo`;
}

function getPropertyTypeLabel(type) {
  if (!type || typeof type !== 'string' || type.trim() === '') return 'Property';
  return type;
}

function getValidLocation(location, city) {
  const parts = [location, city].filter(v => typeof v === 'string' && v.trim() !== '');
  return parts.length > 0 ? parts.join(', ') : null;
}

function getValidCount(value) {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : null;
}
// ----------------------------------------------

const Favorites = () => {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    try {
      const response = await api.get('/properties/me/favorites');
      setFavorites(response.data);
    } catch (err) {
      setError('Failed to load your favorite properties.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFavorite = async (e, id) => {
    e.preventDefault(); 
    e.stopPropagation();
    try {
      await api.post(`/properties/${id}/favorite`);
      // Fauran UI se remove karein (Optimistic UI update)
      setFavorites(favorites.filter(p => p.id !== id));
    } catch (err) {
      alert("Failed to update favorites.");
      console.error(err);
    }
  };

  return (
    <div className="font-sans text-slate-900 bg-gray-50 min-h-screen pb-16">
      <div className="max-w-6xl mx-auto px-6 pt-12">
        
        {/* HEADER */}
        <div className="mb-10">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
            Saved properties
          </h1>
          <p className="mt-2 text-slate-500">
            Your personalized wishlist of homes and commercial spaces.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 border border-red-100 font-medium text-sm">
            {error}
          </div>
        )}

        {/* LOADING STATE */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="bg-white border border-gray-200 rounded-2xl overflow-hidden animate-pulse">
                <div className="aspect-[4/3] bg-gray-100" />
                <div className="p-5">
                  <div className="h-4 bg-gray-100 rounded w-2/3 mb-2" />
                  <div className="h-3 bg-gray-100 rounded w-1/2 mb-4" />
                  <div className="h-4 bg-gray-100 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : favorites.length === 0 ? (
          
          /* EMPTY STATE */
          <div className="text-center py-24 border border-dashed border-gray-200 rounded-2xl bg-white">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-5">
              <Heart className="w-6 h-6 text-slate-300" strokeWidth={1.75} />
            </div>
            <p className="text-lg font-medium text-slate-900 mb-2">No saved properties yet</p>
            <p className="text-slate-500 mb-6">Explore listings and click the heart icon to save them here.</p>
            <Link 
              to="/" 
              className="text-sm font-medium text-blue-600 hover:text-blue-700 underline underline-offset-4 decoration-blue-200 hover:decoration-blue-600 transition-colors"
            >
              Explore properties
            </Link>
          </div>
        ) : (
          
          /* GRID OF FAVORITES */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {favorites.map((property) => {
              const price = formatRentPKR(property.rent);
              const location = getValidLocation(property.location, property.city);
              const bedrooms = getValidCount(property.bedrooms);
              const bathrooms = getValidCount(property.bathrooms);
              const hasImage = property.images && property.images.length > 0;

              return (
                <Link
                  key={property.id}
                  to={`/property/${property.id}`}
                  className="group block bg-white border border-gray-200 rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(15,23,42,0.08)] hover:border-gray-300 relative"
                >
                  <div className="relative aspect-[4/3] bg-gray-50 overflow-hidden">
                    {hasImage ? (
                      <img
                        src={property.images[0].image_url}
                        alt={property.title || 'Property'}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-slate-300">
                        <ImageOff className="w-8 h-8 mb-2" strokeWidth={1.5} />
                      </div>
                    )}

                    {/* Property Type Badge */}
                    <div className="absolute top-3 left-3">
                      <span className="bg-white/90 backdrop-blur-md text-slate-900 text-xs font-medium px-2.5 py-1 rounded-full">
                        {getPropertyTypeLabel(property.property_type)}
                      </span>
                    </div>

                    {/* Remove Favorite Button */}
                    <button
                      type="button"
                      onClick={(e) => handleToggleFavorite(e, property.id)}
                      title="Remove from wishlist"
                      className="absolute top-3 right-3 flex items-center justify-center w-8 h-8 rounded-full bg-white/90 backdrop-blur-md text-slate-500 hover:bg-red-50 transition-colors"
                    >
                      <Heart className="w-4 h-4 text-red-500 fill-red-500" strokeWidth={1.75} />
                    </button>
                  </div>

                  <div className="p-5">
                    <h3 className="font-medium text-[15px] text-slate-900 truncate">
                      {property.title}
                    </h3>
                    
                    {location && (
                      <p className="text-slate-500 text-sm mt-1 flex items-center gap-1.5 truncate">
                        <MapPin className="w-3.5 h-3.5 shrink-0" strokeWidth={1.75} />
                        {location}
                      </p>
                    )}

                    {price && (
                      <p className="mt-3 text-lg font-semibold text-slate-900">
                        {price}
                      </p>
                    )}

                    {(bedrooms !== null || bathrooms !== null) && (
                      <div className="mt-3 flex items-center gap-4 text-sm text-slate-500 pt-3 border-t border-gray-100">
                        {bedrooms !== null && (
                          <span className="flex items-center gap-1.5">
                            <Bed className="w-3.5 h-3.5" strokeWidth={1.75} /> {bedrooms}
                          </span>
                        )}
                        {bathrooms !== null && (
                          <span className="flex items-center gap-1.5">
                            <Bath className="w-3.5 h-3.5" strokeWidth={1.75} /> {bathrooms}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Favorites;