import "./logging"

import vue from "@vitejs/plugin-vue"
import { defineConfig } from "vite"
import { Logger, useMessages } from "zeed"
import { on } from "zerva"
import { viteZervaPlugin } from "zerva-vite-plugin"
import { useWebSocket } from "zerva-websocket"
import "./src/protocol"
import { Messages } from "./src/protocol"

const log = Logger("demo")

const zervaSetup = async () => {
  useWebSocket()

  on("webSocketConnect", ({ channel }) => {
    const msg = useMessages<Messages>(
      { channel },
      {
        viteEcho(data) {
          return data
        },
      }
    )

    // channel.on("message")
    // conn.on("viteEcho", (data: any) => data)
  })

  on("httpInit", ({ get, addStatic }) => {
    get("/zerva", `Hello, this is Zerva!`)
    get("/data.json", ({ req, res }) => {
      return { hello: "world" }
    })

    // This will be ignored
    addStatic("test", "test")
  })
}

export default defineConfig({
  plugins: [vue(), viteZervaPlugin(zervaSetup)],
})
