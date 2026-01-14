import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import PublicRoute from './components/PublicRoute';     // ← new component
import DashboardLayout from './components/Layout/DashboardLayout';

// Pages
import Login from './pages/Auth/Login';
import Dashboard from './pages/Dashboard/Dashboard';
import Categories from './pages/Categories/Categories';
import Products from './pages/Products/Products';
import ProductForm from './pages/Products/ProductForm';
import AdminReviews from './pages/Reviews/AdminReviews';

const Unauthorized = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-100">
    <div className="bg-white p-8 rounded-lg shadow-md text-center">
      <h1 className="text-3xl font-bold text-red-600 mb-4">Unauthorized</h1>
      <p className="text-gray-600">You don't have permission to access this page.</p>
    </div>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>

          {/* Public routes — redirect to dashboard if already logged in */}
          <Route element={<PublicRoute redirectTo="/dashboard" />}>
            <Route path="/login" element={<Login />} />
            {/* Add more public routes here in future if needed */}
            {/* <Route path="/register" element={<Register />} /> */}
            {/* <Route path="/forgot-password" element={<ForgotPassword />} /> */}
          </Route>

          {/* Special pages */}
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Protected routes — Seller + Admin */}
          <Route element={<ProtectedRoute allowedRoles={['seller', 'admin']} />}>
            <Route
              path="/dashboard"
              element={
                <DashboardLayout>
                  <Dashboard />
                </DashboardLayout>
              }
            />
            <Route
              path="/dashboard/products"
              element={
                <DashboardLayout>
                  <Products />
                </DashboardLayout>
              }
            />
            <Route
              path="/dashboard/products/add"
              element={
                <DashboardLayout>
                  <ProductForm />
                </DashboardLayout>
              }
            />
            <Route
              path="/dashboard/products/edit/:id"
              element={
                <DashboardLayout>
                  <ProductForm />
                </DashboardLayout>
              }
            />
          </Route>

          {/* Admin-only routes */}
          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route
              path="/dashboard/categories"
              element={
                <DashboardLayout>
                  <Categories />
                </DashboardLayout>
              }
            />
            <Route
              path="/dashboard/reviews"
              element={
                <DashboardLayout>
                  <AdminReviews />
                </DashboardLayout>
              }
            />
          </Route>

          {/* Root redirect */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* 404 fallback */}
          <Route path="*" element={
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <h1 className="text-6xl font-bold text-gray-800">404</h1>
                <p className="mt-4 text-xl text-gray-600">Page not found</p>
                <a 
                  href="/dashboard" 
                  className="mt-6 inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Go to Dashboard
                </a>
              </div>
            </div>
          } />

        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;