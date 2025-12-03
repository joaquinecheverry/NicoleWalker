// studio/schemaTypes/indexSettings.ts
import { defineField, defineType } from 'sanity';

export const indexSettings = defineType({
  name: 'indexSettings',
  title: 'Index Settings',
  type: 'document',
  fields: [
    defineField({
      name: 'xPattern',
      title: 'X Pattern Multiplier',
      type: 'number',
      initialValue: 8,
    }),
    defineField({
      name: 'yPattern',
      title: 'Y Pattern Multiplier',
      type: 'number',
      initialValue: 8,
    }),
    defineField({
      name: 'radiusX',
      title: 'Radius X (0–1)',
      type: 'number',
      initialValue: 0.45,
    }),
    defineField({
      name: 'radiusY',
      title: 'Radius Y (0–1)',
      type: 'number',
      initialValue: 0.43,
    }),
  ],
});
