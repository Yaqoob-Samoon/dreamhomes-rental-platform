import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { Search, MapPin, Bed, Home, Filter, Loader2, Sparkles, SlidersHorizontal } from 'lucide-react';

// ---- Formatting Helper ----
function formatRentPKR(amount) {
  const n = Number(amount);
  if (amount === null || amount === undefined || Number.isNaN(n)) return null;
  return `PKR ${n.toLocaleString()}`;
}

const Properties = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filter States
  const [filters, setFilters] = useState({
    city: '',
    property_type: '',
    bedrooms: '',
    min_rent: '',
    max_rent: ''
  });

  const fetchProperties = async () => {
    setLoading(true);
    try {
      const activeFilters = Object.fromEntries(
        Object.entries(filters).filter(([_, v]) => v !== '')
      );
      
      const response = await api.get('/properties/', { params: activeFilters });
      setProperties(response.data);
    } catch (err) {
      console.error("Failed to fetch properties", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const applyFilters = (e) => {
    e.preventDefault();
    fetchProperties();
  };

  const clearFilters = () => {
    setFilters({ city: '', property_type: '', bedrooms: '', min_rent: '', max_rent: '' });
    setTimeout(() => fetchProperties(), 0); 
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col lg:flex-row gap-10 font-sans text-slate-900 bg-white">
      
      {/* 🎛️ SIDEBAR: Advanced Filters */}
      <aside className="w-full lg:w-80 shrink-0">
        <div className="bg-white p-6 sm:p-7 rounded-3xl shadow-[0_10px_40px_rgb(0,0,0,0.04)] border border-[#E7E2D9] sticky top-28">
          <div className="flex items-center justify-between pb-5 border-b border-[#E7E2D9]/60 mb-6">
            <h2 className="text-lg font-semibold text-[#1B1B18] flex items-center gap-2.5">
              <SlidersHorizontal className="w-4 h-4 text-[#3F6652]" />
              Filters
            </h2>
            <button 
              onClick={clearFilters} 
              className="text-xs text-[#736E60] hover:text-[#1B1B18] font-semibold transition-colors"
            >
              Clear all
            </button>
          </div>

          <form onSubmit={applyFilters} className="space-y-5">
            {/* City Filter */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#736E60] mb-2">City</label>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  name="city"
                  value={filters.city}
                  onChange={handleFilterChange}
                  placeholder="e.g. Karachi" 
                  className="w-full pl-10 pr-4 py-3 bg-[#FAF8F4] border border-[#E7E2D9] rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1B1B18] transition-all placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Property Type Filter */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#736E60] mb-2">Property Type</label>
              <select 
                name="property_type"
                value={filters.property_type}
                onChange={handleFilterChange}
                className="w-full px-4 py-3 bg-[#FAF8F4] border border-[#E7E2D9] rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1B1B18] transition-all cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M5%207l5%205%205-5%22%20stroke%3D%22%2364748B%22%20stroke-width%3D%221.5%22%20fill%3D%22none%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[position:right_1rem_center]"
              >
                <option value="">All Types</option>
                <option value="Apartment">Apartment</option>
                <option value="House">House</option>
                <option value="Villa">Villa</option>
                <option value="Commercial">Commercial</option>
              </select>
            </div>

            {/* Bedrooms Filter */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#736E60] mb-2">Bedrooms</label>
              <div className="relative">
                <Bed className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="number" 
                  name="bedrooms"
                  min="1"
                  value={filters.bedrooms}
                  onChange={handleFilterChange}
                  placeholder="Any" 
                  className="w-full pl-10 pr-4 py-3 bg-[#FAF8F4] border border-[#E7E2D9] rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1B1B18] transition-all placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Rent Range Filter */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#736E60] mb-2">Price Range (PKR)</label>
              <div className="flex gap-2">
                <input 
                  type="number" 
                  name="min_rent"
                  value={filters.min_rent}
                  onChange={handleFilterChange}
                  placeholder="Min" 
                  className="w-full px-3 py-3 bg-[#FAF8F4] border border-[#E7E2D9] rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1B1B18] transition-all placeholder:text-slate-400"
                />
                <input 
                  type="number" 
                  name="max_rent"
                  value={filters.max_rent}
                  onChange={handleFilterChange}
                  placeholder="Max" 
                  className="w-full px-3 py-3 bg-[#FAF8F4] border border-[#E7E2D9] rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1B1B18] transition-all placeholder:text-slate-400"
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="w-full bg-[#1B1B18] hover:bg-[#3F6652] text-white font-medium py-3.5 px-4 rounded-xl shadow-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2 mt-6 text-sm"
            >
              <Search className="w-4 h-4" />
              Apply Filters
            </button>
          </form>
        </div>
      </aside>

      {/* 🏡 MAIN CONTENT: Property Grid */}
      <main className="flex-1">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-2">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-[#1B1B18]">Explore Properties</h1>
            <p className="text-[#736E60] text-sm mt-1">Discover verified rental spaces tailored to your needs.</p>
          </div>
          <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-[#FAF8F4] border border-[#E7E2D9] text-[#736E60]">
            {properties.length} {properties.length === 1 ? 'Property' : 'Properties'} available
          </span>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center min-h-[50vh]">
            <Loader2 className="w-8 h-8 animate-spin text-[#1B1B18]" />
          </div>
        ) : properties.length === 0 ? (
          <div className="bg-[#FAF8F4] border border-[#E7E2D9] rounded-3xl p-16 text-center shadow-sm flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-white shadow-sm flex items-center justify-center mb-4 border border-[#E7E2D9]">
              <Search className="w-6 h-6 text-[#736E60]" />
            </div>
            <h3 className="text-xl font-bold text-[#1B1B18] mb-2">No properties found</h3>
            <p className="text-[#736E60] text-sm max-w-md leading-relaxed">Try adjusting your filters or searching in a different location to find what you're looking for.</p>
            <button onClick={clearFilters} className="mt-6 text-sm font-semibold text-[#1B1B18] underline hover:text-[#3F6652] transition-colors">
              Clear all filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {properties.map((property) => (
              <Link 
                to={`/property/${property.id}`} 
                key={property.id} 
                className="bg-white rounded-2xl border border-[#E7E2D9]/80 shadow-[0_4px_20px_rgb(0,0,0,0.03)] overflow-hidden hover:shadow-[0_10px_30px_rgb(0,0,0,0.08)] transition-all duration-300 hover:-translate-y-1 group flex flex-col"
              >
                <div className="relative h-60 bg-slate-100 overflow-hidden">
                  {property.images && property.images.length > 0 ? (
                    <img 
                      src={property.images[0].image_url} 
                      alt={property.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-[#FAF8F4] text-slate-300">
                      <Home className="w-10 h-10 stroke-[1.5]" />
                    </div>
                  )}
                  <div className="absolute top-4 left-4">
                    <span className="bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold text-slate-800 shadow-sm border border-slate-100">
                      {property.property_type}
                    </span>
                  </div>
                </div>

                <div className="p-6 flex flex-col flex-1 justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-[#1B1B18] line-clamp-1 group-hover:text-blue-600 transition tracking-tight mb-2">
                      {property.title}
                    </h3>
                    
                    <div className="flex items-center text-[#736E60] text-sm mb-4">
                      <MapPin className="w-4 h-4 mr-1.5 text-slate-400 shrink-0" />
                      <span className="truncate">{property.location}, {property.city}</span>
                    </div>

                    <div className="flex items-center gap-3 text-xs font-medium text-slate-600 mb-6">
                      <div className="flex items-center gap-1.5 bg-[#FAF8F4] px-3 py-1.5 rounded-lg border border-[#E7E2D9]">
                        <Bed className="w-3.5 h-3.5 text-slate-400" />
                        {property.bedrooms} Beds
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-[#E7E2D9]/60">
                    <div className="flex flex-col">
                      <span className="text-xs text-[#736E60] font-medium">Monthly Rent</span>
                      <span className="text-lg font-bold text-[#1B1B18] tracking-tight">
                        {formatRentPKR(property.rent)}
                      </span>
                    </div>
                    <span className="text-xs font-semibold text-[#1B1B18] bg-[#FAF8F4] border border-[#E7E2D9] px-3.5 py-2 rounded-xl group-hover:bg-[#1B1B18] group-hover:text-white transition-all duration-200">
                      View Details
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Properties;