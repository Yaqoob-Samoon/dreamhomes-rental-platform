import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { Sparkles, MapPin, BedDouble, Bath, Loader2, ArrowRight } from 'lucide-react';

const RecommendedProperties = () => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        const res = await api.get('/properties/recommendations/me');
        setRecommendations(res.data);
      } catch (err) {
        // Agar user tenant nahi hai ya token nahi hai, toh silently fail karein
        console.error("Could not load recommendations");
        setError('Unable to load recommendations at the moment.');
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-[#3F6652]" />
      </div>
    );
  }

  if (error || recommendations.length === 0) return null;

  return (
    <div className="mt-12 mb-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-[#3F6652]/10 p-2 rounded-xl">
          <Sparkles className="w-6 h-6 text-[#3F6652]" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-[#1B1B18] tracking-tight">Recommended For You</h2>
          <p className="text-sm text-[#736E60]">Based on your favorites and search history</p>
        </div>
      </div>

      {/* Horizontal Scrollable Grid */}
      <div className="flex overflow-x-auto gap-6 pb-6 snap-x hide-scrollbar">
        {recommendations.map((property) => (
          <Link 
            to={`/property/${property.id}`} 
            key={property.id} 
            className="min-w-[300px] md:min-w-[320px] bg-white border border-[#E7E2D9] rounded-3xl shadow-sm hover:shadow-md transition-all duration-300 group snap-start overflow-hidden flex flex-col"
          >
            <div className="relative h-48 bg-slate-100 overflow-hidden">
              {property.images && property.images.length > 0 ? (
                <img 
                  src={property.images[0].image_url} 
                  alt={property.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-[#FAF8F4]">
                  <span className="text-[#C3BDAC] font-medium text-sm">No Image</span>
                </div>
              )}
              <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-[#1B1B18] shadow-sm">
                PKR {property.rent.toLocaleString()}
              </div>
            </div>

            <div className="p-5 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-[#1B1B18] mb-1 truncate" title={property.title}>
                  {property.title}
                </h3>
                <div className="flex items-center gap-1.5 text-sm text-[#736E60] mb-4">
                  <MapPin className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{property.location}, {property.city}</span>
                </div>
              </div>

              <div className="flex justify-between items-center border-t border-[#E7E2D9] pt-4 mt-auto">
                <div className="flex gap-4 text-sm font-medium text-[#736E60]">
                  <span className="flex items-center gap-1.5"><BedDouble className="w-4 h-4"/> {property.bedrooms}</span>
                  <span className="flex items-center gap-1.5"><Bath className="w-4 h-4"/> {property.bathrooms}</span>
                </div>
                <div className="bg-[#FAF8F4] p-2 rounded-full group-hover:bg-[#1B1B18] group-hover:text-white transition-colors text-[#1B1B18]">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
      
      {/* CSS for hiding scrollbar but keeping functionality */}
      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
};

export default RecommendedProperties;