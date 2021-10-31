import { useMessageHub } from "zeed"
import { on, serve, useHttp } from "zerva"
import { useWebSocket } from "zerva-websocket"
import "./src/protocol"
import { Messages } from "./src/protocol"
import { useVite } from "zerva-vite"

useHttp({ port: 8080 })

useVite({ root: "." })

useWebSocket()

on("webSocketConnect", ({ channel }) => {
  useMessageHub({
    channel,
  }).listen<Messages>({
    viteEcho(data) {
      return data
    },
  })
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

serve()
