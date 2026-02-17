import SiteHeader from "@/components/SiteHeader";
import NavBar from "@/components/NavBar";
import NewsCard from "@/components/NewsCard";
import { newsArticles } from "@/data/newsData";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <NavBar />
      <main className="max-w-7xl mx-auto px-6 py-8">
        <h2 className="text-3xl font-heading font-bold text-foreground mb-6">
          Latest News
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {newsArticles.map((article) => (
            <NewsCard key={article.id} article={article} />
          ))}
        </div>
      </main>
    </div>
  );
};

export default Index;
