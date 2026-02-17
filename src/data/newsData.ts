import news1 from "@/assets/news-1.jpg";
import news2 from "@/assets/news-2.jpg";
import news3 from "@/assets/news-3.jpg";
import news4 from "@/assets/news-4.jpg";
import news5 from "@/assets/news-5.jpg";
import news6 from "@/assets/news-6.jpg";
import news7 from "@/assets/news-7.jpg";
import news8 from "@/assets/news-8.jpg";
import news9 from "@/assets/news-9.jpg";
import news10 from "@/assets/news-10.jpg";
import news11 from "@/assets/news-11.jpg";
import news12 from "@/assets/news-12.jpg";

export interface NewsArticle {
  id: number;
  title: string;
  excerpt: string;
  category: string;
  source: string;
  date: string;
  image: string;
}

export const newsArticles: NewsArticle[] = [
  {
    id: 1,
    title: "Chester 'Daddy Chess' Letang Crowned as Dominica's 2026 Calypso Monarch",
    excerpt: "On February 14, 2026, ten calypsonians took the stage at Windsor Park Sports Stadium, delivering passionate performances in a night of culture and music.",
    category: "News",
    source: "Dominica News",
    date: "February 16, 2026",
    image: news1,
  },
  {
    id: 2,
    title: "Dominica Launches Minimum Wage Hotline to Ensure Fair Labour Practices and Compliance",
    excerpt: "The Government of Dominica has introduced a dedicated minimum wage hotline to assist in the implementation of the new labour regulations across the island.",
    category: "News",
    source: "Dominica News",
    date: "February 11, 2026",
    image: news2,
  },
  {
    id: 3,
    title: "Government to Build New Agro-Processing Facilities for Honey and Pepper Sauce Production",
    excerpt: "The Government of Dominica plans to build two agro-processing facilities to support honey and pepper sauce manufacturing for export markets.",
    category: "News",
    source: "Dominica News",
    date: "February 11, 2026",
    image: news3,
  },
  {
    id: 4,
    title: "Parliament Approves New Budget Allocation for Infrastructure Development",
    excerpt: "Members of Parliament voted unanimously to approve a $150 million allocation for critical infrastructure projects across the island nation.",
    category: "Politics",
    source: "Dominica News",
    date: "February 10, 2026",
    image: news4,
  },
  {
    id: 5,
    title: "Tropical Storm Watch Issued for Eastern Caribbean as System Approaches",
    excerpt: "The Dominica Meteorological Service has issued a tropical storm watch as a developing weather system tracks toward the eastern Caribbean islands.",
    category: "Weather",
    source: "Dominica News",
    date: "February 9, 2026",
    image: news5,
  },
  {
    id: 6,
    title: "Banana Industry Records Highest Export Numbers in Over a Decade",
    excerpt: "Dominica's banana farmers celebrate a record-breaking season with export figures surpassing expectations, boosting the agricultural economy significantly.",
    category: "Dominica",
    source: "Dominica News",
    date: "February 8, 2026",
    image: news6,
  },
  {
    id: 7,
    title: "New State-of-the-Art Medical Facility Opens in Portsmouth",
    excerpt: "The recently completed Portsmouth Health Centre was officially opened, providing modern healthcare services to residents in the northern parishes.",
    category: "News",
    source: "Dominica News",
    date: "February 7, 2026",
    image: news7,
  },
  {
    id: 8,
    title: "Cruise Tourism Sees Record Arrivals in Roseau Port This Season",
    excerpt: "Over 200,000 cruise passengers have visited Dominica this season, marking a significant milestone for the island's growing tourism sector.",
    category: "Caribbean",
    source: "Dominica News",
    date: "February 6, 2026",
    image: news8,
  },
  {
    id: 9,
    title: "Government Launches Island-Wide Digital Literacy Programme for Schools",
    excerpt: "A comprehensive digital literacy initiative will provide tablets and internet access to all public school students starting in September 2026.",
    category: "News",
    source: "Dominica News",
    date: "February 5, 2026",
    image: news9,
  },
  {
    id: 10,
    title: "Dominica Advances Geothermal and Solar Energy Projects for 2026",
    excerpt: "The island's ambitious renewable energy programme moves forward with new solar installations and geothermal plant expansion plans announced this week.",
    category: "Dominica",
    source: "Dominica News",
    date: "February 4, 2026",
    image: news10,
  },
  {
    id: 11,
    title: "Local Fishing Cooperatives Receive New Equipment and Training Support",
    excerpt: "Fishing communities across Dominica benefit from a government initiative providing modern equipment and professional training programmes.",
    category: "Caribbean",
    source: "Dominica News",
    date: "February 3, 2026",
    image: news11,
  },
  {
    id: 12,
    title: "Major Road Improvement Project Connects Rural Communities to Capital",
    excerpt: "A transformative infrastructure project improves road connectivity between remote villages and Roseau, reducing travel times significantly.",
    category: "Politics",
    source: "Dominica News",
    date: "February 2, 2026",
    image: news12,
  },
];
