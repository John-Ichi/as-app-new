import { runRelay } from "./scripts/lib/relay.mjs";

export default {
  async scheduled(event, env, ctx) {
    await runRelay(env);
    return new Response("OK");
  },
};
