import { Facebook, Twitter, Instagram, Youtube, ArrowUp } from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { mongoApi } from "@/lib/mongoApi";
import logoImg from "@/assets/dominica_logo.png";

const SiteFooter = () => {
  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: () => mongoApi.getCategories(),
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  });
  const { data: pages = [] } = useQuery({
    queryKey: ["footer-pages"],
    queryFn: () => mongoApi.getPages(),
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  });

  const socials = [
    { Icon: Facebook, href: "https://www.facebook.com/dominicanews", label: "Facebook" },
    { Icon: Twitter, href: "https://www.facebook.com/dominicanews", label: "Twitter" },
    { Icon: Instagram, href: "https://www.instagram.com/dominicanews", label: "Instagram" },
    { Icon: Youtube, href: "https://www.youtube.com/channel/UCvtEDb_00XXqe9oFUAkJ9ww", label: "YouTube" },
  ];

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <footer className="bg-foreground text-background mt-0 relative">
      {/* Back to top */}
      <button
        onClick={scrollToTop}
        className="absolute -top-5 right-6 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
        aria-label="Back to top"
      >
        <ArrowUp className="h-4 w-4" />
      </button>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-16 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">

          {/* Brand */}
          <div className="lg:col-span-1">
            <img src={logoImg} alt="DominicaNews.DM" className="h-10 w-auto mb-4 brightness-0 invert opacity-80" />
            <p className="text-sm leading-relaxed opacity-70 font-body">
              Dominica News is your trusted source for breaking news, politics,
              weather updates, and Caribbean coverage.
            </p>
            <div className="flex items-center gap-2 mt-5">
              {socials.map(({ Icon, href, label }, i) => (
                <a
                  key={i}
                  href={href}
                  aria-label={label}
                  className="w-9 h-9 rounded-full bg-background/10 flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all duration-200"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-heading font-bold text-sm uppercase tracking-widest mb-4 opacity-60">Quick Links</h3>
            <ul className="space-y-2.5 text-sm font-body">
              {pages
                .filter((p) => p.is_active && p.show_in_footer)
                .sort((a, b) => a.display_order - b.display_order)
                .map((p) => (
                  <li key={p.id}>
                    <Link to={`/page/${p.slug}`} className="opacity-65 hover:opacity-100 hover:translate-x-0.5 inline-block transition-all duration-200">
                      {p.title}
                    </Link>
                  </li>
                ))}
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="font-heading font-bold text-sm uppercase tracking-widest mb-4 opacity-60">Categories</h3>
            <ul className="space-y-2.5 text-sm font-body">
              {categories.map((cat) => (
                <li key={cat.id}>
                  <Link
                    to={`/?cat=${cat.slug}`}
                    className="opacity-65 hover:opacity-100 hover:translate-x-0.5 inline-block transition-all duration-200"
                  >
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-heading font-bold text-sm uppercase tracking-widest mb-4 opacity-60">Stay Connected</h3>
            <p className="text-sm opacity-65 font-body leading-relaxed mb-4">
              Follow us for real-time updates and breaking news alerts from across Dominica and the Caribbean.
            </p>
            <Link
              to="/live"
              className="inline-flex items-center gap-2 text-sm font-body font-semibold bg-primary/20 text-primary-foreground px-4 py-2 rounded-full hover:bg-primary/30 transition-colors"
            >
              <span className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
              Live Updates
            </Link>
          </div>

        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-background/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs opacity-40 font-body tracking-wide">
          <span>© {new Date().getFullYear()} DominicaNews.DM — All rights reserved.</span>
          <span className="hidden sm:inline">Proudly serving the Nature Isle</span>
        </div>
      </div>
    </footer>
  );
};

export default SiteFooter;
