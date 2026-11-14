import { OrderStatus } from "../generated/prisma/enums.ts";

// The fulfilment state machine. Forward only, one step at a time.
// PENDING is the initial state (set at checkout), so it is never a valid target.
// To allow a correction step (for example PROCESSING -> PENDING), add it to the array here.
export const NEXT_STATUS = Object.freeze({
  [OrderStatus.PENDING]: [OrderStatus.PROCESSING],
  [OrderStatus.PROCESSING]: [OrderStatus.SHIPPED],
  [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED],
  [OrderStatus.DELIVERED]: [],
});
