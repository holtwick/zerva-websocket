<template>
  <div>
    <h1>zerva-websocket demo</h1>
    <p>Response of viteEcho request: <pre>{{ directFeedback }}</pre></p>
    <p>Pushed viteEcho: <pre>{{ pushedFeedback }}</pre></p>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue"
import { Logger, useMessageHub } from "zeed"
import { WebSocketConnection } from "zerva-websocket"
import { Messages } from "./protocol"

const log = Logger("app")
log("app")

const channel = new WebSocketConnection()
const msg = useMessageHub({ channel }).send<Messages>()

let directFeedback = ref({})
let pushedFeedback = ref({})

// conn.on("serverPong", (data) => log("serverPong", data))

// conn.emit("serverPing", { echo: uuid() }).then((r: any) => {
//   log("pong", r)
//   pong.value = r
// })

useMessageHub({ channel }).listen<Messages>({
  viteEcho(data) {
    log("received", data)
    pushedFeedback.value = data 
    return data
  },
})

msg.viteEcho({ hello: "world at " + new Date() }).then((data: any) => {
  log("viteEcho direct", data)
  directFeedback.value = data
})
</script>
