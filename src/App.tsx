import { Routes, Route, Navigate } from 'react-router-dom'
import { type ReactNode } from 'react'
import { useAuth } from '@/contexts/AuthContext'

import { Layout } from '@/components/layout/Layout'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { Toaster } from '@/components/ui/Toast'

import HomePage from '@/pages/HomePage'
import ArticlePage from '@/pages/ArticlePage'
import CategoryPage from '@/pages/CategoryPage'
import SearchPage from '@/pages/SearchPage'
import NotFoundPage from '@/pages/NotFoundPage'

import LoginPage from '@/pages/admin/LoginPage'
import DashboardPage from '@/pages/admin/DashboardPage'
import ArticlesPage from '@/pages/admin/ArticlesPage'
import CategoriesPage from '@/pages/admin/CategoriesPage'
import ArticleEditorPage from '@/pages/admin/ArticleEditorPage'
import AdsPage from '@/pages/admin/AdsPage'
import GroupsPage from '@/pages/GroupsPage'
import GroupsAdminPage from '@/pages/admin/GroupsAdminPage'

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/admin/login" replace />
  }

  return <>{children}</>
}

export default function App() {
  return (
    <>
      <Routes>
        {/* Public routes */}
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/noticias/:slug" element={<ArticlePage />} />
          <Route path="/categoria/:slug" element={<CategoryPage />} />
          <Route path="/buscar" element={<SearchPage />} />
          <Route path="/grupos" element={<GroupsPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>

        {/* Admin – login (unprotected) */}
        <Route path="/admin/login" element={<LoginPage />} />

        {/* Admin – protected */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="artigos" element={<ArticlesPage />} />
          <Route path="artigos/novo" element={<ArticleEditorPage />} />
          <Route path="artigos/:id/editar" element={<ArticleEditorPage />} />
          <Route path="categorias" element={<CategoriesPage />} />
          <Route path="anuncios" element={<AdsPage />} />
          <Route path="grupos" element={<GroupsAdminPage />} />
        </Route>
      </Routes>

      <Toaster />
    </>
  )
}
