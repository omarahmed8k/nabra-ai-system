"use client";

import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { useLocale } from "next-intl";

import { cn } from "@/lib/utils";

type TabsDirection = "ltr" | "rtl";

function useTabsDirection(dirProp?: React.HTMLAttributes<HTMLElement>["dir"]): TabsDirection {
  const locale = useLocale();
  const isRtl = locale === "ar";

  const normalizedDir = dirProp === "rtl" || dirProp === "ltr" ? dirProp : undefined;

  return normalizedDir ?? (isRtl ? "rtl" : "ltr");
}

const Tabs = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Root>
>(({ dir, ...props }, ref) => {
  const direction = useTabsDirection(dir);
  return <TabsPrimitive.Root ref={ref} dir={direction} {...props} />;
});
Tabs.displayName = TabsPrimitive.Root.displayName;

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, dir, ...props }, ref) => {
  const direction = useTabsDirection(dir);
  return (
    <TabsPrimitive.List
      dir={direction}
      ref={ref}
      className={cn(
        "inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground",
        className
      )}
      {...props}
    />
  );
});
TabsList.displayName = TabsPrimitive.List.displayName;

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, dir, ...props }, ref) => {
  const direction = useTabsDirection(dir);
  return (
    <TabsPrimitive.Trigger
      ref={ref}
      dir={direction}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm",
        className
      )}
      {...props}
    />
  );
});
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, dir, ...props }, ref) => {
  const direction = useTabsDirection(dir);
  return (
    <TabsPrimitive.Content
      ref={ref}
      dir={direction}
      className={cn(
        "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className
      )}
      {...props}
    />
  );
});
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsList, TabsTrigger, TabsContent };
