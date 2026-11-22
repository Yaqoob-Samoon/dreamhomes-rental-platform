import Navbar from './Navbar';
import { Outlet } from 'react-router-dom';

const Layout = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      {/* Outlet wahan render hota hai jahan child routes aate hain */}
      <main className="flex-grow max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 mt-4 transition-all duration-300">
        <Outlet />
      </main>
      
      {/* Future mein hum yahan premium Footer add karenge */}
      <footer className="bg-white border-t py-6 text-center text-gray-500 text-sm mt-auto">
        © {new Date().getFullYear()} DreamHomes. All rights reserved.
      </footer>
    </div>
  );
};

export default Layout;