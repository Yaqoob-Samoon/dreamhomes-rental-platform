import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { PlusCircle, Home as HomeIcon, MapPin, DollarSign, List, Image as ImageIcon, Loader2, X, AlertCircle, UploadCloud } from 'lucide-react';
import AIPredictor from '../components/AIPredictor';

const CreateProperty = () => {
  const [formData, setFormData] = useState({
    title: '',
    property_type: 'Apartment',
    city: '',
    location: '',
    rent: '',
    area: '',
    bedrooms: '',
    bathrooms: '',
    description: '',
    parking: false,
    furnished: false
  });
  
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ 
      ...formData, 
      [name]: type === 'checkbox' ? checked : value 
    });
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setImages(files);
    
    const previews = files.map(file => URL.createObjectURL(file));
    setImagePreviews(previews);
  };

  const removeImage = (index) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    setImages(newImages);
    
    const newPreviews = [...imagePreviews];
    newPreviews.splice(index, 1);
    setImagePreviews(newPreviews);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const propertyResponse = await api.post('/properties/', {
        ...formData,
        rent: parseFloat(formData.rent),
        area: parseFloat(formData.area),
        bedrooms: parseInt(formData.bedrooms),
        bathrooms: parseInt(formData.bathrooms)
      });

      const newPropertyId = propertyResponse.data.id;

      if (images.length > 0) {
        const imageFormData = new FormData();
        images.forEach(image => {
          imageFormData.append('files', image);
        });

        await api.post(`/properties/${newPropertyId}/images`, imageFormData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      }

      navigate('/');
    } catch (err) {
      const backendError = err.response?.data?.detail;
      const errorMessage = Array.isArray(backendError) 
        ? `${backendError[0].loc.join('.')} : ${backendError[0].msg}` 
        : 'Failed to add property or upload images.';
      setError(errorMessage);
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass = "w-full px-4 py-3 bg-ink-50 border border-transparent rounded-xl text-ink-800 placeholder-ink-400 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-300 transition-all";
  const labelClass = "block text-ink-700 text-sm font-semibold mb-2";

  return (
    <div className="max-w-7xl mx-auto pb-16 px-4 sm:px-6 lg:px-8 mt-8">
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        
        {/* LEFT COLUMN - MAIN FORM */}
        <div className="w-full lg:w-2/3">
          <div className="mb-8">
            <h1 className="text-3xl font-extrabold text-ink-900 tracking-tight mb-2">
              List a <span className="font-serif italic font-medium text-brand-600">New Property</span>
            </h1>
            <p className="text-ink-500 text-[15px]">Fill in the details below to publish your property on the market.</p>
          </div>

          {error && (
            <div className="bg-danger-50 text-danger-600 p-4 rounded-xl mb-6 border border-danger-500/10 flex items-center gap-2 font-medium text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form id="property-form" onSubmit={handleSubmit} className="space-y-6">
            
            {/* SECTION 1: Basic Info */}
            <div className="bg-white p-6 md:p-8 rounded-3xl shadow-card border border-ink-900/6">
              <div className="flex items-center gap-3 mb-6 pb-5 border-b border-ink-900/6">
                <div className="w-9 h-9 rounded-full bg-brand-50 flex items-center justify-center shrink-0">
                  <HomeIcon className="w-[18px] h-[18px] text-brand-600" strokeWidth={2} />
                </div>
                <h2 className="text-lg font-bold text-ink-900">Basic Information</h2>
              </div>
              
              <div className="space-y-5">
                <div>
                  <label className={labelClass}>Property Title</label>
                  <input type="text" name="title" value={formData.title} onChange={handleChange} required className={inputClass} placeholder="e.g. Luxury 2-Bedroom Apartment in DHA" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className={labelClass}>Property Type</label>
                    <select name="property_type" value={formData.property_type} onChange={handleChange} className={`${inputClass} cursor-pointer`}>
                      <option value="Apartment">Apartment</option>
                      <option value="House">House</option>
                      <option value="Banglow">Banglow</option>
                      <option value="Commercial">Commercial</option>
                      <option value="Room">Room</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Monthly Rent (Rs.)</label>
                    <div className="relative">
                      <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-ink-400" />
                      <input type="number" name="rent" value={formData.rent} onChange={handleChange} required className={`${inputClass} pl-12`} placeholder="80000" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 2: Location */}
            <div className="bg-white p-6 md:p-8 rounded-3xl shadow-card border border-ink-900/6">
              <div className="flex items-center gap-3 mb-6 pb-5 border-b border-ink-900/6">
                <div className="w-9 h-9 rounded-full bg-brand-50 flex items-center justify-center shrink-0">
                  <MapPin className="w-[18px] h-[18px] text-brand-600" strokeWidth={2} />
                </div>
                <h2 className="text-lg font-bold text-ink-900">Location Details</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className={labelClass}>City</label>
                  <input type="text" name="city" value={formData.city} onChange={handleChange} required className={inputClass} placeholder="e.g. Karachi" />
                </div>
                <div>
                  <label className={labelClass}>Area / Neighborhood</label>
                  <input type="text" name="location" value={formData.location} onChange={handleChange} required className={inputClass} placeholder="e.g. Gulshan-e-Iqbal" />
                </div>
              </div>
            </div>

            {/* SECTION 3: Features & Amenities */}
            <div className="bg-white p-6 md:p-8 rounded-3xl shadow-card border border-ink-900/6">
              <div className="flex items-center gap-3 mb-6 pb-5 border-b border-ink-900/6">
                <div className="w-9 h-9 rounded-full bg-brand-50 flex items-center justify-center shrink-0">
                  <List className="w-[18px] h-[18px] text-brand-600" strokeWidth={2} />
                </div>
                <h2 className="text-lg font-bold text-ink-900">Features & Amenities</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
                <div>
                  <label className={labelClass}>Area (Sq Yd)</label>
                  <input type="number" name="area" value={formData.area} onChange={handleChange} required className={inputClass} placeholder="240" />
                </div>
                <div>
                  <label className={labelClass}>Bedrooms</label>
                  <input type="number" name="bedrooms" value={formData.bedrooms} onChange={handleChange} required className={inputClass} placeholder="3" />
                </div>
                <div>
                  <label className={labelClass}>Bathrooms</label>
                  <input type="number" name="bathrooms" value={formData.bathrooms} onChange={handleChange} required className={inputClass} placeholder="3" />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-6 p-4 bg-ink-50 rounded-xl">
                <label className="flex items-center cursor-pointer">
                  <div className="relative">
                    <input type="checkbox" name="parking" checked={formData.parking} onChange={handleChange} className="sr-only" />
                    <div className={`block w-10 h-6 rounded-full transition-colors duration-200 ${formData.parking ? 'bg-brand-600' : 'bg-ink-300'}`}></div>
                    <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-200 shadow-sm ${formData.parking ? 'transform translate-x-4' : ''}`}></div>
                  </div>
                  <span className="ml-3 text-ink-700 font-medium text-sm">Parking Space Available</span>
                </label>

                <label className="flex items-center cursor-pointer">
                  <div className="relative">
                    <input type="checkbox" name="furnished" checked={formData.furnished} onChange={handleChange} className="sr-only" />
                    <div className={`block w-10 h-6 rounded-full transition-colors duration-200 ${formData.furnished ? 'bg-brand-600' : 'bg-ink-300'}`}></div>
                    <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-200 shadow-sm ${formData.furnished ? 'transform translate-x-4' : ''}`}></div>
                  </div>
                  <span className="ml-3 text-ink-700 font-medium text-sm">Fully Furnished</span>
                </label>
              </div>
            </div>

            {/* SECTION 4: Media & Description */}
            <div className="bg-white p-6 md:p-8 rounded-3xl shadow-card border border-ink-900/6">
              <div className="flex items-center gap-3 mb-6 pb-5 border-b border-ink-900/6">
                <div className="w-9 h-9 rounded-full bg-brand-50 flex items-center justify-center shrink-0">
                  <ImageIcon className="w-[18px] h-[18px] text-brand-600" strokeWidth={2} />
                </div>
                <h2 className="text-lg font-bold text-ink-900">Media & Description</h2>
              </div>
              
              <div className="mb-6">
                <label className={labelClass}>Upload Property Images</label>
                <div className="relative border-2 border-dashed border-brand-200 bg-brand-50/50 rounded-2xl p-8 text-center hover:bg-brand-50 hover:border-brand-300 transition-colors cursor-pointer">
                  <input 
                    type="file" 
                    multiple 
                    accept="image/*"
                    onChange={handleImageChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="w-12 h-12 rounded-full bg-white shadow-card flex items-center justify-center mx-auto mb-3">
                    <UploadCloud className="w-5 h-5 text-brand-600" strokeWidth={1.75} />
                  </div>
                  <p className="text-brand-700 font-semibold text-sm">Click or drag images here to upload</p>
                  <p className="text-xs text-brand-500/80 mt-1">Supports JPG, PNG (Max 5MB per image)</p>
                </div>
                
                {imagePreviews.length > 0 && (
                  <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                    {imagePreviews.map((src, index) => (
                      <div key={index} className="relative group rounded-xl overflow-hidden border border-ink-900/8">
                        <img src={src} alt={`Preview ${index}`} className="w-full h-24 object-cover" />
                        <button 
                          type="button" 
                          onClick={() => removeImage(index)}
                          className="absolute top-1.5 right-1.5 bg-ink-900/80 backdrop-blur-sm text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className={labelClass}>Detailed Description</label>
                <textarea name="description" value={formData.description} onChange={handleChange} required rows="5" className={inputClass} placeholder="Tell potential tenants what makes this property special..."></textarea>
              </div>
            </div>

            {/* Mobile Submit Button (Visible only on small screens) */}
            <div className="lg:hidden flex justify-end pt-2">
              <button type="submit" disabled={isSubmitting} className="w-full bg-ink-900 hover:bg-brand-600 text-white font-bold py-4 px-8 rounded-xl transition-colors duration-200 shadow-lg shadow-ink-900/15 active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100">
                {isSubmitting ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Publishing...</>
                ) : (
                  <><PlusCircle className="w-[18px] h-[18px]" strokeWidth={2.25} /> Publish Property</>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* RIGHT COLUMN - SIDEBAR & AI PREDICTOR */}
        <div className="w-full lg:w-1/3 flex flex-col gap-6 sticky top-6">
          
          {/* AI Widget */}
          <AIPredictor />
          
          {/* Desktop Submit Button Card */}
          <div className="hidden lg:block bg-white p-6 md:p-8 rounded-3xl shadow-card border border-ink-900/6">
            <h3 className="text-lg font-bold text-ink-900 mb-2">Ready to Publish?</h3>
            <p className="text-ink-500 text-sm mb-6 leading-relaxed">Your property will be listed and submitted for review. It will become visible to potential tenants once approved.</p>
            <button 
              type="submit" 
              form="property-form" 
              disabled={isSubmitting} 
              className="w-full bg-ink-900 hover:bg-brand-600 text-white font-bold py-4 px-6 rounded-xl transition-colors duration-200 shadow-lg shadow-ink-900/15 active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100"
            >
              {isSubmitting ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Publishing...</>
              ) : (
                <><PlusCircle className="w-[18px] h-[18px]" strokeWidth={2.25} /> Publish Property</>
              )}
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};

export default CreateProperty;