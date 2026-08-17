import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const localizedScheduleItem = z.object({
  label: z.string(),
  labelZh: z.string(),
  value: z.string(),
  valueZh: z.string(),
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
    cover: z.string(),
    openingHoursIntro: z.string(),
    openingHoursIntroZh: z.string(),
    openingHours: z.array(localizedScheduleItem).min(1),
    transport: z.string(),
    transportZh: z.string(),
    address: z.string(),
    addressZh: z.string(),
    mapNote: z.string(),
    mapNoteZh: z.string(),
    mapEmbedUrl: z.string().url(),
    mapUrl: z.string().url(),
    facilitiesIntro: z.string(),
    facilitiesIntroZh: z.string(),
    facilities: z.array(localizedFacility).min(1),
    galleryIntro: z.string(),
    galleryIntroZh: z.string(),
    gallery: z.array(localizedPhoto).min(1),
  }),
});

const pages = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/pages' }),
  schema: z.discriminatedUnion('type', [
    z.object({
      type: z.literal('guide'),
      ...localizedPageFields,
      sections: z.array(z.object({
        title: z.string(),
        titleZh: z.string(),
        description: z.string(),
        descriptionZh: z.string(),
      })).min(1),
    }),
    z.object({
      type: z.literal('concerts'),
      ...localizedPageFields,
      calendar: z.object({
        range: z.string(),
        year: z.number(),
        label: z.string(),
        labelZh: z.string(),
      }),
      events: z.array(z.object({
        date: z.string(),
        dateZh: z.string(),
        title: z.string(),
        titleZh: z.string(),
        meta: z.string(),
        metaZh: z.string(),
      })).min(1),
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
      stats: z.object({
        venueModels: z.string(),
        venueModelsZh: z.string(),
        languages: z.string(),
        languagesZh: z.string(),
        localFocus: z.string(),
        localFocusZh: z.string(),
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
        action: z.string(),
        actionZh: z.string(),
      }),
    }),
    z.object({
      type: z.literal('venue-directory'),
      ...localizedPageFields,
    }),
  ]),
});

export const collections = { pages, venues };
