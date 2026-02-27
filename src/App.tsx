import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AdminLayout from "./components/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminArticlesPage from "./pages/admin/AdminArticlesPage";
import CreateArticlePage from "./pages/admin/CreateArticlePage";
import AdminAuthorsPage from "./pages/admin/AdminAuthorsPage";
import AdminCategoriesPage from "./pages/admin/AdminCategoriesPage";
import EditArticlePage from "./pages/admin/EditArticlePage";
import ArticlePage from "./pages/ArticlePage";
import AdminLoginPage from "./pages/admin/AdminLoginPage";
import AdminAuthGuard from "./components/admin/AdminAuthGuard";
import AboutPage from "./pages/AboutPage";
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage";
import TermsOfServicePage from "./pages/TermsOfServicePage";
import DynamicPage from "./pages/DynamicPage";
import AdminPagesPage from "./pages/admin/AdminPagesPage";
import AdminBreakingNewsPage from "./pages/admin/AdminBreakingNewsPage";
import AdminTagsPage from "./pages/admin/AdminTagsPage";
import AdminSettingsPage from "./pages/admin/AdminSettingsPage";
import AdminAnalyticsPage from "./pages/admin/AdminAnalyticsPage";
import AdminLiveUpdatesPage from "./pages/admin/AdminLiveUpdatesPage";
import AdminSchedulePage from "./pages/admin/AdminSchedulePage";
const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/news/:slug" element={<ArticlePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
          <Route path="/terms-of-service" element={<TermsOfServicePage />} />
          <Route path="/page/:slug" element={<DynamicPage />} />
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/admin" element={<AdminAuthGuard><AdminLayout /></AdminAuthGuard>}>
            <Route index element={<AdminDashboard />} />
            <Route path="articles" element={<AdminArticlesPage />} />
            <Route path="articles/create" element={<CreateArticlePage />} />
            <Route path="articles/edit/:id" element={<EditArticlePage />} />
            <Route path="authors" element={<AdminAuthorsPage />} />
            <Route path="categories" element={<AdminCategoriesPage />} />
            <Route path="pages" element={<AdminPagesPage />} />
            <Route path="breaking" element={<AdminBreakingNewsPage />} />
            <Route path="tags" element={<AdminTagsPage />} />
            <Route path="live" element={<AdminLiveUpdatesPage />} />
            <Route path="settings" element={<AdminSettingsPage />} />
            <Route path="analytics" element={<AdminAnalyticsPage />} />
            <Route path="schedule" element={<AdminSchedulePage />} />
          </Route>
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
