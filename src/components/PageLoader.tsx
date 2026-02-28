import logo from "@/assets/dominica_logo.png";

interface PageLoaderProps {
  /** "splash" = full-screen with logo (first visit), "page" = top progress bar */
  variant?: "splash" | "page";
}

const PageLoader = ({ variant = "page" }: PageLoaderProps) => {
  if (variant === "splash") {
    return (
      <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background">
        <img src={logo} alt="Dominica News" className="h-14 sm:h-16 mb-8 animate-scale-in" />
        <div className="w-48 sm:w-64 h-1.5 rounded-full bg-muted overflow-hidden mb-4">
          <div className="h-full rounded-full bg-gradient-to-r from-primary to-primary/60 animate-[loader_1.4s_ease-in-out_infinite]" />
        </div>
        <p className="text-sm text-muted-foreground font-body animate-fade-in">
          Loading your experience...
        </p>
      </div>
    );
  }

  // Lightweight top-bar loader for page transitions
  return (
    <div className="fixed top-0 left-0 right-0 z-[9998]">
      <div className="h-1 bg-muted overflow-hidden">
        <div className="h-full bg-gradient-to-r from-primary to-primary/60 animate-[loader_1.4s_ease-in-out_infinite]" />
      </div>
    </div>
  );
};

export default PageLoader;
