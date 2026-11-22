import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import CreateProperty from './pages/CreateProperty';
import PropertyDetails from './pages/PropertyDetails';
import ProtectedRoute from './components/ProtectedRoute';
import Dashboard from './pages/Dashboard';
import EditProperty from './pages/EditProperty';
import Favorites from './pages/Favorites';
import AdminDashboard from './pages/AdminDashboard';
import Messages from './pages/Messages';
import Properties from './pages/Properties';
import VerifyEmail from './pages/VerifyEmail';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import VerifyOTP from './pages/VerifyOTP';
import AIChatbotWidget from './components/AIChatbotWidget';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Layout Wrapper Route */}
        <Route element={<Layout />}>
          {/* Public / Standard Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/properties" element={<Properties />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/property/:id" element={<PropertyDetails />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/edit-property/:id" element={<EditProperty />} />
          <Route path="/favorites" element={<Favorites />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/verify-otp" element={<VerifyOTP />} />
          
          {/* Protected Routes */}
          <Route 
            path="/chat" 
            element={
              <ProtectedRoute>
                <Messages />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/create-property" 
            element={
              <ProtectedRoute allowedRoles={['LANDLORD']}>
                <CreateProperty />
              </ProtectedRoute>
            } 
          />
        </Route>
      </Routes>

      {/* ✅ Floating AI Chatbot Widget */}
      <AIChatbotWidget />
      
    </BrowserRouter>
  );
}

export default App;