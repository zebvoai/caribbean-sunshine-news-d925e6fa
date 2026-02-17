import { User } from "lucide-react";

const SiteHeader = () => {
  return (
    <header className="flex items-center justify-between px-6 py-6 max-w-7xl mx-auto">
      <div className="flex-1" />
      <div className="text-center">
        <h1 className="text-4xl md:text-5xl font-heading font-black tracking-tight leading-none">
          <span className="text-primary">DOMINICA</span>
          <span className="text-secondary italic">NEWS.DM</span>
        </h1>
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
