// /schemas/clientList.ts
import { defineField, defineType } from "sanity";

export default defineType({
  name: "clientList",
  title: "Client List",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      initialValue: "Clients",
    }),
    defineField({
  name: "clientsText",
  title: "Clients (one per line)",
  type: "text",
}),
  ],
});
