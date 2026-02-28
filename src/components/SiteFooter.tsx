import { Facebook, Twitter, Instagram, Youtube } from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { mongoApi } from "@/lib/mongoApi";

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

  return (
    <footer className="bg-foreground text-background mt-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">

          {/* About Us */}
          <div className="lg:col-span-1">
            <h3 className="font-heading font-bold text-sm uppercase tracking-widest mb-4 opacity-70">About Us</h3>
            <p className="text-sm leading-relaxed opacity-80 font-body">
              Dominica News is your trusted source for breaking news, politics,
              weather updates, and Caribbean coverage.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-heading font-bold text-sm uppercase tracking-widest mb-4 opacity-70">Quick Links</h3>
            <ul className="space-y-2.5 text-sm font-body">
              {pages
                .filter((p) => p.is_active && p.show_in_footer)
                .sort((a, b) => a.display_order - b.display_order)
                .map((p) => (
                  <li key={p.id}>
                    <Link to={`/page/${p.slug}`} className="opacity-75 hover:opacity-100 hover:underline underline-offset-2 transition-all">
                      {p.title}
                    </Link>
                  </li>
                ))}
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="font-heading font-bold text-sm uppercase tracking-widest mb-4 opacity-70">Categories</h3>
            <ul className="space-y-2.5 text-sm font-body">
              {categories.map((cat) => (
                <li key={cat.id}>
                  <Link
                    to={`/?cat=${cat.slug}`}
                    className="opacity-75 hover:opacity-100 hover:underline underline-offset-2 transition-all"
                  >
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Follow Us */}
          <div>
            <h3 className="font-heading font-bold text-sm uppercase tracking-widest mb-4 opacity-70">Follow Us</h3>
            <div className="flex items-center gap-2 mb-4">
              {socials.map(({ Icon, href, label }, i) => (
                <a
                  key={i}
                  href={href}
                  aria-label={label}
                  className="w-9 h-9 rounded-full bg-background/10 flex items-center justify-center hover:bg-background/20 transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
            <p className="text-sm opacity-70 font-body leading-relaxed">
              Follow us for real-time updates and breaking news alerts.
            </p>
          </div>

        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-background/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 text-center text-xs opacity-50 font-body tracking-wide">
          © {new Date().getFullYear()} DominicaNews.DM — All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default SiteFooter;
