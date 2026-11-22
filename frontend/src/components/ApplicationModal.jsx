import { useState } from 'react';
import { X, Calendar, Users, MessageSquare, Loader2, CheckCircle } from 'lucide-react';
import api from '../api';

const ApplicationModal = ({ isOpen, onClose, propertyId, propertyTitle }) => {
  const [formData, setFormData] = useState({
    move_in_date: '',
    occupants: 1,
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: '', text: '' });

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: '', text: '' });

    try {
      await api.post(`/applications/${propertyId}`, {
        move_in_date: new Date(formData.move_in_date).toISOString(),
        occupants: parseInt(formData.occupants),
        message: formData.message
      });
      setStatus({ type: 'success', text: 'Application submitted successfully! The landlord will review it soon.' });
      setTimeout(() => {
        onClose();
        setStatus({ type: '', text: '' });
      }, 3000);
    } catch (err) {
      setStatus({ 
        type: 'error', 
        text: err.response?.data?.detail || 'Failed to submit application. Please try again.' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm transition-opacity">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-300">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex justify-between items-center">
          <h3 className="text-xl font-bold text-white">Apply for Rental</h3>
          <button 
            onClick={onClose} 
            className="text-white/80 hover:text-white hover:bg-white/20 p-1.5 rounded-full transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 md:p-8">
          <p className="text-gray-600 mb-6 text-sm">
            You are applying for <span className="font-bold text-gray-900">{propertyTitle}</span>. Please fill out the details below.
          </p>

          {status.text && (
            <div className={`p-4 rounded-xl mb-6 text-sm flex items-start gap-3 ${status.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {status.type === 'success' && <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />}
              <p className="font-medium">{status.text}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Move-in Date */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Expected Move-in Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input 
                  type="date" 
                  name="move_in_date"
                  required
                  value={formData.move_in_date}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition"
                />
              </div>
            </div>

            {/* Occupants */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Number of Occupants</label>
              <div className="relative">
                <Users className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input 
                  type="number" 
                  name="occupants"
                  min="1"
                  max="15"
                  required
                  value={formData.occupants}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition"
                />
              </div>
            </div>

            {/* Message */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Message to Landlord (Optional)</label>
              <div className="relative">
                <MessageSquare className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <textarea 
                  name="message"
                  rows="3"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Introduce yourself or ask a question..."
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition resize-none"
                ></textarea>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button 
                type="button" 
                onClick={onClose}
                className="w-1/3 px-4 py-3 text-gray-700 font-semibold bg-gray-100 hover:bg-gray-200 rounded-xl transition"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={loading || status.type === 'success'}
                className="w-2/3 px-4 py-3 text-white font-semibold bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg hover:shadow-blue-600/30 transition flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Submit Application'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ApplicationModal;