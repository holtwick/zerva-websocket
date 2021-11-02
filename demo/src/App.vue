<template>
  <div>
    <h1>zerva-websocket demo</h1>
    <pre>directFeedback = {{ directFeedback }}</pre>
    <pre>pushedFeedback = {{ pushedFeedback }}</pre>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue"
import { Logger, useMessageHub } from "zeed"
import { WebSocketConnection } from "zerva-websocket"
import { Messages } from "./protocol"

const log = Logger("app")
log("app")

let directFeedback = ref({})
let pushedFeedback = ref({})

let counter = 0

const channel = new WebSocketConnection()

if (true) {
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
        counter,
      })
    )
  })

  setInterval(() => {
    counter++
    channel.postMessage(
      JSON.stringify({
        from: "clientPing",
        counter,
      })
    )
  }, 5000)
} else {
  // conn.on("serverPong", (data) => log("serverPong", data))

  // conn.emit("serverPing", { echo: uuid() }).then((r: any) => {
  //   log("pong", r)
  //   pong.value = r
  // })

  // useMessageHub({ channel }).listen<Messages>({
  //   viteEcho(data) {
  //     log("received", data)
  //     pushedFeedback.value = data
  //     return data
  //   },
  // })

  const msg = useMessageHub({ channel }).send<Messages>()
  channel.on("connect", () => {
    ++counter
    msg.viteEcho({ fromClient: counter }).then((data: any) => {
      log("viteEcho direct", data)
      directFeedback.value = data
    })
  })
}
</script>
