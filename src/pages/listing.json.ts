// Every post's row summary, newest first. PostListing fetches it the first
// time a reader filters, sorts or pages past the server-rendered default, so
// those act on the whole folder rather than the rows on screen.
import type { APIRoute } from "astro";
import { getPosts, summarize } from "../lib/blog";

export const GET: APIRoute = async () => {
  const posts = await getPosts();
  return new Response(JSON.stringify(posts.map(summarize(posts))), {
    headers: { "Content-Type": "application/json" },
  });
};
