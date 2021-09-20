import { webSocketPath } from "./types"

export const getWebsocketUrlFromLocation = (path: string = webSocketPath) =>
  `ws${location.protocol.substr(4)}//${location.host}${path}`
