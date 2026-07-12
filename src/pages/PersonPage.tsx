import { useParams } from "react-router-dom";
import TopicLandingPage from "./TopicLandingPage";
import NotFound from "./NotFound";

interface PersonProfile {
  slug: string;
  fullName: string;
  role: string;
  birthDate?: string;
  deathDate?: string;
  imageUrl?: string;
  bioHtml: string;
  queries: string[];
  seoDesc: string;
}

const PEOPLE: Record<string, PersonProfile> = {
  "patrick-john": {
    slug: "patrick-john",
    fullName: "Patrick John",
    role: "First Prime Minister of Dominica (1978–1979)",
    birthDate: "1938-01-07",
    deathDate: "2021-07-06",
    bioHtml: `
      <p><strong>Patrick Roland John</strong> served as the first Prime Minister of the Commonwealth of Dominica from independence in November 1978 until his ouster in June 1979. A former Chief Minister and Premier, John led the Dominica Labour Party and negotiated the country's independence from Britain.</p>
      <p>His tenure was cut short following the 1979 civil unrest and later the alleged 1981 coup attempt in which he was implicated. Patrick John remains one of the most consequential — and debated — figures in modern Dominican political history.</p>
    `,
    queries: ["Patrick John", "Patrick Roland John", "first Prime Minister Dominica"],
    seoDesc:
      "Patrick John (1938–2021) — biography and news coverage of Dominica's first Prime Minister, Labour Party leader and defining figure of the independence era.",
  },
  "dame-eugenia-charles": {
    slug: "dame-eugenia-charles",
    fullName: "Dame Eugenia Charles",
    role: "Prime Minister of Dominica (1980–1995)",
    birthDate: "1919-05-15",
    deathDate: "2005-09-06",
    bioHtml: `
      <p><strong>Dame Mary Eugenia Charles</strong> was the Caribbean's first female Prime Minister and Dominica's longest-serving head of government. Elected in 1980 following the collapse of the Patrick John administration, she led the Dominica Freedom Party through three terms.</p>
      <p>Internationally known as the "Iron Lady of the Caribbean", Dame Eugenia played a pivotal role in the 1983 US-led intervention in Grenada. She retired from politics in 1995 and was made a Dame of the British Empire.</p>
    `,
    queries: ["Eugenia Charles", "Dame Eugenia", "Iron Lady of the Caribbean"],
    seoDesc:
      "Dame Eugenia Charles (1919–2005) — biography and legacy of the Caribbean's first female Prime Minister and Dominica's longest-serving head of government.",
  },
  "roosevelt-skerrit": {
    slug: "roosevelt-skerrit",
    fullName: "Roosevelt Skerrit",
    role: "Prime Minister of Dominica (2004–present)",
    birthDate: "1972-06-08",
    bioHtml: `
      <p><strong>Roosevelt Skerrit</strong> has served as Prime Minister of Dominica since January 2004, when he became the world's youngest sitting head of government at the age of 31. He leads the Dominica Labour Party (DLP) and represents the Vieille Case constituency.</p>
      <p>His administration has overseen major infrastructure projects, the recovery from Hurricane Maria (2017) and Dominica's Citizenship by Investment programme.</p>
    `,
    queries: ["Roosevelt Skerrit", "Prime Minister Skerrit", "Skerrit"],
    seoDesc:
      "Roosevelt Skerrit — biography, political career and latest news on Dominica's Prime Minister and leader of the Dominica Labour Party.",
  },
};

const PersonPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const person = slug ? PEOPLE[slug] : undefined;

  if (!person) return <NotFound />;

  const personLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: person.fullName,
    jobTitle: person.role,
    ...(person.birthDate ? { birthDate: person.birthDate } : {}),
    ...(person.deathDate ? { deathDate: person.deathDate } : {}),
    ...(person.imageUrl ? { image: person.imageUrl } : {}),
    url: `https://www.dominicanews.dm/people/${person.slug}`,
    nationality: { "@type": "Country", name: "Dominica" },
  };

  return (
    <TopicLandingPage
      canonicalPath={`/people/${person.slug}`}
      seoTitle={`${person.fullName} — ${person.role}`}
      seoDescription={person.seoDesc}
      heading={person.fullName}
      kicker={person.role}
      introHtml={person.bioHtml}
      editableSlug={`people-${person.slug}`}
      queries={person.queries}
      breadcrumbLabel={person.fullName}
      extraJsonLd={[personLd]}
      limit={36}
    />
  );
};

export default PersonPage;
