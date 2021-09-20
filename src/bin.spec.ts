// (C)opyright 2021-07-15 Dirk Holtwick, holtwick.it. All rights reserved.

import { equalBinary } from "./bin"
import { pingMessage, pongMessage } from "./types"

describe("bin", () => {
  it("should compare", () => {
    expect(equalBinary(pingMessage, pongMessage)).toBe(false)
    expect(equalBinary(pingMessage, pingMessage)).toBe(true)
  })
})
