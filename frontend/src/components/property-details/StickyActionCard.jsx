import { useState, useEffect } from 'react';
import { FileText, MessageSquare, Sparkles, Loader2 } from 'lucide-react';
import api from '../../api';

const StickyActionCard = ({ property, onApply, onContact }) => {
  const isAvailable = property.status === 'PUBLISHED';
  
  const [aiPrediction, setAiPrediction] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchPrediction = async () => {
      if (!property) return;
      
      setLoading(true);
      try {
        const payload = {
          city: property.city || 'Karachi',
          area: parseFloat(property.area) || 1000,
          bedrooms: parseInt(property.bedrooms) || 1,
          bathrooms: parseInt(property.bathrooms) || 1,
          furnished: Boolean(property.furnished),
          parking: Boolean(property.parking)
        };
        
        const res = await api.post('/properties/predict-rent', payload);
        setAiPrediction(res.data);
      } catch (error) {
        console.error("Failed to fetch AI prediction:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPrediction();
  }, [property]);

  return (
    <div className="lg:col-span-1">
      <div className="sticky top-28 bg-white border border-[#E7E2D9] rounded-3xl p-6 sm:p-8 shadow-[0_10px_40px_rgb(0,0,0,0.04)]">
        <div className="mb-6">
          <span className="text-2xl sm:text-3xl font-bold text-[#1B1B18] tracking-tight">
            PKR {property.rent.toLocaleString()}
          </span>
          <span className="text-[#736E60] font-medium text-sm ml-1">/ month</span>
        </div>

        <div className="space-y-3 mb-6">
          <button
            onClick={onApply}
            disabled={!isAvailable}
            className={`w-full py-3.5 px-4 rounded-xl font-medium flex items-center justify-center gap-2 transition-all duration-200 text-sm ${
              isAvailable
                ? 'bg-[#1B1B18] text-white hover:bg-[#3F6652] shadow-sm active:scale-[0.98]'
                : 'bg-[#FAF8F4] text-[#C3BDAC] border border-[#E7E2D9] cursor-not-allowed'
            }`}
          >
            <FileText className="w-4 h-4" />
            {isAvailable ? 'Apply for this property' : 'Not Available'}
          </button>

          <button
            onClick={onContact}
            disabled={!isAvailable}
            className={`w-full py-3.5 px-4 rounded-xl font-medium flex items-center justify-center gap-2 border transition-all duration-200 text-sm ${
              isAvailable
                ? 'border-[#E7E2D9] text-[#1B1B18] hover:bg-[#FAF8F4] active:scale-[0.98]'
                : 'border-[#E7E2D9]/50 text-[#C3BDAC] bg-white cursor-not-allowed'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            Contact Landlord
          </button>
        </div>

        <div className="text-center">
          <p className="text-[#8C8676] text-xs font-medium mb-4">You won't be charged yet</p>
        </div>

        {/* AI Fair Rent Check UI */}
        <div className="mt-8 p-5 bg-[#FAF8F4] rounded-2xl border border-[#E7E2D9]">
          <div className="flex items-center gap-2 text-[#1B1B18] font-semibold mb-3 text-sm">
            <Sparkles className="w-4 h-4 text-[#3F6652]" /> AI Fair Rent Check
          </div>
          
          {loading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-[#3F6652]" />
            </div>
          ) : aiPrediction ? (
            <>
              <div className="flex justify-between items-center text-sm">
                <span className="text-[#736E60]">Estimated Rent</span>
                <span className="font-bold text-[#1B1B18]">PKR {aiPrediction.estimated_rent.toLocaleString()}</span>
              </div>
              
              <div className="mt-3 w-full bg-[#E7E2D9] h-1.5 rounded-full overflow-hidden flex">
                <div 
                  className={`h-full rounded-full ${property.rent > aiPrediction.price_range_max ? 'bg-red-500' : 'bg-[#3F6652]'}`} 
                  style={{ width: `${Math.min((property.rent / aiPrediction.price_range_max) * 100, 100)}%` }}
                ></div>
              </div>
              
              <p className="text-xs text-[#8C8676] mt-3 leading-relaxed">
                Based on machine learning data for {property.bedrooms}-bed properties in {property.city}. AI fair range is PKR {aiPrediction.price_range_min.toLocaleString()} to PKR {aiPrediction.price_range_max.toLocaleString()}.
              </p>
            </>
          ) : (
            <p className="text-xs text-[#8C8676]">AI Model is currently unavailable.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default StickyActionCard;