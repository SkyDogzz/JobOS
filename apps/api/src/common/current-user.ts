import { AsyncLocalStorage } from "node:async_hooks";
import { UnauthorizedException } from "@nestjs/common";

type RequestContext = {
  userId: string | null;
};

const requestContext = new AsyncLocalStorage<RequestContext>();

export function runWithCurrentUser<T>(userId: string | null, callback: () => T) {
  return requestContext.run({ userId }, callback);
}

export function currentUserId() {
  return requestContext.getStore()?.userId ?? null;
}

export function requireCurrentUserId() {
  const userId = currentUserId();
  if (!userId) throw new UnauthorizedException("Authentication required.");
  return userId;
}
