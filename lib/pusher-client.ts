// lib/pusher-client.ts — client only
import PusherClient from "pusher-js";

let client: PusherClient | null = null;

export function getPusherClient() {
    if (client) return client;
    client = new PusherClient(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
        cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    });
    return client;
}