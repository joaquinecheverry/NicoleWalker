import { type SchemaTypeDefinition } from 'sanity';
import { photoCollection } from './photoCollection';
import { indexSettings } from './indexSettings';

export const schemaTypes: SchemaTypeDefinition[] = [
  photoCollection,
  indexSettings,
  // add other types here later
];
