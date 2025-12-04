import { router } from "@/server/trpc";
import { authRouter } from "./auth";
import { requestRouter } from "./request";
import { subscriptionRouter } from "./subscription";
import { packageRouter } from "./package";
import { adminRouter } from "./admin";
import { providerRouter } from "./provider";
import { notificationRouter } from "./notification";

export const appRouter = router({
  auth: authRouter,
  request: requestRouter,
  subscription: subscriptionRouter,
  package: packageRouter,
  admin: adminRouter,
  provider: providerRouter,
  notification: notificationRouter,
});

export type AppRouter = typeof appRouter;
