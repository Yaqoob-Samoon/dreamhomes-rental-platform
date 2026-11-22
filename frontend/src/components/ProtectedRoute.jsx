import { Navigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const token = localStorage.getItem('token');

  if (!token) {
    // Agar login nahi hai, toh login page par bhej do
    return <Navigate to="/login" replace />;
  }

  try {
    const decoded = jwtDecode(token);
    const userRole = decoded.role;

    // Agar allowedRoles define hain aur user ka role usme nahi hai, toh home par bhej do
    if (allowedRoles && !allowedRoles.includes(userRole)) {
      return <Navigate to="/" replace />;
    }

    // Sab theek hai toh page render kardo
    return children;
  } catch (error) {
    // Token kharab hone ki surat mein logout karwa do
    localStorage.removeItem('token');
    return <Navigate to="/login" replace />;
  }
};

export default ProtectedRoute;