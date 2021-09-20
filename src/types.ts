// (C)opyright 2021-07-15 Dirk Holtwick, holtwick.it. All rights reserved.

import { Channel } from "zeed"

export {}

export const webSocketPath = "/zerva-websocket"

// https://developer.mozilla.org/de/docs/Web/API/WebSockets_API/Writing_WebSocket_servers#pings_and_pongs_the_heartbeat_of_websockets
export const pingMessage = new Uint8Array([0x9])
export const pongMessage = new Uint8Array([0xa])

declare global {
  interface ZContextEvents {
    webSocketConnect(info: { channel: Channel }): void
    webSocketDisconnect(info: { error?: Error; channel: Channel }): void
  }
}
