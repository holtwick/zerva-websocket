// (C)opyright 2021 Dirk Holtwick, holtwick.it. All rights reserved.

// @ts-ignore
import WebSocket, { WebSocketServer } from "ws"

import { Channel, Logger, uname } from "zeed"
import { emit, on, onInit, register, requireModules } from "zerva"
import { equalBinary } from "./bin"
import { pingMessage, pongMessage } from "./types"
import { parse } from "url"
import { webSocketPath } from "./types"

const moduleName = "websocket"
const log = Logger(moduleName)

interface ZWebSocketConfig {
  pingInterval?: number
}

export class WebsocketNodeConnection extends Channel {
  ws: WebSocket

  isConnected: boolean = true
  isAlive: boolean = true

  constructor(ws: WebSocket, config: ZWebSocketConfig = {}) {
    super()

    this.ws = ws

    ws.binaryType = "arraybuffer"

    const id = uname(moduleName)
    const log = Logger(`${id}:zerva-${moduleName}`)
    log.info("new connection", id)

    const { pingInterval = 30000 } = config

    let interval: any

    if (pingInterval > 0) {
      interval = setInterval(() => {
        if (this.isAlive === false) {
          log("terminate", ws)
          ws.close()
          // return ws.terminate()
        }
        this.isAlive = false
        ws.ping()
      }, pingInterval)
    }

    ws.on("pong", () => {
      this.isAlive = true
    })

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
      if (interval) clearInterval(interval)
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

  register(moduleName)

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
      log.info("onconnection")
      ws.isAlive = true
      new WebsocketNodeConnection(ws, config)
    })

    http.on("upgrade", (request: any, socket: any, head: Buffer) => {
      const { pathname } = parse(request.url)
      log("onupgrade")
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
