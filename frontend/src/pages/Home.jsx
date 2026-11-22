import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import {
  MapPin, Bed, Bath, Search, Heart, Star, Building2,
  ShieldCheck, FileCheck2, Users, ImageOff, Images
} from 'lucide-react';

const QUICK_CITIES = ['Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Hyderabad'];

const PROPERTY_TYPES = ['Apartment', 'House', 'Villa', 'Studio', 'Room'];

const TRUST_POINTS = [
  { icon: ShieldCheck, label: 'Verified listings' },
  { icon: FileCheck2, label: 'Transparent rental information' },
  { icon: Users, label: 'Connect directly with property owners' },
];

// ---- Formatting / data-integrity helpers -------------------------------
function formatRentPKR(amount) {
  const n = Number(amount);
  if (amount === null || amount === undefined || Number.isNaN(n)) return null;
  return `PKR ${n.toLocaleString()} / month`;
}

function getPropertyTypeLabel(type) {
  if (!type || typeof type !== 'string' || type.trim() === '') return 'Property';
  return type;
}

function getValidCount(value) {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

function getValidLocation(location, city) {
  const parts = [location, city].filter(
    (v) => typeof v === 'string' && v.trim() !== ''
  );
  return parts.length > 0 ? parts.join(', ') : null;
}

function getValidRating(rating) {
  const n = Number(rating);
  return Number.isFinite(n) && n > 0 ? n.toFixed(1) : null;
}
// -------------------------------------------------------------------------

const Home = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [favoriteIds, setFavoriteIds] = useState([]); // ✅ Favorite IDs state

  const [filters, setFilters] = useState({
    city: '',
    bedrooms: '',
    propertyType: '',
    minRent: '',
    maxRent: ''
  });

  const fetchProperties = async (searchFilters = filters) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchFilters.city) params.append('city', searchFilters.city);
      if (searchFilters.bedrooms) params.append('bedrooms', searchFilters.bedrooms);
      if (searchFilters.propertyType) params.append('property_type', searchFilters.propertyType);
      if (searchFilters.minRent) params.append('min_rent', searchFilters.minRent);
      if (searchFilters.maxRent) params.append('max_rent', searchFilters.maxRent);

      const response = await api.get(`/properties/?${params.toString()}`);
      setProperties(response.data);
    } catch (error) {
      console.error("Error fetching properties:", error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Backend se pehle se liked properties fetch karne ka function
  const fetchUserFavorites = async () => {
    try {
      const response = await api.get('/properties/me/favorites');
      const ids = response.data.map(p => p.id);
      setFavoriteIds(ids);
    } catch (err) {
      console.error("Failed to load favorites", err);
    }
  };

  useEffect(() => {
    fetchProperties();
    fetchUserFavorites(); // ✅ Page load par favorites check karega
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchProperties(filters);
  };

  const handleQuickCity = (city) => {
    const nextFilters = { ...filters, city: filters.city === city ? '' : city };
    setFilters(nextFilters);
    fetchProperties(nextFilters);
  };

  const handleClearFilters = () => {
    const cleared = { city: '', bedrooms: '', propertyType: '', minRent: '', maxRent: '' };
    setFilters(cleared);
    fetchProperties(cleared);
  };

  // ✅ Optimistic UI update ke sath Toggle Logic
  const handleFavorite = async (e, propertyId) => {
    e.preventDefault();
    e.stopPropagation();
    
    const isCurrentlyFav = favoriteIds.includes(propertyId);
    
    // API call se pehle hi UI update karein taake fast experience mile
    if (isCurrentlyFav) {
      setFavoriteIds(prev => prev.filter(id => id !== propertyId));
    } else {
      setFavoriteIds(prev => [...prev, propertyId]);
    }

    try {
      await api.post(`/properties/${propertyId}/favorite`);
    } catch (err) {
      console.error("Failed to favorite property:", err);
      // Agar error aaye toh purani state par wapas le ayen
      if (isCurrentlyFav) {
        setFavoriteIds(prev => [...prev, propertyId]);
      } else {
        setFavoriteIds(prev => prev.filter(id => id !== propertyId));
      }
      if (err.response && err.response.status === 401) {
        alert("Please login to save properties.");
      }
    }
  };

  return (
    <div className="font-sans text-slate-900 bg-gray-50">

      {/* HERO */}
      <section className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 pt-20 pb-14">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-5xl font-semibold tracking-tight leading-[1.1] text-slate-900">
              Find a place that feels like home
            </h1>
            <p className="mt-4 text-lg text-slate-500 leading-relaxed">
              Discover rental properties across Pakistan's major cities, with clear
              pricing and verified details on every listing.
            </p>
          </div>

          {/* Premium search component */}
          <form
            onSubmit={handleSearch}
            className="mt-10 bg-white border border-gray-200 rounded-2xl shadow-[0_1px_3px_rgba(15,23,42,0.06)] p-1.5"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 divide-y sm:divide-y-0 divide-gray-100 lg:divide-x">
              <div className="flex items-center gap-3 px-5 py-3.5">
                <MapPin className="w-4 h-4 text-slate-400 shrink-0" strokeWidth={1.75} />
                <input
                  type="text"
                  placeholder="City or area"
                  className="w-full focus:outline-none text-slate-900 placeholder-slate-400 bg-transparent text-[15px]"
                  value={filters.city}
                  onChange={(e) => setFilters({ ...filters, city: e.target.value })}
                />
              </div>

              <div className="flex items-center gap-3 px-5 py-3.5">
                <Building2 className="w-4 h-4 text-slate-400 shrink-0" strokeWidth={1.75} />
                <select
                  className="w-full focus:outline-none text-slate-900 bg-transparent cursor-pointer text-[15px] appearance-none"
                  value={filters.propertyType}
                  onChange={(e) => setFilters({ ...filters, propertyType: e.target.value })}
                >
                  <option value="">Property type</option>
                  {PROPERTY_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-3 px-5 py-3.5">
                <Bed className="w-4 h-4 text-slate-400 shrink-0" strokeWidth={1.75} />
                <select
                  className="w-full focus:outline-none text-slate-900 bg-transparent cursor-pointer text-[15px] appearance-none"
                  value={filters.bedrooms}
                  onChange={(e) => setFilters({ ...filters, bedrooms: e.target.value })}
                >
                  <option value="">Any bedrooms</option>
                  <option value="1">1 bedroom</option>
                  <option value="2">2 bedrooms</option>
                  <option value="3">3 bedrooms</option>
                  <option value="4">4+ bedrooms</option>
                </select>
              </div>

              <div className="flex items-center gap-2 px-5 py-3.5">
                <span className="text-slate-400 text-[15px] shrink-0">PKR</span>
                <input
                  type="number"
                  min="0"
                  placeholder="Min"
                  className="w-full focus:outline-none text-slate-900 placeholder-slate-400 bg-transparent text-[15px]"
                  value={filters.minRent}
                  onChange={(e) => setFilters({ ...filters, minRent: e.target.value })}
                />
                <span className="text-slate-300">–</span>
                <input
                  type="number"
                  min="0"
                  placeholder="Max"
                  className="w-full focus:outline-none text-slate-900 placeholder-slate-400 bg-transparent text-[15px]"
                  value={filters.maxRent}
                  onChange={(e) => setFilters({ ...filters, maxRent: e.target.value })}
                />
              </div>

              <button
                type="submit"
                className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3.5 text-[15px] font-medium transition-colors rounded-xl m-0.5"
              >
                <Search className="w-4 h-4" strokeWidth={1.75} />
                Search
              </button>
            </div>
          </form>

          {/* Quick cities */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-6 text-sm">
            {QUICK_CITIES.map((city) => (
              <button
                key={city}
                type="button"
                onClick={() => handleQuickCity(city)}
                className={`transition-colors ${
                  filters.city === city
                    ? 'text-blue-600 font-medium'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {city}
              </button>
            ))}
          </div>

          {/* Trust / value section */}
          <div className="mt-10 pt-8 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-3 gap-6">
            {TRUST_POINTS.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-blue-600" strokeWidth={1.75} />
                </div>
                <span className="text-sm text-slate-600">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* LISTINGS */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="flex items-baseline justify-between mb-10">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Available properties</h2>
          {!loading && (
            <span className="text-sm text-slate-400">
              {properties.length} {properties.length === 1 ? 'listing' : 'listings'}
            </span>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="bg-white border border-gray-200 rounded-2xl overflow-hidden animate-pulse">
                <div className="relative aspect-[4/3] bg-gray-100">
                  <div className="absolute top-3 left-3 h-5 w-16 bg-gray-200 rounded-full" />
                  <div className="absolute top-3 right-3 h-8 w-8 bg-gray-200 rounded-full" />
                </div>
                <div className="p-5">
                  <div className="h-4 bg-gray-100 rounded w-2/3 mb-2" />
                  <div className="h-3 bg-gray-100 rounded w-1/2 mb-4" />
                  <div className="h-4 bg-gray-100 rounded w-1/3 mb-4" />
                  <div className="h-3 bg-gray-100 rounded w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : properties.length === 0 ? (
          <div className="text-center py-24 border border-dashed border-gray-200 rounded-2xl">
            <p className="text-lg font-medium text-slate-900 mb-2">No properties found</p>
            <p className="text-slate-500 mb-6">Try changing your filters or search in another area.</p>
            <button
              onClick={handleClearFilters}
              className="text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((property) => {
              const price = formatRentPKR(property.rent);
              const location = getValidLocation(property.location, property.city);
              const rating = getValidRating(property.rating);
              const bedrooms = getValidCount(property.bedrooms);
              const bathrooms = getValidCount(property.bathrooms);
              const area = getValidCount(property.area);
              const imageCount = Array.isArray(property.images) ? property.images.length : 0;
              const hasImage = imageCount > 0 && property.images[0]?.image_url;

              return (
                <Link
                  key={property.id}
                  to={`/property/${property.id}`}
                  className="group block bg-white border border-gray-200 rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(15,23,42,0.08)] hover:border-gray-300"
                >
                  <div className="relative aspect-[4/3] bg-gray-50 overflow-hidden">
                    {hasImage ? (
                      <img
                        src={property.images[0].image_url}
                        alt={property.title || 'Property photo'}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-slate-300">
                        <ImageOff className="w-8 h-8 mb-2" strokeWidth={1.5} />
                        <span className="text-xs font-medium text-slate-400">No image available</span>
                      </div>
                    )}

                    {/* Top-left badges */}
                    <div className="absolute top-3 left-3 flex items-center gap-2">
                      {property.verified && (
                        <span className="flex items-center gap-1 bg-blue-600 text-white text-xs font-medium px-2.5 py-1 rounded-full">
                          <ShieldCheck className="w-3 h-3" strokeWidth={2} />
                          Verified
                        </span>
                      )}
                      <span className="bg-white/90 backdrop-blur-md text-slate-900 text-xs font-medium px-2.5 py-1 rounded-full">
                        {getPropertyTypeLabel(property.property_type)}
                      </span>
                    </div>

                    {/* ✅ Top-right: Dynamic Favorite Heart */}
                    <button
                      type="button"
                      onClick={(e) => handleFavorite(e, property.id)}
                      aria-label="Save to favorites"
                      className="absolute top-3 right-3 flex items-center justify-center w-8 h-8 rounded-full bg-white/90 backdrop-blur-md hover:bg-gray-100 transition-colors"
                    >
                      <Heart 
                        className={`w-4 h-4 transition-colors duration-300 ${
                          favoriteIds.includes(property.id) 
                            ? "text-red-500 fill-red-500" 
                            : "text-slate-500"
                        }`} 
                        strokeWidth={1.75} 
                      />
                    </button>

                    {/* Image count indicator */}
                    {imageCount > 1 && (
                      <span className="absolute bottom-3 right-3 flex items-center gap-1 bg-black/60 backdrop-blur-md text-white text-xs font-medium px-2.5 py-1 rounded-full">
                        <Images className="w-3 h-3" strokeWidth={1.75} />
                        {imageCount}
                      </span>
                    )}

                    {property.status === 'rented' && (
                      <span className="absolute bottom-3 left-3 bg-slate-900/90 text-white text-xs font-medium px-2.5 py-1 rounded-full">
                        Rented
                      </span>
                    )}
                  </div>

                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-medium text-[15px] text-slate-900 truncate">
                        {property.title && typeof property.title === 'string' ? property.title : 'Untitled property'}
                      </h3>
                      {rating && (
                        <span className="flex items-center gap-1 text-sm text-slate-500 shrink-0">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" strokeWidth={0} />
                          {rating}
                        </span>
                      )}
                    </div>

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

                    {(bedrooms !== null || bathrooms !== null || area !== null) && (
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
                        {area !== null && (
                          <span className="flex items-center gap-1.5">
                            {area.toLocaleString()} sqft
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
      </section>
    </div>
  );
};

export default Home;