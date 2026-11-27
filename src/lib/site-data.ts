/**
 * Machine-readable facts about the business, derived from the CMS content.
 * Feeds /agent/site.json and /llms.txt.
 */
import { site } from "@/data/site";
import { getProjectMedia } from "@/lib/gallery";
import { markdownToText } from "@/lib/markdown";

const url = (path: string) => `${site.siteUrl}${path}`;

export function getSiteData() {
  return {
    name: site.name,
    url: url("/"),
    language: site.language,
    description: site.description,
    highlights: site.home.trust.items.map(({ title, text }) => ({ title, description: text })),
    credentials: site.credentials,
    services: [
      ...site.pricing.project.stages.map((stage) => ({ name: stage.label, description: stage.text, priceFrom: stage.priceSmall, currency: "EUR" })),
      ...site.pricing.ecb.buildings.filter((b) => b.price > 0).map((b) => ({ name: `Energetický certifikát – ${b.label}`, priceFrom: b.price, currency: "EUR" })),
    ],
    priceNote: site.pricing.note,
    projects: site.projects.map((project) => ({
      title: project.title,
      subtitle: project.subtitle ?? null,
      description: markdownToText(project.text),
      url: url(`/referencie/#${project.slug}`),
      photos: getProjectMedia(project).length,
    })),
    faq: site.home.faq,
    contact: {
      address: site.company.address,
      geo: site.company.geo,
      note: site.company.openingNote,
      openingHours: site.company.openingHours,
      people: site.company.contacts,
      company: { legalName: site.company.legalName, ico: site.company.ico },
      social: site.social,
      contactPage: url("/kontakt/"),
    },
    pages: site.nav.map((item) => ({ title: item.label, url: url(item.href) })),
  };
}

export type SiteFacts = ReturnType<typeof getSiteData>;
