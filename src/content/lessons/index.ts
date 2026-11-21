import type { ComponentType } from 'react';

type MDXModule = { default: ComponentType<{ components?: Record<string, unknown> }> };

export interface LessonMeta {
  slug: string;
  title: string;
  summary: string;
  minutes: number;
  load: () => Promise<MDXModule>;
}

export interface Module {
  slug: string;
  title: string;
  blurb: string;
  lessons: LessonMeta[];
}

export const MODULES: Module[] = [
  {
    slug: 'camera',
    title: 'Shooting in manual',
    blurb: 'Exposure, the three settings, metering, modes, color and focus.',
    lessons: [
      { slug: 'foundations', title: 'Light, stops & the exposure triangle', summary: 'What exposure is and why everything is counted in stops.', minutes: 8, load: () => import('./foundations.mdx') },
      { slug: 'aperture', title: 'Aperture & depth of field', summary: 'f-numbers, background blur, and getting everything sharp.', minutes: 10, load: () => import('./aperture.mdx') },
      { slug: 'shutter', title: 'Shutter speed & motion', summary: 'Freeze action, blur water, pan, and avoid camera shake.', minutes: 10, load: () => import('./shutter.mdx') },
      { slug: 'iso', title: 'ISO & noise', summary: 'When to raise ISO, and why a dark photo is worse than a noisy one.', minutes: 7, load: () => import('./iso.mdx') },
      { slug: 'metering', title: 'Metering & histograms', summary: 'How the meter thinks, exposure compensation, clipping and ETTR.', minutes: 10, load: () => import('./metering.mdx') },
      { slug: 'modes', title: 'Shooting modes: M, Av, Tv, P', summary: 'What each mode automates and when to use it.', minutes: 7, load: () => import('./modes.mdx') },
      { slug: 'white-balance', title: 'White balance & color', summary: 'Color temperature, presets, and RAW vs JPEG.', minutes: 6, load: () => import('./white-balance.mdx') },
      { slug: 'focus', title: 'Focus modes', summary: 'AF-S vs AF-C, focus areas, and back-button focus.', minutes: 6, load: () => import('./focus.mdx') },
      { slug: 'together', title: 'Putting it all together', summary: 'A decision process for any situation, plus practice challenges.', minutes: 10, load: () => import('./together.mdx') },
    ],
  },
  {
    slug: 'editing',
    title: 'Editing your photos',
    blurb: 'A develop workflow: tone, curves, white balance, color mixing and grading.',
    lessons: [
      { slug: 'workflow', title: 'Editing workflow & the histogram', summary: 'A repeatable order of operations.', minutes: 6, load: () => import('./workflow.mdx') },
      { slug: 'basic-tone', title: 'Exposure, contrast & tone', summary: 'Highlights, shadows, whites and blacks.', minutes: 7, load: () => import('./basic-tone.mdx') },
      { slug: 'curves', title: 'Tone curves', summary: 'S-curves, faded blacks and per-channel color.', minutes: 10, load: () => import('./curves.mdx') },
      { slug: 'wb-post', title: 'White balance in post', summary: 'Fixing color casts and setting a mood.', minutes: 5, load: () => import('./wb-post.mdx') },
      { slug: 'hsl', title: 'HSL & the color mixer', summary: 'Edit skies, foliage and skin individually.', minutes: 7, load: () => import('./hsl.mdx') },
      { slug: 'color-grading', title: 'Color grading', summary: 'Split toning and building a consistent look.', minutes: 7, load: () => import('./color-grading.mdx') },
    ],
  },
];

export const ALL_LESSONS = MODULES.flatMap((m) => m.lessons.map((l) => ({ ...l, module: m.slug, key: `${m.slug}/${l.slug}` })));

export function findLesson(moduleSlug: string, lessonSlug: string) {
  const i = ALL_LESSONS.findIndex((l) => l.module === moduleSlug && l.slug === lessonSlug);
  return { lesson: ALL_LESSONS[i], prev: ALL_LESSONS[i - 1], next: ALL_LESSONS[i + 1], index: i };
}
