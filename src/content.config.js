import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const localizedScheduleItem = z.object({
  label: z.string(),
  labelZh: z.string(),
  value: z.string(),
  valueZh: z.string(),
});

const localizedTransportLink = z.object({
  label: z.string(),
  labelZh: z.string(),
  url: z.string().url(),
});

const localizedTransitLine = z.object({
  label: z.string(),
  labelZh: z.string(),
  color: z.string().regex(/^#[0-9a-f]{6}$/i),
});

const localizedTransportMethod = localizedScheduleItem.extend({
  lines: z.array(localizedTransitLine).min(1).optional(),
  links: z.array(localizedTransportLink).min(1),
});

const localizedVenueInformation = localizedScheduleItem.extend({
  href: z.string().regex(/^(?:mailto:|tel:)/).optional(),
  links: z.array(localizedTransportLink).min(1).optional(),
});

const localizedFacility = z.object({
  title: z.string(),
  titleZh: z.string(),
  description: z.string(),
  descriptionZh: z.string(),
});

const localizedPhoto = z.object({
  image: z.string(),
  caption: z.string(),
  captionZh: z.string(),
  credit: z.string().optional(),
  license: z.string().optional(),
  sourceUrl: z.string().url().optional(),
});

const localizedPageFields = {
  eyebrow: z.string(),
  eyebrowZh: z.string(),
  title: z.string(),
  titleZh: z.string(),
  description: z.string(),
  descriptionZh: z.string(),
};

const venues = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/venues' }),
  schema: z.object({
    venue: z.enum(['hkc', 'qes', 'kta', 'kts', 'awe', 'awe-halls']),
    description: z.string(),
    descriptionZh: z.string(),
    cardDescription: z.string(),
    cardDescriptionZh: z.string(),
    cover: z.string(),
    openingHoursIntro: z.string(),
    openingHoursIntroZh: z.string(),
    openingHours: z.array(localizedScheduleItem).min(1),
    transport: z.string(),
    transportZh: z.string(),
    transportMethods: z.array(localizedTransportMethod).min(1),
    address: z.string(),
    addressZh: z.string(),
    mapNote: z.string(),
    mapNoteZh: z.string(),
    mapEmbedUrl: z.string().url(),
    mapUrl: z.string().url(),
    venueInformationIntro: z.string(),
    venueInformationIntroZh: z.string(),
    venueInformation: z.array(localizedVenueInformation).min(2),
    facilitiesIntro: z.string(),
    facilitiesIntroZh: z.string(),
    facilities: z.array(localizedFacility).min(1),
    galleryIntro: z.string(),
    galleryIntroZh: z.string(),
    gallery: z.array(localizedPhoto).min(1),
  }),
});

const concerts = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/concerts' }),
  schema: z.object({
    year: z.number().int(),
    range: z.string(),
    label: z.string(),
    labelZh: z.string(),
    events: z.array(z.object({
      date: z.string(),
      dateZh: z.string(),
      endsOn: z.string().date(),
      title: z.string(),
      titleZh: z.string(),
      meta: z.string(),
      metaZh: z.string(),
    })).min(1),
  }),
});

const guidePosts = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/guides' }),
  schema: z.object({
    locale: z.enum(['en', 'zh-HK']),
    translationKey: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    title: z.string(),
    description: z.string(),
    publishedAt: z.string().date(),
    order: z.number().int().positive(),
  }),
});

const pages = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/pages' }),
  schema: z.discriminatedUnion('type', [
    z.object({
      type: z.literal('guide'),
      ...localizedPageFields,
    }),
    z.object({
      type: z.literal('concerts'),
      ...localizedPageFields,
    }),
    z.object({
      type: z.literal('home'),
      hero: z.object({
        eyebrow: z.string(),
        eyebrowZh: z.string(),
        title: z.string(),
        titleZh: z.string(),
        titleAccent: z.string(),
        titleAccentZh: z.string(),
        description: z.string(),
        descriptionZh: z.string(),
        primaryAction: z.object({
          label: z.string(),
          labelZh: z.string(),
          href: z.string(),
        }),
        secondaryAction: z.object({
          label: z.string(),
          labelZh: z.string(),
          href: z.string(),
        }),
      }),
      board: z.object({
        title: z.string(),
        titleZh: z.string(),
        note: z.string(),
        noteZh: z.string(),
      }),
      paths: z.object({
        eyebrow: z.string(),
        eyebrowZh: z.string(),
        title: z.string(),
        titleZh: z.string(),
        description: z.string(),
        descriptionZh: z.string(),
        items: z.array(z.object({
          title: z.string(),
          titleZh: z.string(),
          description: z.string(),
          descriptionZh: z.string(),
          action: z.string(),
          actionZh: z.string(),
          href: z.string(),
        })).min(1),
      }),
      venueDirectory: z.object({
        eyebrow: z.string(),
        eyebrowZh: z.string(),
        title: z.string(),
        titleZh: z.string(),
        description: z.string(),
        descriptionZh: z.string(),
      }),
    }),
    z.object({
      type: z.literal('venue-directory'),
      ...localizedPageFields,
    }),
    z.object({
      type: z.literal('legal'),
      ...localizedPageFields,
      updated: z.string(),
      updatedZh: z.string(),
      sections: z.array(z.object({
        title: z.string(),
        titleZh: z.string(),
        paragraphs: z.array(z.object({
          text: z.string(),
          textZh: z.string(),
        })).min(1),
      })).min(1),
    }),
  ]),
});

export const collections = { concerts, guidePosts, pages, venues };
