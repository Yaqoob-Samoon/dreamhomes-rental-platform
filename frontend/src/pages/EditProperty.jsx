import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api';
import { 
  ArrowLeft, Home as HomeIcon, MapPin, DollarSign, 
  List, Loader2, Image as ImageIcon, Trash2, 
  UploadCloud, X, AlertCircle, Save 
} from 'lucide-react';

const EditProperty = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    title: '', property_type: 'Apartment', city: '', location: '',
    rent: '', area: '', bedrooms: '', bathrooms: '', description: '',
    parking: false, furnished: false
  });
  
  const [existingImages, setExistingImages] = useState([]);
  const [newImageFiles, setNewImageFiles] = useState([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchPropertyDetails = async () => {
      try {
        const response = await api.get(`/properties/${id}`);
        const prop = response.data;
        setFormData({
          title: prop.title, property_type: prop.property_type, city: prop.city,
          location: prop.location, rent: prop.rent, area: prop.area,
          bedrooms: prop.bedrooms, bathrooms: prop.bathrooms, description: prop.description,
          parking: prop.parking, furnished: prop.furnished
        });
        setExistingImages(prop.images || []);
      } catch (err) {
        setError('Failed to fetch property details.');
      } finally {
        setLoading(false);
      }
    };
    fetchPropertyDetails();
  }, [id]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
  };

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    setNewImageFiles((prev) => [...prev, ...files]);
    const fileUrls = files.map(file => URL.createObjectURL(file));
    setImagePreviewUrls((prev) => [...prev, ...fileUrls]);
  };

  const removeNewImage = (indexToRemove) => {
    setNewImageFiles(prev => prev.filter((_, index) => index !== indexToRemove));
    setImagePreviewUrls(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleDeleteExistingImage = async (imageId) => {
    if (window.confirm("Are you sure you want to delete this image permanently?")) {
      try {
        await api.delete(`/properties/${id}/images/${imageId}`);
        setExistingImages(prev => prev.filter(img => img.id !== imageId));
      } catch (err) {
        alert("Failed to delete image.");
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await api.put(`/properties/${id}`, {
        ...formData,
        rent: parseFloat(formData.rent), area: parseFloat(formData.area),
        bedrooms: parseInt(formData.bedrooms), bathrooms: parseInt(formData.bathrooms)
      });

      if (newImageFiles.length > 0) {
        const imageFormData = new FormData();
        newImageFiles.forEach(file => {
          imageFormData.append('files', file);
        });
        await api.post(`/properties/${id}/images`, imageFormData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
      
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update property.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Premium UI Classes
  const inputClass = "w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-[15px] focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-all";
  const labelClass = "block text-slate-900 text-[15px] font-semibold mb-2";
  const sectionClass = "flex flex-col md:flex-row gap-8 py-10 border-b border-slate-200 last:border-0";
  const sectionHeaderClass = "md:w-1/3 shrink-0";
  const sectionBodyClass = "md:w-2/3 space-y-6";

  if (loading) return (
    <div className="flex justify-center items-center min-h-[60vh]">
      <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-24 pt-8 font-sans">
      
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link to="/dashboard" className="p-2 -ml-2 rounded-full hover:bg-slate-100 transition-colors">
          <ArrowLeft className="w-5 h-5 text-slate-600" strokeWidth={2} />
        </Link>
        <div>
          <h1 className="text-3xl font-semibold text-slate-900 tracking-tight">Edit listing</h1>
          <p className="text-slate-500 mt-1 text-sm">Update property details and manage your photos.</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-8 border border-red-100 flex items-center gap-2 font-medium text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden px-6 sm:px-10">
        
        {/* === SECTION 1: Photos === */}
        <div className={sectionClass}>
          <div className={sectionHeaderClass}>
            <div className="flex items-center gap-2 mb-2">
              <ImageIcon className="w-5 h-5 text-slate-400" />
              <h2 className="text-lg font-semibold text-slate-900">Photos</h2>
            </div>
            <p className="text-slate-500 text-sm leading-relaxed">High-quality photos make your listing stand out. You can add, remove, or update them here.</p>
          </div>
          
          <div className={sectionBodyClass}>
            {/* Existing Images */}
            {existingImages.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {existingImages.map((img) => (
                  <div key={img.id} className="relative group rounded-xl overflow-hidden aspect-[4/3] border border-slate-200 shadow-sm bg-slate-50">
                    <img src={img.image_url} alt="Property" className="w-full h-full object-cover" />
                    <button 
                      type="button" 
                      onClick={() => handleDeleteExistingImage(img.id)}
                      className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/40 transition-colors flex items-center justify-center"
                      aria-label="Delete image"
                    >
                      <span className="bg-white text-red-600 p-2.5 rounded-full opacity-0 group-hover:opacity-100 transition-all transform scale-90 group-hover:scale-100 shadow-lg hover:bg-red-50">
                        <Trash2 className="w-4 h-4" strokeWidth={2} />
                      </span>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Upload Zone */}
            <div className="border-2 border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 rounded-2xl p-8 text-center transition-colors group cursor-pointer relative">
              <input type="file" multiple accept="image/*" onChange={handleImageSelect} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" id="image-upload" />
              <div className="flex flex-col items-center pointer-events-none">
                <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                  <UploadCloud className="w-5 h-5 text-slate-700" strokeWidth={1.75} />
                </div>
                <span className="text-[15px] font-semibold text-slate-900">Drag your photos here or click to browse</span>
                <span className="text-sm text-slate-500 mt-1">PNG, JPG up to 5MB</span>
              </div>
            </div>

            {/* Preview of New Images */}
            {imagePreviewUrls.length > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <h3 className="text-sm font-semibold text-slate-900 mb-3">Pending uploads ({imagePreviewUrls.length})</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {imagePreviewUrls.map((url, index) => (
                    <div key={index} className="relative aspect-[4/3] rounded-xl overflow-hidden border border-slate-200 shadow-sm">
                      <img src={url} alt={`Preview ${index}`} className="w-full h-full object-cover" />
                      <button type="button" onClick={() => removeNewImage(index)} className="absolute top-2 right-2 bg-slate-900/70 backdrop-blur-md text-white p-1.5 rounded-full hover:bg-red-600 transition-colors">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* === SECTION 2: Basics === */}
        <div className={sectionClass}>
          <div className={sectionHeaderClass}>
            <div className="flex items-center gap-2 mb-2">
              <HomeIcon className="w-5 h-5 text-slate-400" />
              <h2 className="text-lg font-semibold text-slate-900">Basics</h2>
            </div>
            <p className="text-slate-500 text-sm leading-relaxed">The core details that tenants see first in search results.</p>
          </div>
          
          <div className={sectionBodyClass}>
            <div>
              <label className={labelClass}>Property Title</label>
              <input type="text" name="title" value={formData.title} onChange={handleChange} required placeholder="e.g. Modern Apartment in Saddar" className={inputClass} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={labelClass}>Property Type</label>
                <select name="property_type" value={formData.property_type} onChange={handleChange} className={`${inputClass} cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M5%207l5%205%205-5%22%20stroke%3D%22%2364748B%22%20stroke-width%3D%221.5%22%20fill%3D%22none%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[position:right_1rem_center]`}>
                  <option value="Apartment">Apartment</option>
                  <option value="House">House</option>
                  <option value="Banglow">Banglow</option>
                  <option value="Commercial">Commercial</option>
                  <option value="Room">Room</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Monthly Rent</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-[15px]">PKR</span>
                  <input type="number" name="rent" value={formData.rent} onChange={handleChange} required min="0" className={`${inputClass} pl-14`} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* === SECTION 3: Location === */}
        <div className={sectionClass}>
          <div className={sectionHeaderClass}>
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-5 h-5 text-slate-400" />
              <h2 className="text-lg font-semibold text-slate-900">Location</h2>
            </div>
            <p className="text-slate-500 text-sm leading-relaxed">Where is this property situated? Be specific to attract local tenants.</p>
          </div>
          
          <div className={sectionBodyClass}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={labelClass}>City</label>
                <input type="text" name="city" value={formData.city} onChange={handleChange} required placeholder="e.g. Karachi" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Neighborhood / Area</label>
                <input type="text" name="location" value={formData.location} onChange={handleChange} required placeholder="e.g. DHA Phase 6" className={inputClass} />
              </div>
            </div>
          </div>
        </div>

        {/* === SECTION 4: Features & Details === */}
        <div className={sectionClass}>
          <div className={sectionHeaderClass}>
            <div className="flex items-center gap-2 mb-2">
              <List className="w-5 h-5 text-slate-400" />
              <h2 className="text-lg font-semibold text-slate-900">Features</h2>
            </div>
            <p className="text-slate-500 text-sm leading-relaxed">Describe the specifics, capacity, and extra amenities offered.</p>
          </div>
          
          <div className={sectionBodyClass}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
              <div>
                <label className={labelClass}>Area (Sqft)</label>
                <input type="number" name="area" value={formData.area} onChange={handleChange} required min="0" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Bedrooms</label>
                <input type="number" name="bedrooms" value={formData.bedrooms} onChange={handleChange} required min="0" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Bathrooms</label>
                <input type="number" name="bathrooms" value={formData.bathrooms} onChange={handleChange} required min="0" className={inputClass} />
              </div>
            </div>

            {/* Custom iOS-style Toggles */}
            <div className="flex flex-col sm:flex-row gap-6 p-5 bg-slate-50 border border-slate-200 rounded-2xl mb-8">
              <label className="flex items-center cursor-pointer group">
                <div className="relative">
                  <input type="checkbox" name="parking" checked={formData.parking} onChange={handleChange} className="sr-only" />
                  <div className={`block w-12 h-7 rounded-full transition-colors duration-300 ease-in-out ${formData.parking ? 'bg-slate-900' : 'bg-slate-300 group-hover:bg-slate-400'}`}></div>
                  <div className={`absolute left-1 top-1 bg-white w-5 h-5 rounded-full transition-transform duration-300 ease-in-out shadow-sm ${formData.parking ? 'transform translate-x-5' : ''}`}></div>
                </div>
                <span className="ml-3 text-slate-700 font-medium text-[15px]">Dedicated Parking</span>
              </label>
              
              <label className="flex items-center cursor-pointer group">
                <div className="relative">
                  <input type="checkbox" name="furnished" checked={formData.furnished} onChange={handleChange} className="sr-only" />
                  <div className={`block w-12 h-7 rounded-full transition-colors duration-300 ease-in-out ${formData.furnished ? 'bg-slate-900' : 'bg-slate-300 group-hover:bg-slate-400'}`}></div>
                  <div className={`absolute left-1 top-1 bg-white w-5 h-5 rounded-full transition-transform duration-300 ease-in-out shadow-sm ${formData.furnished ? 'transform translate-x-5' : ''}`}></div>
                </div>
                <span className="ml-3 text-slate-700 font-medium text-[15px]">Fully Furnished</span>
              </label>
            </div>

            <div>
              <label className={labelClass}>Detailed Description</label>
              <textarea 
                name="description" 
                value={formData.description} 
                onChange={handleChange} 
                required 
                rows="6" 
                placeholder="Write a detailed description highlighting the best features of your property..."
                className={`${inputClass} resize-none`}
              ></textarea>
            </div>
          </div>
        </div>

        {/* Submit Footer */}
        <div className="py-8 flex justify-end items-center gap-4 bg-white sticky bottom-0 border-t border-slate-100 mt-4 -mx-6 sm:-mx-10 px-6 sm:px-10">
          <Link to="/dashboard" className="px-6 py-3 text-[15px] font-semibold text-slate-600 hover:text-slate-900 transition-colors">
            Cancel
          </Link>
          <button 
            type="submit" 
            disabled={isSubmitting} 
            className="bg-slate-900 text-white font-semibold text-[15px] py-3.5 px-8 rounded-xl hover:bg-slate-800 transition-colors shadow-sm active:scale-[0.98] flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" /> Saving...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" /> Save Changes
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditProperty;