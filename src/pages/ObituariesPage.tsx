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
      faqs={[
        {
          question: "How do I submit an obituary or death announcement to Dominica News?",
          answer:
            "Send the full name of the deceased, date of passing, a short biography (200–400 words), funeral service details and a high-resolution photo to the Dominica News newsroom via the contact page. Our editors publish free community notices as quickly as possible.",
        },
        {
          question: "Is there a fee to publish an obituary?",
          answer:
            "Standard community death announcements are published free of charge. Extended tribute features with additional photos, family messages and homegoing service programmes are available on request.",
        },
        {
          question: "How soon will the obituary appear on the site?",
          answer:
            "Once we receive the details and confirm them with the family or funeral home, most obituaries are published within a few hours and shared across our social channels and RSS feed.",
        },
        {
          question: "Can I add condolences or tributes?",
          answer:
            "Yes. Family, friends and the wider Dominican diaspora can share messages of condolence by writing to the newsroom, and selected tributes are added to the article.",
        },
      ]}
    />
  );
};

export default ObituariesPage;
