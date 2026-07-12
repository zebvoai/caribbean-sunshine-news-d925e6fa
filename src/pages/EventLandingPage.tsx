import { useParams, Navigate } from "react-router-dom";
import TopicLandingPage from "./TopicLandingPage";

type EventKey = "dominica-carnival" | "wcmf" | "miss-dominica";

interface EventConfig {
  name: string;
  kicker: string;
  queries: (year: string) => string[];
  intro: (year: string) => string;
  seoTitle: (year: string) => string;
  seoDesc: (year: string) => string;
  urlPrefix: string; // e.g. "dominica-carnival"
  location: string;
}

const EVENTS: Record<EventKey, EventConfig> = {
  "dominica-carnival": {
    name: "Dominica Carnival",
    kicker: "Real Mas • The Nature Isle",
    urlPrefix: "dominica-carnival",
    location: "Roseau, Dominica",
    queries: (year) => ["Dominica Carnival", "Mas Domnik", `Carnival ${year}`, "Calypso Monarch"],
    intro: (year) =>
      `<p><strong>Dominica Carnival ${year}</strong> — known locally as <em>Mas Domnik</em> — is the Nature Isle's biggest cultural celebration, blending calypso, bouyon, sensay costumes and street parades in Roseau. This landing page is the home for our full Carnival ${year} coverage: results, road march winners, Calypso Monarch and Queen of Carnival updates, plus behind-the-scenes reporting from bands and mas camps across Dominica.</p>`,
    seoTitle: (year) => `Dominica Carnival ${year}: Mas Domnik News, Results & Live Coverage`,
    seoDesc: (year) =>
      `Dominica Carnival ${year} coverage from Dominica News — Mas Domnik parades, Calypso Monarch, Queen of Carnival, bouyon, road march and full results.`,
  },
  wcmf: {
    name: "World Creole Music Festival",
    kicker: "WCMF • Windsor Park Stadium",
    urlPrefix: "wcmf",
    location: "Windsor Park Stadium, Roseau, Dominica",
    queries: (year) => ["World Creole Music Festival", "WCMF", `Creole Music Festival ${year}`, "bouyon", "zouk"],
    intro: (year) =>
      `<p>The <strong>World Creole Music Festival ${year}</strong> (WCMF) returns to Windsor Park Stadium in Roseau, celebrating creole music from across the Caribbean, Africa and the diaspora — zouk, bouyon, cadence-lypso, kompa, soukous and more. Dominica News covers the full WCMF ${year} lineup, night-by-night reviews, ticket news and cultural coverage from the world's premier creole music event.</p>`,
    seoTitle: (year) => `World Creole Music Festival ${year} (WCMF): Lineup, Tickets & News`,
    seoDesc: (year) =>
      `World Creole Music Festival ${year} (WCMF) in Dominica — full lineup, tickets, nightly reviews, bouyon and zouk coverage from Dominica News.`,
  },
  "miss-dominica": {
    name: "Miss Dominica",
    kicker: "National Queen Show • Carnival Season",
    urlPrefix: "miss-dominica",
    location: "Roseau, Dominica",
    queries: (year) => ["Miss Dominica", `Miss Dominica ${year}`, "Queen of Carnival", "National Queen Show"],
    intro: (year) =>
      `<p>The <strong>Miss Dominica ${year}</strong> National Queen Show crowns the country's Queen of Carnival ahead of Mas Domnik. Dominica News follows every contestant — profiles, evening wear, talent night, sponsors and results — and delivers full coverage of the pageant that launches Dominica's Carnival season.</p>`,
    seoTitle: (year) => `Miss Dominica ${year}: Contestants, Results & Queen of Carnival News`,
    seoDesc: (year) =>
      `Miss Dominica ${year} pageant coverage from Dominica News — contestants, results, Queen of Carnival, National Queen Show highlights and photos.`,
  },
};

const EventLandingPage = ({ eventKey }: { eventKey: EventKey }) => {
  const { year } = useParams<{ year: string }>();
  const cfg = EVENTS[eventKey];

  if (!year || !/^\d{4}$/.test(year)) {
    return <Navigate to="/" replace />;
  }

  const eventJsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: `${cfg.name} ${year}`,
    description: cfg.seoDesc(year),
    startDate: `${year}-01-01`,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: {
      "@type": "Place",
      name: cfg.location,
      address: { "@type": "PostalAddress", addressLocality: "Roseau", addressCountry: "DM" },
    },
    organizer: { "@type": "Organization", name: "Dominica News", url: "https://www.dominicanews.dm" },
  };

  return (
    <TopicLandingPage
      canonicalPath={`/${cfg.urlPrefix}-${year}`}
      seoTitle={cfg.seoTitle(year)}
      seoDescription={cfg.seoDesc(year)}
      heading={`${cfg.name} ${year}`}
      kicker={cfg.kicker}
      introHtml={cfg.intro(year)}
      editableSlug={`${cfg.urlPrefix}-${year}`}
      queries={cfg.queries(year)}
      breadcrumbLabel={`${cfg.name} ${year}`}
      extraJsonLd={[eventJsonLd]}
    />
  );
};

export default EventLandingPage;
