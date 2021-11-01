import { Logger } from "zeed"
import { on, serve, useHttp } from "zerva"
import { useVite } from "zerva-vite"
import { useWebSocket } from "zerva-websocket"

const log = Logger("service")

useHttp({ port: 8080 })

useWebSocket()

useVite({ root: "." })

let counter = 0

on("webSocketConnect", ({ channel }) => {
  log.info("connected")

  channel.on("message", (msg) => {
    log.info("message", JSON.parse(msg.data))
  })

  counter++
  channel.postMessage(
    JSON.stringify({
      from: "server",
      hello: "world",
      counter,
    })
  )

  // useMessageHub({
  //   channel,
  // }).listen<Messages>({
  //   viteEcho(data) {
  //     ++counter
  //     return data
  //     // {
  //     //   // ...data,
  //     //   responseCounter: counter,
  //     // }
  //   },
  // })

  // const msg = useMessageHub({
  //   channel,
  // }).send<Messages>()

  // ++counter
  // msg.viteEcho({ pushCounter: counter })

  // channel.on("message")
  // conn.on("viteEcho", (data: any) => data)
})

// setTimeout(() => {
//   connect.emit('')
// }, 2000)

on("httpInit", ({ get, addStatic }) => {
  get("/zerva", `Hello, this is Zerva!`)
  get("/data.json", ({ req, res }) => {
    return { hello: "world" }
  })

  // This will be ignored
  addStatic("test", "test")
})

serve()
