import type { InternalApi } from 'nitropack'

export type ApiRoutes = keyof InternalApi
export type ApiResponse<
  T extends ApiRoutes,
  M extends keyof InternalApi[T]
> = InternalApi[T][M]
export const apiRef = <
  T extends ApiRoutes,
  M extends keyof InternalApi[T],
  D,
  P extends Record<string, string | number> = Record<string, never>, H extends Record<string, string> = Record<string, never>>(opts: {
  route: T
  method: M
  defaultValue: D
  params?: P
  headers?: H
}) => ref<ApiResponse<T, M> | D>(opts.defaultValue)
