<template>
  <div>
    <h1>zerva-websocket demo</h1>
    <pre>{{ directFeedback }}</pre>
    <pre>{{ pushedFeedback }}</pre>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue"
import { Logger } from "zeed"
import { WebSocketConnection } from "zerva-websocket"

const log = Logger("app")
log("app")

let directFeedback = ref({})
let pushedFeedback = ref({})

let counter = 0

const channel = new WebSocketConnection()

channel.on("message", (msg) => {
  pushedFeedback.value = msg.data
  log("message", JSON.parse(msg.data))
})

channel.on("connect", () => {
  log("channel connect")

  counter++
  channel.postMessage(
    JSON.stringify({
      from: "client",
      hello: "world",
      counter,
    })
  )
})

// conn.on("serverPong", (data) => log("serverPong", data))

// conn.emit("serverPing", { echo: uuid() }).then((r: any) => {
//   log("pong", r)
//   pong.value = r
// })

//   const msg = useMessageHub({ channel }).send<Messages>()
// useMessageHub({ channel }).listen<Messages>({
//   viteEcho(data) {
//     log("received", data)
//     pushedFeedback.value = data
//     return data
//   },
// })

// msg.viteEcho({ hello: "world at " + new Date() }).then((data: any) => {
//   log("viteEcho direct", data)
//   directFeedback.value = data
// })
</script>
