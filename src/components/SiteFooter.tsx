import { Facebook, Twitter, Instagram, Youtube, Mail } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { mongoApi } from "@/lib/mongoApi";

const SiteFooter = () => {
  const [email, setEmail] = useState("");
  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: () => mongoApi.getCategories(),
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  });
  return (
    <footer className="bg-foreground text-background mt-0">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">

          {/* About Us */}
          <div className="lg:col-span-1">
            <h3 className="font-heading font-bold text-base mb-4">About Us</h3>
            <p className="text-sm leading-relaxed opacity-90 font-body">
              Dominica News is your trusted source for breaking news, politics,
              weather updates, and Caribbean coverage.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-heading font-bold text-base mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm font-body">
              <li>
                <Link to="/about" className="opacity-90 hover:opacity-100 hover:underline transition-opacity">
                  About Us
                </Link>
              </li>
              <li>
                <span className="opacity-50 cursor-not-allowed">Editorial Team</span>
              </li>
              <li>
                <span className="opacity-50 cursor-not-allowed">Contact</span>
              </li>
              <li>
                <Link to="/privacy-policy" className="opacity-90 hover:opacity-100 hover:underline transition-opacity">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms-of-service" className="opacity-90 hover:opacity-100 hover:underline transition-opacity">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="font-heading font-bold text-base mb-4">Categories</h3>
            <ul className="space-y-2 text-sm font-body">
              {categories.map((cat) => (
                <li key={cat.id}>
                  <Link
                    to={`/?cat=${cat.slug}`}
                    className="opacity-90 hover:opacity-100 hover:underline transition-opacity"
                  >
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Follow Us */}
          <div>
            <h3 className="font-heading font-bold text-base mb-4">Follow Us</h3>
            <div className="flex items-center gap-3 mb-3">
              {[
                { Icon: Facebook, href: "https://www.facebook.com/dominicanews" },
                { Icon: Twitter, href: "https://www.facebook.com/dominicanews" },
                { Icon: Instagram, href: "https://www.instagram.com/dominicanews" },
                { Icon: Youtube, href: "https://www.youtube.com/channel/UCvtEDb_00XXqe9oFUAkJ9ww" },
              ].map(({ Icon, href }, i) => (
                <a
                  key={i}
                  href={href}
                  className="opacity-90 hover:opacity-100 transition-opacity"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Icon className="h-5 w-5" />
                </a>
              ))}
            </div>
            <p className="text-sm opacity-80 font-body">
              Follow us for real-time updates and breaking news alerts.
            </p>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="font-heading font-bold text-base mb-1 flex items-center gap-2">
              <Mail className="h-4 w-4" /> Newsletter
            </h3>
            <p className="text-sm opacity-90 font-body mb-3">
              Get daily news updates delivered to your inbox
            </p>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email address"
              className="w-full px-3 py-2 text-sm text-foreground bg-background rounded mb-2 focus:outline-none focus:ring-2 focus:ring-secondary"
            />
            <button className="w-full py-2 bg-accent hover:bg-accent/90 text-accent-foreground font-semibold text-sm rounded transition-colors">
              Subscribe
            </button>
            <p className="text-xs opacity-70 mt-2 font-body">Join 10,000+ readers. Unsubscribe anytime.</p>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-background/20">
        <div className="max-w-7xl mx-auto px-6 py-4 text-center text-sm opacity-60 font-body">
          © {new Date().getFullYear()} DominicaNews.DM — All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default SiteFooter;
