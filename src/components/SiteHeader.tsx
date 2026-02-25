import { Link } from "react-router-dom";
import logoImg from "@/assets/dominica_logo.png";

const SiteHeader = () => {
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <>
      {/* Top accent bar */}
      <div className="bg-accent text-accent-foreground">
        <div className="max-w-7xl mx-auto px-6 py-1.5 flex items-center justify-between text-xs font-body font-medium tracking-wide">
          <span>{today}</span>
          <span className="hidden sm:inline">Your Trusted Caribbean News Source</span>
        </div>
      </div>

      {/* Main header */}
      <header className="bg-card border-b border-border">
        <div className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
          <div className="flex-1" />
          <Link to="/" className="text-center">
            <img
              src={logoImg}
              alt="DominicaNews.DM"
              className="h-12 md:h-14 w-auto object-contain"
            />
          </Link>
          <div className="flex-1 flex justify-end" />
        </div>
      </header>
    </>
  );
};

export default SiteHeader;
