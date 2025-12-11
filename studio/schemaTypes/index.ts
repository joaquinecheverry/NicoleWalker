import { type SchemaTypeDefinition } from 'sanity';
import { photoCollection } from './photoCollection';
import { indexSettings } from './indexSettings';
import clientList from "./clientList";

export const schemaTypes: SchemaTypeDefinition[] = [
  photoCollection,
  clientList,
  indexSettings,
  // add other types here later
];
