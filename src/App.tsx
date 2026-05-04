import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useAuthStore } from '@/stores/authStore'
import { usePermissionStore } from '@/stores/permissionStore'
import { withPermissions } from '@/components/layout/withPermissions'
import AppLayout     from '@/components/layout/AppLayout'
import CompanyLayout from '@/components/layout/CompanyLayout'
import { navGroups } from '@/components/layout/AppLayout'

// ── Pages ─────────────────────────────────────────────────────────────────────
import LoginPage         from '@/pages/auth/LoginPage'
import DashboardPage     from '@/pages/dashboard/DashboardPage'
 
import CompaniesPage     from '@/pages/companies/CompaniesPage'
import UsersPage         from '@/pages/users/UsersPage'
import RolesPage         from '@/pages/roles/RolesPage' 
 
import CompanyUsersPage  from '@/pages/company-users/CompanyUsersPage'
 
 
import LandingPage       from './pages/landing/LandingPage'
import ForgotPasswordPage from '@/pages/auth/ForgotPasswordPage'
import TaskListPage       from '@/pages/tasks/list'


const allNavItems = navGroups.flatMap(g => g.items)

const resourceFor = (path: string): string => {
  const item = allNavItems.find(i => i.path === path)
  if (!item) console.warn(`[App] No navGroup entry found for path: ${path}`)
  return item?.resource ?? path.replace('/', '').replace('-', '_')
}

// ── Wrap pages with permission ────────────────────────────────────────────
// withPermissions(resource, Page):
 // based on the read/write permissions it works
// Resource keys come from navGroups — zero hardcoding.
const Companies     = withPermissions(resourceFor('/companies'),      CompaniesPage)
const Users         = withPermissions(resourceFor('/users'),          UsersPage)
const Roles         = withPermissions(resourceFor('/roles'),          RolesPage) 

const CompanyUsers  = withPermissions(resourceFor('/company-users'),  CompanyUsersPage)
 

// ── Spinner to show the top────────────────────────────────
function Spinner() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-page)' }}>
      <div style={{ width: 40, height: 40, borderRadius: '50%', border: '4px solid var(--brand-600)', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

// ── Protected route — auth check + layout selection based on the PERMISSIONS ───────────────────────────
function ProtectedRoute() {
  const { isAuthenticated, isLoading, loadUser, user } = useAuthStore()
  const { loadPermissions } = usePermissionStore()

  useEffect(() => {
    if (isAuthenticated) {
      loadUser()
      loadPermissions()
    }
  }, [isAuthenticated])

  if (isLoading) return <Spinner />
  if (!isAuthenticated) return <Navigate to="/login" replace />

  
  const roleId: number = (user as any)?.role_id ?? (user as any)?.role ?? 4
  const Layout = roleId >= 3 ? CompanyLayout : AppLayout

  return <Layout />
}

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
      <Routes>

        {/* Public */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Navigate to="/" />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />        
        <Route path="/tasks/list" element={<TaskListPage />} />
        {/* after login */}
        <Route element={<ProtectedRoute />}>

          <Route path="/dashboard"      element={<DashboardPage />} />

          {/* Operations pages */}
           <Route path="/companies"      element={<Companies />} /> 
          <Route path="/company-users"  element={<CompanyUsers />} />    
          <Route path="/orders"         element={<ComingSoon />} />
          <Route path="/orders/new"     element={<ComingSoon />} />
          <Route path="/orders/:id"     element={<ComingSoon />} />
          <Route path="/companies"      element={<ComingSoon />} />
          <Route path="/company-users"  element={<ComingSoon />} />
          <Route path="/pricing"        element={<ComingSoon />} />
          <Route path="/tickets"        element={<ComingSoon />} />
          <Route path="/shorturl"       element={<ComingSoon />} />       

          {/* Reports */}
          <Route path="/credit-uploads" element={<ComingSoon />} />
          <Route path="/activity-log"   element={<ComingSoon />} />

            <Route path="/api-config"     element={<ComingSoon />} />
            <Route path="/blacklist"      element={<ComingSoon />} />
            <Route path="/phonebooks"     element={<ComingSoon />} />
            <Route path="/templates"      element={<ComingSoon />} />

          {/* Management */}
          <Route path="/users"          element={<Users />} />
          <Route path="/roles"          element={<Roles />} />          

        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />

      </Routes>
    </BrowserRouter>
  )
}
function ComingSoon() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400, opacity: 0.4 }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🚧</div>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Coming Soon</h2>
      <p style={{ fontSize: 13 }}>This module is under development</p>
    </div>
  )
}
