import { Channel, getTimestamp, isBrowser, Logger } from "zeed"
import { equalBinary } from "./bin"
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
  ws?: WebSocket
  url: string | URL
  shouldConnect: boolean = true
  isConnected: boolean = false
  connecting: boolean = false
  lastMessageReceived: number = 0
  unsuccessfulReconnects: number = 0
  _checkInterval: any
  opt: WebSocketConnectionOptions

  constructor(url?: string, opt: WebSocketConnectionOptions = {}) {
    super()
    this.opt = opt
    this.url = url ?? getWebsocketUrlFromLocation()

    const { messageReconnectTimeout = default_messageReconnectTimeout } =
      this.opt

    this._checkInterval = setInterval(() => {
      if (
        this.isConnected &&
        messageReconnectTimeout < getTimestamp() - this.lastMessageReceived
      ) {
        // no message received in a long time - not even your own awareness
        // updates (which are updated every 15 seconds)
        this.ws?.close()
      }
    }, messageReconnectTimeout / 2)

    if (isBrowser()) {
      window.addEventListener("beforeunload", () => this.disconnect())
    } else if (typeof process !== "undefined") {
      process.on("exit", () => this.disconnect())
    }

    this._connect()
  }

  postMessage(data: any): void {
    log("postMessage", data)
    if (this.ws) {
      this.ws.send(data)
    } else {
      throw new Error("Not connected!")
    }
  }

  close() {
    log("close")
    clearInterval(this._checkInterval)
    this.disconnect()
  }

  disconnect() {
    log("disconnect")
    this.shouldConnect = false
    if (this.ws != null) {
      this.ws?.close()
    }
  }

  _connect() {
    const {
      reconnectTimeoutBase = default_reconnectTimeoutBase,
      maxReconnectTimeout = default_maxReconnectTimeout,
      messageReconnectTimeout = default_messageReconnectTimeout,
    } = this.opt

    if (this.shouldConnect && this.ws == null) {
      log("_connect", this.url, this.unsuccessfulReconnects)
      let pingTimeout: any

      const websocket = new WebSocket(this.url)
      this.ws = websocket
      this.ws.binaryType = "arraybuffer"

      this.connecting = true
      this.isConnected = false

      websocket.addEventListener("message", (event: any) => {
        log("onmessage", event)

        this.lastMessageReceived = getTimestamp()
        const data = event.data as ArrayBuffer

        if (equalBinary(data, pongMessage)) {
          log("-> pong")
          clearTimeout(pingTimeout)
          pingTimeout = setTimeout(sendPing, messageReconnectTimeout / 2)
        } else {
          this.emit("message", { data })
        }

        // this.emit("message", [message, wsclient])
      })

      const onclose = (error?: any) => {
        log("onclose", error)

        if (this.ws != null) {
          this.ws = undefined
          this.connecting = false
          if (this.isConnected) {
            this.isConnected = false
            // this.emit("disconnect", [{ type: "disconnect", error }, wsclient])
          } else {
            this.unsuccessfulReconnects++
          }

          // Start with no reconnect timeout and increase timeout by
          // log10(wsUnsuccessfulReconnects).
          // The idea is to increase reconnect timeout slowly and have no reconnect
          // timeout at the beginning (log(1) = 0)
          setTimeout(
            () => this._connect(),
            Math.min(
              Math.log10(this.unsuccessfulReconnects + 1) *
                reconnectTimeoutBase,
              maxReconnectTimeout
            )
          )
        }
        clearTimeout(pingTimeout)
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
        this.connecting = false
        this.isConnected = true
        this.unsuccessfulReconnects = 0
        // this.emit("connect", [{ type: "connect" }, wsclient])
        // set ping
        pingTimeout = setTimeout(sendPing, messageReconnectTimeout / 2)
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
