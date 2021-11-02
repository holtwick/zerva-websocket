// (C)opyright 2021 Dirk Holtwick, holtwick.it. All rights reserved.

import { parse } from "url"
import WebSocket, { WebSocketServer } from "ws"
import { Channel, equalBinary, Logger, uname } from "zeed"
import { emit, on, onInit, register, requireModules } from "zerva"
import { pingMessage, pongMessage, webSocketPath } from "./types"

const moduleName = "websocket"
const log = Logger(moduleName)

const wsReadyStateConnecting = 0
const wsReadyStateOpen = 1
const wsReadyStateClosing = 2 // eslint-disable-line
const wsReadyStateClosed = 3 // eslint-disable-line

interface ZWebSocketConfig {
  path?: string
  pingInterval?: number
}

export class WebsocketNodeConnection extends Channel {
  private ws: WebSocket
  private interval: any

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

    if (pingInterval > 0) {
      log.info("Ping interval", pingInterval)
      this.interval = setInterval(() => {
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
        log("onmessage", typeof data) // , new Uint8Array(data), isBinary)
        if (equalBinary(data, pingMessage)) {
          log("-> ping -> pong")
          this.postMessage(pongMessage)
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
      this.emit("close")
      emit("webSocketDisconnect", {
        channel: this,
        error,
      })
    })

    ws.on("close", () => {
      log.info("onclose")
      if (this.interval) {
        clearInterval(this.interval)
        this.interval = undefined
      }
      this.isConnected = false
      this.emit("close")
      emit("webSocketDisconnect", {
        channel: this,
      })
    })

    emit("webSocketConnect", { channel: this })
  }

  postMessage(data: any): void {
    if (
      this.ws.readyState != null &&
      this.ws.readyState !== wsReadyStateConnecting &&
      this.ws.readyState !== wsReadyStateOpen
    ) {
      this.ws.close()
    }
    try {
      this.ws.send(data, (err) => {
        if (err != null) this.ws.close()
      })
    } catch (e) {
      this.ws.close()
    }
  }

  close() {
    if (this.interval) {
      clearInterval(this.interval)
      this.interval = undefined
    }
    this.ws.close()
  }

  dispose() {
    this.close()
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

    let path = config.path ?? webSocketPath
    if (!path.startsWith("/")) path = `/${path}`

    const wss = new WebSocketServer({
      noServer: true,
      path,
    })

    wss.on("connection", (ws: any, req: any) => {
      log.info("onconnection")
      ws.isAlive = true
      new WebsocketNodeConnection(ws, config)
    })

    http.on("upgrade", (request: any, socket: any, head: Buffer) => {
      const { pathname } = parse(request.url)
      if (pathname === path) {
        log("onupgrade")
        wss.handleUpgrade(request, socket, head, (ws: any) => {
          log("upgrade connection")
          wss.emit("connection", ws, request)
        })
        // } else {
        //   log("ignore upgrade") // this can be vite HMR e.g.
        //   // socket.destroy()
      }
    })
  })
}
