import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";

// Layout
import { MainLayout } from "@/components/layout/MainLayout";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";

// Pages
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Tasks from "@/pages/Tasks";
import Reports from "@/pages/Reports";
import ChangePassword from "@/pages/ChangePassword";
import MasterDivision from "@/pages/master/MasterDivision";
import MasterEmployee from "@/pages/master/MasterEmployee";
import MasterUser from "@/pages/master/MasterUser";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

function AppRoutes() {
  const { isAuthenticated } = useAuthStore();

  return (
    <Routes>
      {/* Public routes */}
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />}
      />

      {/* Protected routes with main layout */}
      <Route
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/tasks" element={<Tasks />} />
        <Route path="/change-password" element={<ChangePassword />} />
        
        {/* Admin/Manager only routes */}
        <Route
          path="/master/division"
          element={
            <ProtectedRoute allowedRoles={['admin', 'manager']}>
              <MasterDivision />
            </ProtectedRoute>
          }
        />
        <Route
          path="/master/employee"
          element={
            <ProtectedRoute allowedRoles={['admin', 'manager']}>
              <MasterEmployee />
            </ProtectedRoute>
          }
        />
        <Route
          path="/master/user"
          element={
            <ProtectedRoute allowedRoles={['admin', 'manager']}>
              <MasterUser />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <ProtectedRoute allowedRoles={['admin', 'manager']}>
              <Reports />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Redirects */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      
      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
