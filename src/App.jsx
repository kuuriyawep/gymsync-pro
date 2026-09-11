import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import ProtectedRoute from '@/components/ProtectedRoute';
import RoleRoute from '@/components/RoleRoute';
import { Navigate } from 'react-router-dom';
import Dashboard from '@/pages/Dashboard';
import Members from '@/pages/Members';
import Settings from '@/pages/Settings';
import Reports from '@/pages/Reports';
import Payments from '@/pages/Payments';
import Membership from '@/pages/Membership';
import MemberDetails from '@/pages/MemberDetails';
import Trainers from '@/pages/Trainers';
import Feedback from '@/pages/Feedback';
import Support from '@/pages/Support';
import AuthGateway from '@/components/auth/AuthGateway';
import JoinGym from '@/pages/JoinGym';
import Onboarding from '@/pages/Onboarding';
import WelcomeLobby from '@/pages/WelcomeLobby';
import MemberDashboard from '@/pages/member/MemberDashboard';
import MemberAttendance from '@/pages/member/MemberAttendance';
import MemberPayments from '@/pages/member/MemberPayments';
import MemberFeedback from '@/pages/member/MemberFeedback';
import MemberProfile from '@/pages/member/MemberProfile';
// Add page imports here

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
    <Routes>
      {/* Add your page Route elements here */}
      <Route path="/login" element={<AuthGateway />} />
      <Route path="/register" element={<AuthGateway />} />
      <Route path="/welcome" element={<WelcomeLobby />} />
      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/welcome" replace />} />}>
        <Route element={<RoleRoute allowedRole="owner" redirectTo="/member" />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/members" element={<Members />} />
          <Route path="/members/:id" element={<MemberDetails />} />
          <Route path="/payments" element={<Payments />} />
          <Route path="/membership" element={<Membership />} />
          <Route path="/trainers" element={<Trainers />} />
          <Route path="/feedback" element={<Feedback />} />
          <Route path="/support" element={<Support />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
        <Route element={<RoleRoute allowedRole="member" redirectTo="/" />}>
          <Route path="/join-gym" element={<JoinGym />} />
          <Route path="/member" element={<MemberDashboard />} />
          <Route path="/member/attendance" element={<MemberAttendance />} />
          <Route path="/member/payments" element={<MemberPayments />} />
          <Route path="/member/feedback" element={<MemberFeedback />} />
          <Route path="/member/profile" element={<MemberProfile />} />
        </Route>
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
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