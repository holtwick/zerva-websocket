import { Logger, LoggerNodeHandler, LogLevel } from "zeed"

Logger.setHandlers([
  LoggerNodeHandler({
    level: LogLevel.debug,
    filter: "*",
    colors: true,
    fill: 32,
    nameBrackets: false,
    levelHelper: false,
  }),
])

Logger.setLock(true)
