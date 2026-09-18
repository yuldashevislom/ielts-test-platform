import { getStore } from "@netlify/blobs";

export default async () => {
   try {
      const store = getStore("writing");
      const task = await store.get("task", { type: "json" });

      return new Response(JSON.stringify(task), {
         status: 200,
         headers: { "Content-Type": "application/json" }
      });
   } catch (error) {
      return new Response(
         JSON.stringify({ ok: false, error: error.message }),
         {
            status: 500,
            headers: { "Content-Type": "application/json" }
         }
      );
   }
};