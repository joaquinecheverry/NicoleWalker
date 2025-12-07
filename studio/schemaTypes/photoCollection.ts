// studio/schemaTypes/photoCollection.ts
import { defineField, defineType } from 'sanity';

export const photoCollection = defineType({
  name: 'photoCollection',
  title: 'Photo Collection',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
    }),
    defineField({
      name: 'order',
      title: 'Order',
      type: 'number',
      description: 'Smaller numbers appear first in the list',
    }),
    defineField({
      // keep the same name so your existing docs still work
      name: 'images',
      title: 'Images / Videos',
      type: 'array',
      of: [
        // IMAGE ITEM
        defineField({
          name: 'imageItem',
          type: 'image',
          title: 'Image',
          options: { hotspot: true },
          fields: [
            defineField({
              name: 'caption',
              title: 'Caption',
              type: 'string',
            }),
          ],
        }),

        // VIDEO ITEM (MUX)
        defineField({
          name: 'videoItem',
          title: 'Video',
          type: 'object',
          fields: [
            defineField({
              name: 'muxVideo',
              title: 'Mux Video',
              // 👇 this type comes from the mux plugin – e.g. `mux.video`
              type: 'mux.video',
            }),
            defineField({
              name: 'poster',
              title: 'Poster image (optional)',
              type: 'image',
              options: { hotspot: true },
            }),
            defineField({
              name: 'caption',
              title: 'Caption',
              type: 'string',
            }),
          ],
        }),
      ],
    }),
  ],
  preview: {
    select: {
      title: 'title',
      order: 'order',
    },
    prepare({ title, order }) {
      return {
        title: title || 'Untitled collection',
        subtitle:
          typeof order === 'number' ? `Order: ${order}` : 'No order set',
      };
    },
  },
});
