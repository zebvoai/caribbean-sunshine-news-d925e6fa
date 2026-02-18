
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
      </div>
    </header>
  );
};

export default SiteHeader;
