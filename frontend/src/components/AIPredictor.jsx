import { useState } from 'react';
import { Sparkles, Calculator, Building, MapPin, Loader2, ArrowRight } from 'lucide-react';
import api from '../api';

const AIPredictor = () => {
  const [formData, setFormData] = useState({
    city: 'Karachi',
    area: '',
    bedrooms: 1,
    bathrooms: 1,
    furnished: false,
    parking: false
  });
  
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handlePredict = async (e) => {
    e.preventDefault();
    if (!formData.area || formData.area <= 0) {
      setError('Please enter a valid area in Sq Ft.');
      return;
    }
    
    setLoading(true);
    setError('');
    setResult(null);

    try {
      // Data type casting for backend
      const payload = {
        ...formData,
        area: parseFloat(formData.area),
        bedrooms: parseInt(formData.bedrooms),
        bathrooms: parseInt(formData.bathrooms)
      };
      
      const res = await api.post('/properties/predict-rent', payload);
      setResult(res.data);
    } catch (err) {
      setError('Failed to fetch AI prediction. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-[#E7E2D9] rounded-3xl p-6 shadow-sm font-sans max-w-md w-full">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-[#1B1B18]">AI Fair Rent Predictor</h3>
          <p className="text-xs text-[#736E60]">Get smart pricing estimates for your property</p>
        </div>
      </div>

      <form onSubmit={handlePredict} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-800 uppercase tracking-wider mb-1.5 ml-1">City</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <select name="city" value={formData.city} onChange={handleChange} className="w-full pl-9 pr-3 py-2.5 bg-[#FAF8F4] border border-[#E7E2D9] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="Karachi">Karachi</option>
                <option value="Lahore">Lahore</option>
                <option value="Islamabad">Islamabad</option>
                <option value="Rawalpindi">Rawalpindi</option>
                <option value="Hyderabad">Hyderabad</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-800 uppercase tracking-wider mb-1.5 ml-1">Area (Sq Ft)</label>
            <input type="number" name="area" value={formData.area} onChange={handleChange} placeholder="e.g. 1200" required className="w-full px-3 py-2.5 bg-[#FAF8F4] border border-[#E7E2D9] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-800 uppercase tracking-wider mb-1.5 ml-1">Bedrooms</label>
            <input type="number" name="bedrooms" min="1" value={formData.bedrooms} onChange={handleChange} className="w-full px-3 py-2.5 bg-[#FAF8F4] border border-[#E7E2D9] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-800 uppercase tracking-wider mb-1.5 ml-1">Bathrooms</label>
            <input type="number" name="bathrooms" min="1" value={formData.bathrooms} onChange={handleChange} className="w-full px-3 py-2.5 bg-[#FAF8F4] border border-[#E7E2D9] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
        </div>

        <div className="flex gap-4 pt-2">
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer">
            <input type="checkbox" name="furnished" checked={formData.furnished} onChange={handleChange} className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
            Furnished
          </label>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer">
            <input type="checkbox" name="parking" checked={formData.parking} onChange={handleChange} className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
            Parking
          </label>
        </div>

        <button type="submit" disabled={loading} className="w-full mt-2 bg-indigo-600 text-white font-medium py-3 px-4 rounded-xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 text-sm">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Calculator className="w-4 h-4" /> Estimate Rent</>}
        </button>
      </form>

      {error && <p className="text-red-500 text-sm mt-4 text-center font-medium">{error}</p>}

      {result && (
        <div className="mt-6 pt-6 border-t border-[#E7E2D9]">
          <div className="text-center mb-2">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Estimated Value</p>
            <h2 className="text-3xl font-extrabold text-emerald-600">Rs {result.estimated_rent.toLocaleString()}</h2>
          </div>
          <div className="flex items-center justify-between bg-emerald-50 rounded-lg px-4 py-2 mt-4 text-sm font-medium text-emerald-700 border border-emerald-100">
            <span>Range:</span>
            <span>Rs {result.price_range_min.toLocaleString()} <ArrowRight className="inline w-3 h-3 mx-1" /> Rs {result.price_range_max.toLocaleString()}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIPredictor;