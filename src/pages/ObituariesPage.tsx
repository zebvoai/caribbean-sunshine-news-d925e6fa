import TopicLandingPage from "./TopicLandingPage";

const currentYear = new Date().getFullYear();

const ObituariesPage = () => {
  const introHtml = `
    <p><strong>Dominica obituaries and death announcements</strong> — Dominica News publishes tributes, funeral notices and remembrances for members of the Dominican community at home and in the diaspora. Family and friends can find recent death announcements, funeral service details and messages of condolence below.</p>
    <p class="text-sm">To submit an obituary or funeral notice, contact our newsroom via the <a href="/page/contact" class="text-primary underline">contact page</a>.</p>
  `;

  return (
    <TopicLandingPage
      canonicalPath="/obituaries"
      seoTitle={`Dominica Obituaries & Death Announcements ${currentYear}`}
      seoDescription="Dominica obituaries, death announcements and funeral notices from Dominica News — tributes and remembrances for the Dominican community at home and abroad."
      heading="Obituaries & Death Announcements"
      kicker="In Memoriam"
      introHtml={introHtml}
      editableSlug="obituaries"
      queries={[
        "obituary",
        "death announcement",
        "funeral",
        "passing of",
        "tribute",
        "in memoriam",
      ]}
      breadcrumbLabel="Obituaries"
      limit={48}
    />
  );
};

export default ObituariesPage;
