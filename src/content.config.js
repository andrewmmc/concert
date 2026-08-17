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
    transportNote: z.string(),
    transportNoteZh: z.string(),
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

export const collections = { venues };
