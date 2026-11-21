/**
 * Real-photo slots. Every comparison in the lessons has a slot id. Until a real photo is added here,
 * the slot shows a simulator render labelled as a simulation.
 *
 * To add your own photo:
 *   1. Put the file in /public/photos/ (e.g. public/photos/aperture-f1.8.jpg)
 *   2. Add an entry below:  'aperture-f1.8': { src: 'photos/aperture-f1.8.jpg', credit: 'Your name' }
 *   3. If it isn't your photo, record its license and source in CREDITS.md.
 */
export interface PhotoSlot {
  src: string;
  credit: string;
}

export const PHOTO_MANIFEST: Record<string, PhotoSlot> = {
  // 'aperture-f1.8': { src: 'photos/aperture-f1.8.jpg', credit: 'You' },
};
