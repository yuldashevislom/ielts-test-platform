import { getStore } from "@netlify/blobs";

export default async (req) => {
   if (req.method !== "POST") {
      return new Response(
         JSON.stringify({ ok: false, error: "Method not allowed" }),
         {
            status: 405,
            headers: { "Content-Type": "application/json" }
         }
      );
   }

   try {
      const data = await req.json();
      const store = getStore("writing");

      await store.setJSON("task", data);

      return new Response(
         JSON.stringify({ ok: true, message: "Task saved" }),
         {
            status: 200,
            headers: { "Content-Type": "application/json" }
         }
      );
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