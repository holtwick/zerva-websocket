// (C)opyright 2021-07-15 Dirk Holtwick, holtwick.it. All rights reserved.

import WebSocket from "ws"
import { Logger, sleep, useMessages, uuid } from "zeed"
import { emit, on, serve, useHttp } from "zerva"
import { openWebSocketChannel, WebsocketChannel } from "./channel"
import { WebSocketConnection } from "./connection"
import "./logging"
import { useWebSocket } from "./module"
import { webSocketPath } from "./types"

// @ts-ignore
global.WebSocket = WebSocket

const log = Logger("test:module")

const port = 8888
const url = `ws://localhost:${port}${webSocketPath}`

interface WebsocketActions {
  echo(value: any): any
  throwsError(): void
}

describe("Socket", () => {
  beforeAll(async () => {
    useHttp({ port })
    useWebSocket({})

    on("webSocketConnect", ({ channel }) => {
      useMessages<WebsocketActions>({
        channel,
        handlers: {
          echo(value) {
            log("echo", value)
            return value
          },
          throwsError() {
            throw new Error("fakeError")
          },
        },
      })
    })

    await serve()
  })

  afterAll(async () => {
    await emit("serveStop")
  })

  it("should connect", (done) => {
    expect.assertions(1)

    const socket = new WebSocket(url)
    socket.binaryType = "arraybuffer"

    // @ts-ignore
    const channel = new WebsocketChannel(socket)

    const bridge = useMessages<WebsocketActions>({ channel })

    socket.addEventListener("open", async (event) => {
      const id = uuid()
      let result = await bridge.echo({ id })
      log("result", result)
      expect(result).toEqual({ id })
      socket.close()
      await sleep(500)
      done()
    })
  })

  it("should connect using helper", async () => {
    expect.assertions(1)

    const channel = await openWebSocketChannel(url)
    const bridge = useMessages<WebsocketActions>({ channel })

    const id = uuid()
    let result = await bridge.echo({ id })
    log("result", result)
    expect(result).toEqual({ id })
    channel.close()

    await sleep(500)
  })

  it("should connect use smart connection", async () => {
    expect.assertions(2)

    const channel = new WebSocketConnection(url)
    const bridge = useMessages<WebsocketActions>({ channel })
    // await sleep(500)

    const id = uuid()
    let result = await bridge.echo({ id })
    log("result", result)
    expect(result).toEqual({ id })

    try {
      await bridge.throwsError()
    } catch (err) {
      // @ts-ignore
      expect(err.message).toBe("fakeError")
    }

    channel.close()
  })

  it("should ping", async () => {
    const channel = new WebSocketConnection(url, {
      messageReconnectTimeout: 500,
    })

    const bridge = useMessages<WebsocketActions>({ channel })

    await sleep(2000)

    channel.close()
  }, 5000)
})
