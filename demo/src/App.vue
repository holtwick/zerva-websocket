<template>
  <div>Hello Vite, pong via socket.io => {{ pong }}</div>
  <div>
    <iframe src="/zerva"></iframe>
    <iframe src="/data.json"></iframe>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from "vue"
import { Logger, useMessageHub } from "zeed"
import { WebSocketConnection } from "zerva-websocket"
import { Messages } from "./protocol"

const log = Logger("app")
log("app")

const channel = new WebSocketConnection()
const msg = useMessageHub({ channel }).send<Messages>()

export default defineComponent({
  setup() {
    let pong = ref("")

    // conn.on("serverPong", (data) => log("serverPong", data))

    // conn.emit("serverPing", { echo: uuid() }).then((r: any) => {
    //   log("pong", r)
    //   pong.value = r
    // })

    msg
      .viteEcho({ hello: "world" })
      .then((data) => log("viteEcho direct", data))

    return {
      pong,
    }
  },
})
</script>
