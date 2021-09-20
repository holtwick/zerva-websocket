# 🌱 Zerva WebSocket module

**This is a side project of [Zerva](https://github.com/holtwick/zerva)**

Plain WebSocket connections with Zerva. Use with `http` module or [vite-zerva-plugin]().

## Get started

Define your own Zerva Context events, which will be available for autocompletion in any good Typescript IDE to be used in `on` and `emit`:

```ts
import { useWebSocket } from "zerva-websocket"

useHttp({
  port: 8080,
})

useWebSocket()

on("webSocketConnect", ({ channel }) => {
  useBridge(
    { channel },
    {
      echo(message) {
        return message
      },
    }
  )
})
```
