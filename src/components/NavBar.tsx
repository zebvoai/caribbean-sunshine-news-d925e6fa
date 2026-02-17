const navItems = ["Home", "Caribbean", "Dominica", "News", "Politics", "Weather"];

const NavBar = () => {
  return (
    <nav className="border-y border-border">
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-1 px-4">
        {navItems.map((item) => (
          <button
            key={item}
            className={`px-5 py-3 text-sm font-body font-semibold transition-colors ${
              item === "Home"
                ? "text-nav-active border-b-2 border-nav-active"
                : "text-foreground hover:bg-nav-hover"
            }`}
          >
            {item}
          </button>
        ))}
      </div>
    </nav>
  );
};

export default NavBar;
