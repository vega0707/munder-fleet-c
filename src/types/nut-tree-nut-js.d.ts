/**
 * Ambient types for optional @nut-tree/nut-js.
 * Proprietary package — not on public npm. Runtime loads via require() when installed.
 */
declare module '@nut-tree/nut-js' {
  export type Key = string | number

  export const Key: Record<string, Key>

  export class Point {
    constructor(x: number, y: number)
    x: number
    y: number
  }

  export enum Button {
    LEFT = 0,
    MIDDLE = 1,
    RIGHT = 2
  }

  export const mouse: {
    getPosition(): Promise<{ x: number; y: number }>
    setPosition(point: Point | { x: number; y: number }): Promise<void>
    leftClick(): Promise<void>
    rightClick(): Promise<void>
    doubleClick(): Promise<void>
    click(button: Button): Promise<void>
    scrollDown(amount: number): Promise<void>
    scrollUp(amount: number): Promise<void>
  }

  export const keyboard: {
    type(text: string): Promise<void>
    pressKey(...keys: Key[]): Promise<void>
    releaseKey(...keys: Key[]): Promise<void>
  }

  export const screen: {
    width(): Promise<number>
    height(): Promise<number>
  }
}
