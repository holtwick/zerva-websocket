import {
  Channel,
  Disposable,
  equalBinary,
  getTimestamp,
  isBrowser,
  Logger,
} from "zeed"
import {
  getWebsocketUrlFromLocation,
  pingMessage,
  pongMessage,
  webSocketPath,
  wsReadyStateConnecting,
  wsReadyStateOpen,
} from "./types"

const log = Logger("websocket")

// See lib0 and y-websocket for initial implementation

const default_reconnectTimeoutBase = 1200
const default_maxReconnectTimeout = 2500
const default_messageReconnectTimeout = 30000

export interface WebSocketConnectionOptions {
  // buffer?: boolean
  debug?: boolean
  path?: string
  reconnectTimeoutBase?: number
  maxReconnectTimeout?: number
  messageReconnectTimeout?: number
}

export class WebSocketConnection extends Channel implements Disposable {
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
  private debug: boolean

  constructor(url?: string, opt: WebSocketConnectionOptions = {}) {
    super()

    let path = opt.path ?? webSocketPath
    if (!path.startsWith("/")) path = `/${path}`

    this.opt = opt
    this.debug = opt.debug ?? false
    this.url = url ?? getWebsocketUrlFromLocation(path)

    if (isBrowser()) {
      window.addEventListener("beforeunload", () => this.disconnect())
      window.addEventListener("focus", () => this.ping())
    } else if (typeof process !== "undefined") {
      process.on("exit", () => this.disconnect())
    }

    this._connect()
  }

  postMessage(data: any): void {
    if (
      this.ws &&
      (this.ws.readyState != null
        ? this.ws.readyState === wsReadyStateConnecting ||
          this.ws.readyState === wsReadyStateOpen
        : true)
    ) {
      try {
        this.ws.send(data)
        return
      } catch (e) {
        log.warn(`send failed with error=${String(e)}`)
      }
    } else {
      log.warn(`connection state issue, readyState=${this.ws?.readyState}`)
    }
    this.ws?.close()
    this._connect()
  }

  // Send a ping. If it fails, try to reconnect immediately
  ping() {
    log("ping ->")
    this.postMessage(pingMessage)
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
            this.pingTimeout = setTimeout(
              () => this.ping(),
              messageReconnectTimeout / 2
            )
          }
        } else {
          this.emit("message", { data })
        }
      })

      const onclose = (error?: any) => {
        clearTimeout(this.pingTimeout)

        if (this.ws != null) {
          if (error) log.warn(`onclose with error=${String(error)}`)
          else log("onclose")

          this.ws = undefined
          if (this.isConnected) {
            this.isConnected = false
            this.emit("disconnect")
          } else {
            this.unsuccessfulReconnects++
          }

          // Start with no reconnect timeout and increase timeout by
          // log10(wsUnsuccessfulReconnects).
          // The idea is to increase reconnect timeout slowly and have no reconnect
          // timeout at the beginning (log(1) = 0)
          const reconnectDelay = Math.min(
            Math.log10(this.unsuccessfulReconnects + 1) * reconnectTimeoutBase,
            maxReconnectTimeout
          )
          this.reconnectTimout = setTimeout(
            () => this._connect(),
            reconnectDelay
          )
          log(`reconnect retry in ${reconnectDelay}ms`)
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
          log(`schedule next ping in ${messageReconnectTimeout / 2}ms`)
          this.pingTimeout = setTimeout(
            () => this.ping(),
            messageReconnectTimeout / 2
          )
        }
        this.emit("connect")
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
