import Pusher from "pusher-js";

let pusherClient: Pusher | null = null;

export const getPusherClient = (): Pusher | null => {
  if (typeof window === "undefined") return null;

  if (!pusherClient) {
    const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
    const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

    if (!key || !cluster) {
      console.error("Missing Pusher configuration");
      return null;
    }

    pusherClient = new Pusher(key, {
      cluster,
    });
  }

  return pusherClient;
};

export default getPusherClient;
