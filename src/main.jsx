import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './index.css'

// Públicas
import App from './App.jsx'
import LoginPage from './pages/Login.page.jsx'
import RecuperarPasswordPage from './pages/RecuperarPass.page.jsx'

// Protección y layout
import ProtectedRoute from './components/ProtectedRoute.jsx'
import AppLayout from './layouts/AppLayout.jsx'

// Panel home (todos los roles)
import PanelHome from './pages/PanelHome.page.jsx'

// Módulo 2 — Inventario (rutas → ./pages/Modulo2/...)
import EquiposList from './pages/Modulo2/EquiposList.page.jsx'
import EquipoForm from './pages/Modulo2/EquipoForm.page.jsx'
import EquipoDetalle from './pages/Modulo2/EquipoDetalle.page.jsx'

// Módulo 3 — Reparación
import DiagnosticosList from './pages/Modulo3/DiagnosticosList.page.jsx'
import ReparacionesList from './pages/Modulo3/ReparacionesList.page.jsx'

// Módulo 4 — Campañas
import CampanasList from './pages/Modulo4/CampanasList.page.jsx'
import ParticipacionesList from './pages/Modulo4/ParticipacionesList.page.jsx'

// Módulo 5 — Reportes
import Reportes from './pages/Modulo5/Reportes.page.jsx'

// Admin
import AdminPage from './pages/admin/Admin.page.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        {/* Públicas */}
        <Route path="/" element={<App />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/recuperar-password" element={<RecuperarPasswordPage />} />

        {/* Panel autenticado */}
        <Route path="/panel" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
          <Route index element={<PanelHome />} />

          {/* Módulo 2 — Inventario */}
          <Route path="equipos" element={<EquiposList />} />
          <Route path="equipos/nuevo" element={<EquipoForm />} />
          <Route path="equipos/:id" element={<EquipoDetalle />} />
          <Route path="equipos/:id/editar" element={<EquipoForm />} />

          {/* Módulo 3 — Reparación (responsable + admin) */}
          <Route path="diagnosticos" element={
            <ProtectedRoute requiredRole={["responsable", "administrador"]}>
              <DiagnosticosList />
            </ProtectedRoute>
          } />
          <Route path="reparaciones" element={
            <ProtectedRoute requiredRole={["responsable", "administrador"]}>
              <ReparacionesList />
            </ProtectedRoute>
          } />

          {/* Módulo 4 — Campañas */}
          <Route path="campanas" element={
            <ProtectedRoute requiredRole={["responsable", "administrador"]}>
              <CampanasList />
            </ProtectedRoute>
          } />
          <Route path="participaciones" element={<ParticipacionesList />} />

          {/* Módulo 5 — Reportes */}
          <Route path="reportes" element={
            <ProtectedRoute requiredRole={["responsable", "administrador"]}>
              <Reportes />
            </ProtectedRoute>
          } />

          {/* Admin */}
          <Route path="usuarios" element={
            <ProtectedRoute requiredRole="administrador">
              <AdminPage />
            </ProtectedRoute>
          } />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
)