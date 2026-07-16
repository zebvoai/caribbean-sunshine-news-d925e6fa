import TopicLandingPage from "./TopicLandingPage";

/**
 * Static evergreen landing pages for high-intent local & seasonal SEO.
 * Each renders TopicLandingPage with focused queries + FAQs.
 */

export const RoseauNewsPage = () => (
  <TopicLandingPage
    canonicalPath="/roseau-news"
    seoTitle="Roseau News | Dominica News"
    seoDescription="Latest news from Roseau, the capital of Dominica — government, business, community, crime and cultural stories from downtown Roseau and greater Roseau Valley."
    heading="Roseau News"
    kicker="Capital city coverage"
    breadcrumbLabel="Roseau"
    introHtml={`
      <p>Roseau is the capital of the Commonwealth of Dominica and the political, commercial and cultural heart of the Nature Isle. Dominica News reports daily on Roseau — from decisions inside Parliament and the Financial Centre to community stories out of Newtown, Goodwill, Bath Estate, Pottersville and Roseau Valley.</p>
      <p>Follow this page for the latest news from Roseau, including government announcements, business openings, crime and court reporting, road updates, cruise-season activity along the Bayfront, and coverage of festivals and cultural events across the capital.</p>
    `}
    queries={["Roseau", "capital of Dominica", "Bayfront Roseau", "Roseau Valley"]}
    faqs={[
      { question: "What is the capital of Dominica?", answer: "Roseau is the capital and largest city of the Commonwealth of Dominica. It sits on the west coast and is home to Parliament, the Financial Centre and most government ministries." },
      { question: "What neighbourhoods are covered under Roseau news?", answer: "Our Roseau coverage includes downtown Roseau, Newtown, Goodwill, Pottersville, Bath Estate, Kingshill, Elmshall and the wider Roseau Valley communities." },
      { question: "Where can I get updates on Roseau road closures and events?", answer: "Dominica News publishes verified road closure notices, event permits and traffic advisories from the Ministry of Public Works and the Roseau City Council as they are issued." },
    ]}
  />
);

export const PortsmouthNewsPage = () => (
  <TopicLandingPage
    canonicalPath="/portsmouth-news"
    seoTitle="Portsmouth News | Dominica News"
    seoDescription="Latest news from Portsmouth, Dominica's second city — Cabrits, Ross University, Prince Rupert Bay, business, community and cultural updates from the north."
    heading="Portsmouth News"
    kicker="Northern Dominica coverage"
    breadcrumbLabel="Portsmouth"
    introHtml={`
      <p>Portsmouth is Dominica's second largest town and the anchor of the north — home to the Cabrits National Park, Prince Rupert Bay cruise berth, Ross University School of Medicine and vibrant communities from Glanvillia to Lagon and Picard.</p>
      <p>Follow this page for Portsmouth news covering local government, tourism, university life, agriculture, fisheries and community events across the northern Dominica region.</p>
    `}
    queries={["Portsmouth", "Cabrits", "Ross University", "Prince Rupert Bay", "Picard"]}
    faqs={[
      { question: "Where is Portsmouth in Dominica?", answer: "Portsmouth is on the north-west coast of Dominica along Prince Rupert Bay, roughly 40 km north of the capital Roseau. It is the second-largest town in the country." },
      { question: "What are the main institutions in Portsmouth?", answer: "Portsmouth is home to Ross University School of Medicine, the Cabrits National Park, the Portsmouth Health Centre and the Prince Rupert Bay cruise berth." },
      { question: "Does Dominica News cover northern communities beyond Portsmouth?", answer: "Yes — we cover Portsmouth alongside surrounding communities such as Picard, Glanvillia, Lagon, Tanetane, Savanne Paille and the wider Saint John parish." },
    ]}
  />
);

export const HurricaneSeasonPage = () => (
  <TopicLandingPage
    canonicalPath="/hurricane-season-dominica"
    seoTitle="Dominica Hurricane Season — Alerts, Forecasts & Preparedness"
    seoDescription="Live Dominica hurricane season coverage — tropical storm alerts, forecasts, shelter locations and preparedness guidance from the Dominica Met Office and ODM."
    heading="Dominica Hurricane Season"
    kicker="June 1 – November 30"
    breadcrumbLabel="Hurricane Season"
    introHtml={`
      <p>The Atlantic hurricane season runs from <strong>June 1 to November 30</strong>, with peak activity between August and October. Dominica lies in the heart of the Eastern Caribbean hurricane belt and residents are urged to prepare emergency kits, review evacuation routes and monitor advisories from the <strong>Dominica Meteorological Service</strong> and the <strong>Office of Disaster Management (ODM)</strong>.</p>
      <p>Dominica News delivers real-time hurricane and tropical storm coverage — advisories, shelter openings, road and airport closures, power and water outages, and post-storm damage reports — sourced from official government channels and the National Hurricane Center (NHC).</p>
    `}
    queries={["hurricane", "tropical storm", "hurricane season", "ODM", "Dominica Meteorological", "storm alert"]}
    faqs={[
      { question: "When is hurricane season in Dominica?", answer: "The Atlantic hurricane season officially runs from June 1 to November 30 each year, with the highest storm activity between mid-August and mid-October." },
      { question: "Where can I find official hurricane advisories for Dominica?", answer: "Official advisories come from the Dominica Meteorological Service and the Office of Disaster Management (ODM). Dominica News publishes verified bulletins as they are issued." },
      { question: "What should I have in a hurricane emergency kit?", answer: "The ODM recommends at least 72 hours of drinking water, non-perishable food, medications, flashlights and batteries, a battery-powered radio, first aid supplies, important documents in a waterproof bag, and cash." },
      { question: "Which past hurricanes have hit Dominica?", answer: "Dominica has been struck by several major hurricanes including Hurricane David (1979), Hurricane Maria (2017) and Tropical Storm Erika (2015), each causing significant loss of life and infrastructure damage." },
    ]}
  />
);

export const ElectionsPage = () => (
  <TopicLandingPage
    canonicalPath="/dominica-elections"
    seoTitle="Dominica Elections — Results, Candidates & Analysis"
    seoDescription="Full Dominica general election coverage — candidates, constituencies, results, analysis and reaction from the DLP, UWP and independent observers."
    heading="Dominica Elections"
    kicker="General elections coverage"
    breadcrumbLabel="Elections"
    introHtml={`
      <p>Dominica holds general elections at least every five years under the Westminster parliamentary system. Voters elect representatives across 21 constituencies, with the party or coalition holding the majority forming the government.</p>
      <p>Dominica News tracks the full election cycle — candidate nominations, campaign rallies, manifestos, polling day operations, results by constituency and post-election analysis — with independent reporting on the <strong>Dominica Labour Party (DLP)</strong>, the <strong>United Workers Party (UWP)</strong> and other contesting parties.</p>
    `}
    queries={["election", "elections", "DLP", "UWP", "polling", "constituency", "electoral office"]}
    faqs={[
      { question: "How often are general elections held in Dominica?", answer: "Under the Constitution, general elections must be held at least every five years. The Prime Minister may advise the President to dissolve Parliament and call elections earlier." },
      { question: "Who won the last Dominica general election?", answer: "The Dominica Labour Party (DLP), led by Prime Minister Roosevelt Skerrit, won the most recent general election held in December 2022." },
      { question: "How many constituencies are there in Dominica?", answer: "Dominica has 21 single-member constituencies. The party or coalition winning the majority of seats forms the government." },
      { question: "Who runs elections in Dominica?", answer: "The Electoral Office of Dominica administers elections, manages voter registration and publishes official results." },
    ]}
  />
);
