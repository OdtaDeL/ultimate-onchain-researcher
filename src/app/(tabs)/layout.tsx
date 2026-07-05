import type { ReactNode } from "react";
import { PageLayout } from "@/components/layout";
import { BottomNavigation } from "@/components/navigation";
import { OnboardingOverlay } from "@/components/features/onboarding";

/**
 * Shared layout for the 5 primary tabs (Home, Markets, Search, Watchlist,
 * Profile). `BottomNavigation` is rendered exactly once here — every tab
 * page below renders only its own header/content, never its own copy of
 * the nav bar. Project/Fund Detail live outside this route group, so they
 * never receive a `footer` and the Bottom Navigation disappears
 * automatically, with no per-screen conditional needed.
 *
 * `OnboardingOverlay` is a fixed-position client component that covers the
 * viewport on first launch. It reads `onboardingDone` from the persisted
 * settings store and renders nothing once the user completes the flow.
 */
export default function TabsLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <PageLayout footer={<BottomNavigation />}>{children}</PageLayout>
      <OnboardingOverlay />
    </>
  );
}
