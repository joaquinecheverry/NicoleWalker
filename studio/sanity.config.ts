import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {schemaTypes} from './schemaTypes'
import { muxInput } from "sanity-plugin-mux-input";

export default defineConfig({
  name: 'default',
  title: 'NicoleWalker',

  projectId: 'hk21ncs5',
  dataset: 'production',

  plugins: [muxInput(), structureTool(), visionTool()],

  schema: {
    types: schemaTypes,
  },
})
