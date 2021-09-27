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
```

You should use the message overlay from `zeed` to have a convenient messaging infrastructure. First define the methods the server should listen to:

```ts
interface Messages {
  echo(msg: string): string
}
```

Then implement them in on the server side:

```ts
on("webSocketConnect", ({ channel }) => {
  useMessageHub({ channel }).listen<Messages>({
    echo(message) {
      return message
    },
  })
})
```

On the client side you may connect easily and call the messages:

```ts
const channel = new WebSocketConnection()
const send = useMessageHub({ channel }.send<Messages>()

let response = await send.echo("Hello World")
expect(response).toBe("Hello World")
```
