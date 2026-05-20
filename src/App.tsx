import { Routes, Route, Navigate } from 'react-router-dom'
import { type ReactNode } from 'react'
import { useAuth } from '@/contexts/AuthContext'

import { Layout } from '@/components/layout/Layout'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { ScrollToTop } from '@/components/shared/ScrollToTop'
import { Toaster } from '@/components/ui/Toast'

import HomePage from '@/pages/HomePage'
import ArticlePage from '@/pages/ArticlePage'
import CategoryPage from '@/pages/CategoryPage'
import SearchPage from '@/pages/SearchPage'
import VideoReelsPage from '@/pages/VideoReelsPage'
import NotFoundPage from '@/pages/NotFoundPage'
import GroupsPage from '@/pages/GroupsPage'
import SendNewsPage from '@/pages/SendNewsPage'
import PrivacyPage from '@/pages/PrivacyPage'

import LoginPage from '@/pages/admin/LoginPage'
import DashboardPage from '@/pages/admin/DashboardPage'
import AnalyticsPage from '@/pages/admin/AnalyticsPage'
import ArticlesPage from '@/pages/admin/ArticlesPage'
import CategoriesPage from '@/pages/admin/CategoriesPage'
import ArticleEditorPage from '@/pages/admin/ArticleEditorPage'
import AdsPage from '@/pages/admin/AdsPage'
import PopupsPage from '@/pages/admin/PopupsPage'
import GroupsAdminPage from '@/pages/admin/GroupsAdminPage'
import UserNewsPage from '@/pages/admin/UserNewsPage'
import SettingsPage from '@/pages/admin/SettingsPage'
import NewsletterPage from '@/pages/admin/NewsletterPage'

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
      <ScrollToTop />
      <Routes>
        {/* Public routes */}
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/noticias/:slug" element={<ArticlePage />} />
          <Route path="/categoria/:slug" element={<CategoryPage />} />
          <Route path="/buscar" element={<SearchPage />} />
          <Route path="/grupos" element={<GroupsPage />} />
          <Route path="/enviar-noticia" element={<SendNewsPage />} />
          <Route path="/privacidade" element={<PrivacyPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
        <Route path="/videos/:slug" element={<VideoReelsPage />} />

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
          <Route path="analises" element={<AnalyticsPage />} />
          <Route path="artigos" element={<ArticlesPage />} />
          <Route path="artigos/novo" element={<ArticleEditorPage />} />
          <Route path="artigos/:id/editar" element={<ArticleEditorPage />} />
          <Route path="categorias" element={<CategoriesPage />} />
          <Route path="anuncios" element={<AdsPage />} />
          <Route path="popups" element={<PopupsPage />} />
          <Route path="grupos" element={<GroupsAdminPage />} />
          <Route path="noticias-internautas" element={<UserNewsPage />} />
          <Route path="newsletter" element={<NewsletterPage />} />
          <Route path="configuracoes" element={<SettingsPage />} />
        </Route>
      </Routes>

      <Toaster />
    </>
  )
}
