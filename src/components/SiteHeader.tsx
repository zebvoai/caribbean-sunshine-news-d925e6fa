import { User } from "lucide-react";
import logoImg from "@/assets/dominica_logo.png";

const SiteHeader = () => {
  return (
    <header className="flex items-center justify-between px-6 py-5 max-w-7xl mx-auto">
      <div className="flex-1" />
      <div className="text-center">
        <img
          src={logoImg}
          alt="DominicaNews.DM"
          className="h-14 md:h-16 w-auto object-contain"
        />
      </div>
      <div className="flex-1 flex justify-end">
        <div className="flex items-center gap-2 text-muted-foreground">
          <User className="h-5 w-5" />
          <span className="text-sm font-body font-medium">Surabhi</span>
        </div>
      </div>
    </header>
  );
};

export default SiteHeader;
