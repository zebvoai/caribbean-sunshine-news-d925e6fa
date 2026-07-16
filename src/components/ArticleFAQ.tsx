import { useEffect } from "react";

type FAQ = { q: string; a: string };

const FAQ_MAP: Record<string, { title: string; items: FAQ[] }> = {
  weather: {
    title: "Dominica Weather & Storm FAQ",
    items: [
      {
        q: "Where can I find the latest Dominica weather forecast?",
        a: "Dominica News publishes daily weather updates, hurricane advisories and tropical storm bulletins from the Dominica Meteorological Service. Visit our Weather category for the latest forecast, radar and storm tracking updates.",
      },
      {
        q: "How does Dominica prepare for hurricanes and tropical storms?",
        a: "The Office of Disaster Management (ODM) coordinates preparation, evacuation and shelters. During an active storm we publish real-time updates including shelter locations, road closures, power outages and official government statements.",
      },
      {
        q: "When is the Atlantic hurricane season in Dominica?",
        a: "The Atlantic hurricane season runs from June 1 to November 30, with peak activity between August and October. Dominica lies in the hurricane belt of the Eastern Caribbean and residents are advised to prepare emergency kits early each season.",
      },
    ],
  },
  politics: {
    title: "Dominica Politics & Government FAQ",
    items: [
      {
        q: "Who is the current Prime Minister of Dominica?",
        a: "Roosevelt Skerrit of the Dominica Labour Party (DLP) is the Prime Minister of Dominica. He has led the country since January 2004. Follow our Politics category for the latest news on Parliament, Cabinet decisions and elections.",
      },
      {
        q: "What is Dominica's Citizenship by Investment (CBI) programme?",
        a: "Dominica's CBI programme, established in 1993, allows individuals to obtain Dominican citizenship through an approved economic contribution or real estate investment. It is one of the oldest and most reputable CBI programmes in the Caribbean.",
      },
      {
        q: "When are general elections held in Dominica?",
        a: "General elections in Dominica are constitutionally held at least every five years. The most recent general election was held in December 2022 and was won by the Dominica Labour Party.",
      },
    ],
  },
  news: {
    title: "Dominica News FAQ",
    items: [
      {
        q: "What is Dominica News?",
        a: "Dominica News is a leading independent online newsroom covering the latest news from Dominica and the wider Caribbean — politics, weather, business, community and breaking news updates from Roseau, Portsmouth and across the Nature Isle.",
      },
      {
        q: "How often is Dominica News updated?",
        a: "We publish breaking news and daily updates from across Dominica every day, with live coverage during major events such as elections, storms, Carnival and the World Creole Music Festival.",
      },
      {
        q: "Where can I read breaking news from Dominica?",
        a: "Visit dominicanews.dm for the latest breaking news in Dominica, including real-time live updates, verified reports and official statements from government and community sources.",
      },
    ],
  },
  caribbean: {
    title: "Caribbean News FAQ",
    items: [
      {
        q: "What Caribbean news does Dominica News cover?",
        a: "We cover regional news across the Caribbean including CARICOM affairs, Eastern Caribbean politics, natural disasters, sport, culture and diaspora stories affecting Dominica and its neighbours.",
      },
      {
        q: "Is Dominica part of CARICOM and the OECS?",
        a: "Yes. Dominica is a member of both the Caribbean Community (CARICOM) and the Organisation of Eastern Caribbean States (OECS), and participates in regional trade, security and foreign policy initiatives.",
      },
    ],
  },
};

const ArticleFAQ = ({ categorySlug }: { categorySlug?: string | null }) => {
  const key = (categorySlug || "").toLowerCase();
  const faq = FAQ_MAP[key];

  useEffect(() => {
    if (!faq) return;
    const schema = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faq.items.map((i) => ({
        "@type": "Question",
        name: i.q,
        acceptedAnswer: { "@type": "Answer", text: i.a },
      })),
    };
    let el = document.querySelector('script[type="application/ld+json"][data-faq="1"]');
    if (!el) {
      el = document.createElement("script");
      el.setAttribute("type", "application/ld+json");
      el.setAttribute("data-faq", "1");
      document.head.appendChild(el);
    }
    el.textContent = JSON.stringify(schema);
    return () => {
      el?.parentNode?.removeChild(el);
    };
  }, [faq]);

  if (!faq) return null;

  return (
    <section
      className="mb-14 animate-fade-in-up"
      style={{ animationDelay: "0.42s" }}
      aria-label={faq.title}
    >
      <div className="flex items-center gap-4 mb-6">
        <div className="w-1 h-7 bg-primary rounded-full" />
        <h2 className="font-heading font-bold text-xl text-foreground tracking-tight">
          {faq.title}
        </h2>
        <div className="flex-1 h-px bg-gradient-to-r from-border to-transparent" />
      </div>
      <div className="space-y-3">
        {faq.items.map((item, idx) => (
          <details
            key={idx}
            className="group rounded-2xl border border-border/60 bg-card p-5 open:shadow-sm transition-all"
          >
            <summary className="cursor-pointer list-none flex items-start justify-between gap-4">
              <h3 className="font-heading font-semibold text-base text-foreground leading-snug">
                {item.q}
              </h3>
              <span className="shrink-0 text-primary text-xl leading-none transition-transform group-open:rotate-45">
                +
              </span>
            </summary>
            <p className="mt-3 text-sm text-muted-foreground font-body leading-relaxed">
              {item.a}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
};

export default ArticleFAQ;
