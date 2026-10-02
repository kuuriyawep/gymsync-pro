import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import React, { Suspense, lazy } from 'react';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import ChunkErrorBoundary from '@/components/ChunkErrorBoundary';
import ProtectedRoute from '@/components/ProtectedRoute';
import RoleRoute from '@/components/RoleRoute';
import { Navigate } from 'react-router-dom';
import Dashboard from '@/pages/Dashboard';
import Members from '@/pages/Members';
import MemberDetails from '@/pages/MemberDetails';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import JoinGym from '@/pages/JoinGym';
import WelcomeLobby from '@/pages/WelcomeLobby';
import MemberDashboard from '@/pages/member/MemberDashboard';
import MemberAttendance from '@/pages/member/MemberAttendance';
import MemberPayments from '@/pages/member/MemberPayments';
import MemberFeedback from '@/pages/member/MemberFeedback';
import MemberProfile from '@/pages/member/MemberProfile';
// Code-split secondary pages to reduce initial bundle size
const Settings = lazy(() => import('@/pages/Settings'));
const Reports = lazy(() => import('@/pages/Reports'));
const Payments = lazy(() => import('@/pages/Payments'));
const Membership = lazy(() => import('@/pages/Membership'));
const Trainers = lazy(() => import('@/pages/Trainers'));
const Feedback = lazy(() => import('@/pages/Feedback'));
const Support = lazy(() => import('@/pages/Support'));
const Onboarding = lazy(() => import('@/pages/Onboarding'));
import About from '@/pages/About';
import Contact from '@/pages/Contact';
// Add page imports here

const PageLoader = () => (
  <div className="fixed inset-0 flex items-center justify-center">
    <div className="w-8 h-8 border-4 border-muted border-t-foreground rounded-full animate-spin"></div>
  </div>
);

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <ChunkErrorBoundary>
    <Suspense fallback={<PageLoader />}>
    <Routes>
      {/* Add your page Route elements here */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/join-gym" element={<JoinGym />} />
      <Route path="/welcome" element={<WelcomeLobby />} />
      <Route path="/onboarding" element={<Onboarding />} />
      <Route path="/about" element={<About />} />
      <Route path="/contact" element={<Contact />} />
      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/welcome" replace />} />}>
        {/* Owner/Staff routes */}
        <Route element={<RoleRoute allowedRoles={["owner", "staff"]} />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/members" element={<Members />} />
          <Route path="/members/:id" element={<MemberDetails />} />
          <Route path="/payments" element={<Payments />} />
          <Route path="/membership" element={<Membership />} />
          <Route path="/trainers" element={<Trainers />} />
          <Route path="/feedback" element={<Feedback />} />
          <Route path="/support" element={<Support />} />
          <Route path="/reports" element={<Reports />} />
        </Route>
        {/* Owner-only routes */}
        <Route element={<RoleRoute allowedRoles={["owner"]} />}>
          <Route path="/settings" element={<Settings />} />
        </Route>
        {/* Member routes */}
        <Route element={<RoleRoute allowedRoles={["member"]} />}>
          <Route path="/member" element={<MemberDashboard />} />
          <Route path="/member/attendance" element={<MemberAttendance />} />
          <Route path="/member/payments" element={<MemberPayments />} />
          <Route path="/member/feedback" element={<MemberFeedback />} />
          <Route path="/member/profile" element={<MemberProfile />} />
        </Route>
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
    </Suspense>
    </ChunkErrorBoundary>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App