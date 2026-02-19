import SiteHeader from "@/components/SiteHeader";
import NavBar from "@/components/NavBar";
import SiteFooter from "@/components/SiteFooter";

const AboutPage = () => (
  <div className="min-h-screen bg-background">
    <SiteHeader />
    <NavBar />
    <main className="max-w-3xl mx-auto px-6 py-12 font-body animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
      <h1 className="text-3xl font-heading font-bold text-foreground mb-6">About Us</h1>
      <div className="prose prose-lg text-muted-foreground space-y-4">
        <p>
          Dominica News is the premier news channel dedicated to keeping the people of Dominica informed about the latest happenings on the island and across the Caribbean region.
        </p>
        <p>
          From breaking stories and political developments to weather alerts, sports highlights, and entertainment updates, we are committed to delivering timely, accurate, and trustworthy journalism that matters to our community.
        </p>
        <p>
          Our team of passionate reporters and editors work around the clock to bring you comprehensive coverage of the events shaping Dominica and the wider Caribbean. Whether it's a tropical storm advisory, a parliamentary debate, or a local cultural celebration, Dominica News is your go-to source.
        </p>
        <p>
          We believe in the power of informed communities. By providing accessible, reliable news, we aim to empower Dominicans at home and in the diaspora to stay connected to the issues and stories that define our island nation.
        </p>
        <p className="font-semibold text-foreground">
          Stay informed. Stay connected. Stay Dominican.
        </p>
      </div>
    </main>
    <SiteFooter />
  </div>
);

export default AboutPage;
