// (C)opyright 2021 Dirk Holtwick, holtwick.it. All rights reserved.

// @ts-ignore
import WebSocket, { WebSocketServer } from "ws"

import { Channel, Logger, uname } from "zeed"
import { emit, on, onInit, register, requireModules } from "zerva"
import { equalBinary } from "./bin"
import { pingMessage, pongMessage } from "./types"
import { parse } from "url"
import { webSocketPath } from "./types"

const name = "zerva:websocket"
const log = Logger(name)

interface ZWebSocketConfig {}

export class WebsocketNodeConnection extends Channel {
  ws: WebSocket
  isConnected = true

  constructor(ws: WebSocket) {
    super()

    this.ws = ws
    this.ws.binaryType = "arraybuffer"

    const id = uname("ws")
    const log = Logger(`${id}:${name}`)
    log.info("new connection", id)

    ws.on("message", (data: ArrayBuffer, isBinary: boolean) => {
      try {
        log("onmessage", typeof data, new Uint8Array(data), isBinary)
        if (equalBinary(data, pingMessage)) {
          log("-> ping -> pong")
          ws.send(pongMessage)
        } else {
          this.emit("message", {
            data,
          })
        }
      } catch (error) {
        log.warn("message parsing issues", error, data)
      }
    })

    ws.on("error", (error) => {
      log.error("onerror", error)
      this.isConnected = false
      emit("webSocketDisconnect", {
        channel: this,
        error,
      })
    })

    ws.on("close", () => {
      log.info("onclose")
      this.isConnected = false
      emit("webSocketDisconnect", {
        channel: this,
      })
    })

    emit("webSocketConnect", { channel: this })
  }

  postMessage(data: any): void {
    this.ws.send(data)
  }

  close() {
    this.ws.close()
  }
}

export function useWebSocket(config: ZWebSocketConfig = {}) {
  log("setup")

  register(name)

  onInit(() => {
    requireModules("http")
  })

  on("httpInit", ({ http }) => {
    log("init")

    // https://github.com/websockets/ws
    // https://cheatcode.co/tutorials/how-to-set-up-a-websocket-server-with-node-js-and-express

    const wss = new WebSocketServer({
      noServer: true,
      path: webSocketPath,
    })

    wss.on("connection", (ws: any, req: any) => {
      log.info("new connection")
      ws.isAlive = true
      ws.on("pong", () => (ws.isAlive = true))
      new WebsocketNodeConnection(ws)
    })

    const interval = setInterval(() => {
      wss.clients.forEach(function each(ws: any) {
        if (ws.isAlive === false) {
          log("terminate", ws)
          return ws.terminate()
        }
        ws.isAlive = false
        ws.ping()
      })
    }, 1000) // 30000)

    wss.on("close", () => clearInterval(interval))

    http.on("upgrade", (request: any, socket: any, head: Buffer) => {
      const { pathname } = parse(request.url)
      log("http upgrade")
      if (pathname === webSocketPath) {
        wss.handleUpgrade(request, socket, head, (ws: any) => {
          log("upgrade connection")
          wss.emit("connection", ws, request)
        })
      } else {
        log("ignore upgrade")
        // socket.destroy()
      }
    })
  })
}
