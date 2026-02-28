import { Facebook, Twitter, Instagram, Youtube, ArrowUp, Heart } from "lucide-react";
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
    <footer className="bg-foreground text-background relative overflow-hidden">
      {/* Decorative top edge */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-secondary to-primary" />

      {/* Back to top */}
      <button
        onClick={scrollToTop}
        className="absolute -top-5 right-6 w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-300 z-10"
        aria-label="Back to top"
      >
        <ArrowUp className="h-4 w-4" />
      </button>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-20 pb-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">

          {/* Brand */}
          <div className="lg:col-span-1">
            <img src={logoImg} alt="DominicaNews.DM" className="h-10 w-auto mb-5 brightness-0 invert opacity-80" />
            <p className="text-sm leading-[1.8] opacity-60 font-body">
              Dominica News is your trusted source for breaking news, politics,
              weather updates, and Caribbean coverage.
            </p>
            <div className="flex items-center gap-2.5 mt-6">
              {socials.map(({ Icon, href, label }, i) => (
                <a
                  key={i}
                  href={href}
                  aria-label={label}
                  className="w-10 h-10 rounded-xl bg-background/8 flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all duration-300 hover:scale-105"
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
            <h3 className="font-heading font-bold text-xs uppercase tracking-[0.2em] mb-5 opacity-50">Quick Links</h3>
            <ul className="space-y-3 text-sm font-body">
              {pages
                .filter((p) => p.is_active && p.show_in_footer)
                .sort((a, b) => a.display_order - b.display_order)
                .map((p) => (
                  <li key={p.id}>
                    <Link to={`/page/${p.slug}`} className="opacity-55 hover:opacity-100 hover:translate-x-1 inline-block transition-all duration-300">
                      {p.title}
                    </Link>
                  </li>
                ))}
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="font-heading font-bold text-xs uppercase tracking-[0.2em] mb-5 opacity-50">Categories</h3>
            <ul className="space-y-3 text-sm font-body">
              {categories.map((cat) => (
                <li key={cat.id}>
                  <Link
                    to={`/?cat=${cat.slug}`}
                    className="opacity-55 hover:opacity-100 hover:translate-x-1 inline-block transition-all duration-300"
                  >
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-heading font-bold text-xs uppercase tracking-[0.2em] mb-5 opacity-50">Stay Connected</h3>
            <p className="text-sm opacity-55 font-body leading-[1.8] mb-5">
              Follow us for real-time updates and breaking news alerts from across Dominica and the Caribbean.
            </p>
            <Link
              to="/live"
              className="inline-flex items-center gap-2.5 text-sm font-body font-semibold bg-destructive/20 text-destructive-foreground px-5 py-2.5 rounded-xl hover:bg-destructive/30 transition-all duration-300 group"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive" />
              </span>
              Live Updates
            </Link>
          </div>

        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-background/8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs opacity-35 font-body tracking-wide">
          <span>© {new Date().getFullYear()} DominicaNews.DM — All rights reserved.</span>
          <span className="hidden sm:flex items-center gap-1.5">
            Made with <Heart className="h-3 w-3 text-destructive opacity-80" /> in the Nature Isle
          </span>
        </div>
      </div>
    </footer>
  );
};

export default SiteFooter;
