import { router } from "@/server/trpc";
import { authRouter } from "./auth";
import { requestRouter } from "./request";
import { subscriptionRouter } from "./subscription";
import { packageRouter } from "./package";
import { adminRouter } from "./admin";
import { providerRouter } from "./provider";
import { notificationRouter } from "./notification";
import { paymentRouter } from "./payment";

export const appRouter = router({
  auth: authRouter,
  request: requestRouter,
  subscription: subscriptionRouter,
  package: packageRouter,
  admin: adminRouter,
  provider: providerRouter,
  notification: notificationRouter,
  payment: paymentRouter,
});

export type AppRouter = typeof appRouter;
