import { useState, useCallback, useEffect, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import SplashLoader from "./components/SplashLoader";
import DelayedLoader from "./components/DelayedLoader";
import Index from "./pages/Index";
import { lazyRoute, lazyNamed, installLinkPrefetch, prefetchAllRoutesWhenIdle } from "./lib/routePrefetch";

const starts = (p: string) => (path: string) => path.startsWith(p);
const is = (p: string) => (path: string) => path === p;
const isAdmin = starts("/admin");

const ArticlePage = lazyRoute(starts("/news/"), () => import("./pages/ArticlePage"), 0);
const SearchPage = lazyRoute(is("/search"), () => import("./pages/SearchPage"));
const LiveUpdatesListPage = lazyRoute(is("/live"), () => import("./pages/LiveUpdatesListPage"), 0);
const LiveUpdatePage = lazyRoute(starts("/live/"), () => import("./pages/LiveUpdatePage"));
const DynamicPage = lazyRoute(starts("/page/"), () => import("./pages/DynamicPage"));
const EventLandingPage = lazyRoute((p) => /^\/(dominica-carnival|wcmf|miss-dominica)-/.test(p), () => import("./pages/EventLandingPage"), 2);
const ObituariesPage = lazyRoute(is("/obituaries"), () => import("./pages/ObituariesPage"));
const PersonPage = lazyRoute(starts("/people/"), () => import("./pages/PersonPage"), 2);
const AuthorPage = lazyRoute(starts("/author/"), () => import("./pages/AuthorPage"));
const AuthorsPage = lazyRoute(is("/authors"), () => import("./pages/AuthorsPage"));
const FeedPage = lazyRoute(is("/feed"), () => import("./pages/FeedPage"));
const TagPage = lazyRoute(starts("/tag/"), () => import("./pages/TagPage"));
const NotFound = lazyRoute(() => false, () => import("./pages/NotFound"), 3);
const statics = () => import("./pages/staticLandings");
const staticTest = (p: string) => ["/roseau-news", "/portsmouth-news", "/hurricane-season-dominica", "/dominica-elections"].includes(p);
const RoseauNewsPage = lazyNamed(staticTest, statics, "RoseauNewsPage");
const PortsmouthNewsPage = lazyNamed(staticTest, statics, "PortsmouthNewsPage");
const HurricaneSeasonPage = lazyNamed(staticTest, statics, "HurricaneSeasonPage");
const ElectionsPage = lazyNamed(staticTest, statics, "ElectionsPage");

// Admin chunks: prefetched only on intent (priority 9 = last during idle).
const A = (l: () => Promise<any>) => lazyRoute(isAdmin, l, 9);
const AdminLayout = A(() => import("./components/admin/AdminLayout"));
const AdminAuthGuard = A(() => import("./components/admin/AdminAuthGuard"));
const AdminLoginPage = A(() => import("./pages/admin/AdminLoginPage"));
const AdminDashboard = A(() => import("./pages/admin/AdminDashboard"));
const AdminArticlesPage = A(() => import("./pages/admin/AdminArticlesPage"));
const CreateArticlePage = A(() => import("./pages/admin/CreateArticlePage"));
const EditArticlePage = A(() => import("./pages/admin/EditArticlePage"));
const AdminAuthorsPage = A(() => import("./pages/admin/AdminAuthorsPage"));
const AdminCategoriesPage = A(() => import("./pages/admin/AdminCategoriesPage"));
const AdminPagesPage = A(() => import("./pages/admin/AdminPagesPage"));
const AdminBreakingNewsPage = A(() => import("./pages/admin/AdminBreakingNewsPage"));
const AdminTagsPage = A(() => import("./pages/admin/AdminTagsPage"));
const AdminSettingsPage = A(() => import("./pages/admin/AdminSettingsPage"));
const AdminAnalyticsPage = A(() => import("./pages/admin/AdminAnalyticsPage"));
const AdminLiveUpdatesPage = A(() => import("./pages/admin/AdminLiveUpdatesPage"));
const AdminSchedulePage = A(() => import("./pages/admin/AdminSchedulePage"));
const AdminTrashPage = A(() => import("./pages/admin/AdminTrashPage"));
const AdminBackupPage = A(() => import("./pages/admin/AdminBackupPage"));

const queryClient = new QueryClient();

const App = () => {
  const [showSplash, setShowSplash] = useState(true);
  const hideSplash = useCallback(() => setShowSplash(false), []);

  useEffect(() => {
    installLinkPrefetch();
    const t = setTimeout(prefetchAllRoutesWhenIdle, 2500);
    return () => clearTimeout(t);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        {showSplash && <SplashLoader onFinish={hideSplash} />}
        <BrowserRouter>
          <Suspense fallback={<DelayedLoader delay={200} />}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/category/:slug" element={<Index />} />
            <Route path="/news/:slug" element={<ArticlePage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/live" element={<LiveUpdatesListPage />} />
            <Route path="/live/:slug" element={<LiveUpdatePage />} />
            <Route path="/page/:slug" element={<DynamicPage />} />
            <Route path="/dominica-carnival-:year" element={<EventLandingPage eventKey="dominica-carnival" />} />
            <Route path="/wcmf-:year" element={<EventLandingPage eventKey="wcmf" />} />
            <Route path="/miss-dominica-:year" element={<EventLandingPage eventKey="miss-dominica" />} />
            <Route path="/obituaries" element={<ObituariesPage />} />
            <Route path="/people/:slug" element={<PersonPage />} />
            <Route path="/authors" element={<AuthorsPage />} />
            <Route path="/feed" element={<FeedPage />} />
            <Route path="/author/:slug" element={<AuthorPage />} />
            <Route path="/tag/:slug" element={<TagPage />} />
            <Route path="/roseau-news" element={<RoseauNewsPage />} />
            <Route path="/portsmouth-news" element={<PortsmouthNewsPage />} />
            <Route path="/hurricane-season-dominica" element={<HurricaneSeasonPage />} />
            <Route path="/dominica-elections" element={<ElectionsPage />} />
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
              <Route path="trash" element={<AdminTrashPage />} />
              <Route path="backup" element={<AdminBackupPage />} />
            </Route>
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
