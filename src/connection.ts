import { Channel, equalBinary, getTimestamp, isBrowser, Logger } from "zeed"
import { pingMessage, pongMessage } from "./types"
import { getWebsocketUrlFromLocation } from "./url"

const log = Logger("websocket")

// See lib0 and y-websocket for initial implementation

const default_reconnectTimeoutBase = 1200
const default_maxReconnectTimeout = 2500
const default_messageReconnectTimeout = 30000

export interface WebSocketConnectionOptions {
  reconnectTimeoutBase?: number
  maxReconnectTimeout?: number
  messageReconnectTimeout?: number
}

export class WebSocketConnection extends Channel {
  public ws?: WebSocket
  public url: string | URL
  public shouldConnect: boolean = true
  public isConnected: boolean = false
  public lastMessageReceived: number = 0
  public unsuccessfulReconnects: number = 0
  public pingCount: number = 0

  private opt: WebSocketConnectionOptions
  private reconnectTimout: any
  private pingTimeout: any

  constructor(url?: string, opt: WebSocketConnectionOptions = {}) {
    super()
    this.opt = opt
    this.url = url ?? getWebsocketUrlFromLocation()

    if (isBrowser()) {
      window.addEventListener("beforeunload", () => this.disconnect())
    } else if (typeof process !== "undefined") {
      process.on("exit", () => this.disconnect())
    }

    this._connect()
  }

  postMessage(data: any): void {
    // log("postMessage", data)
    if (this.ws) {
      this.ws.send(data)
    } else {
      throw new Error("Not connected!")
    }
  }

  disconnect() {
    log("disconnect")
    clearTimeout(this.pingTimeout)
    clearTimeout(this.reconnectTimout)
    this.shouldConnect = false
    if (this.ws != null) {
      this.ws?.close()
      this.ws = undefined
    }
  }

  dispose() {
    this.disconnect()
  }

  close() {
    this.disconnect()
  }

  _connect() {
    const {
      reconnectTimeoutBase = default_reconnectTimeoutBase,
      maxReconnectTimeout = default_maxReconnectTimeout,
      messageReconnectTimeout = default_messageReconnectTimeout,
    } = this.opt

    if (this.shouldConnect && this.ws == null) {
      log("_connect", this.url, this.unsuccessfulReconnects)

      const websocket = new WebSocket(this.url)
      this.ws = websocket
      this.ws.binaryType = "arraybuffer"

      // this.isConnecting = true
      this.isConnected = false

      websocket.addEventListener("message", (event: any) => {
        log("onmessage", typeof event)

        this.lastMessageReceived = getTimestamp()
        const data = event.data as ArrayBuffer
        clearTimeout(this.pingTimeout)

        if (equalBinary(data, pongMessage)) {
          log("-> pong")
          this.pingCount++
          if (messageReconnectTimeout > 0) {
            this.pingTimeout = setTimeout(sendPing, messageReconnectTimeout / 2)
          }
        } else {
          this.emit("message", { data })
        }
      })

      const onclose = (error?: any) => {
        log("onclose", error)
        clearTimeout(this.pingTimeout)

        if (this.ws != null) {
          this.ws = undefined
          // this.isConnecting = false
          if (this.isConnected) {
            this.isConnected = false
          } else {
            this.unsuccessfulReconnects++
          }

          // Start with no reconnect timeout and increase timeout by
          // log10(wsUnsuccessfulReconnects).
          // The idea is to increase reconnect timeout slowly and have no reconnect
          // timeout at the beginning (log(1) = 0)
          this.reconnectTimout = setTimeout(
            () => this._connect(),
            Math.min(
              Math.log10(this.unsuccessfulReconnects + 1) *
                reconnectTimeoutBase,
              maxReconnectTimeout
            )
          )
        }
      }

      const sendPing = () => {
        if (this.ws === websocket) {
          log("ping ->")
          websocket.send(pingMessage)
        }
      }

      websocket.addEventListener("close", () => onclose())
      websocket.addEventListener("error", (error: any) => onclose(error))
      websocket.addEventListener("open", () => {
        log("onopen")
        this.lastMessageReceived = getTimestamp()
        this.isConnected = true
        this.unsuccessfulReconnects = 0
        if (messageReconnectTimeout > 0) {
          this.pingTimeout = setTimeout(sendPing, messageReconnectTimeout / 2)
        }
      })
    }
  }

  connect() {
    log("connect")
    this.shouldConnect = true
    if (!this.isConnected && this.ws == null) {
      this._connect()
    }
  }
}
