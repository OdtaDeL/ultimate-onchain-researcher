"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageLayout, SafeArea, Section } from "@/components/layout";
import { Divider } from "@/components/ui";
import { typography } from "@/lib/theme";

export default function AboutPage() {
  const router = useRouter();

  return (
    <PageLayout
      header={
        <SafeArea edges={["top"]}>
          <div className="flex items-center gap-2 px-2 py-1.5">
            <button
              type="button"
              onClick={() => router.back()}
              aria-label="Back"
              className="flex size-11 shrink-0 items-center justify-center text-foreground"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className={typography.heading.className}>About</h1>
          </div>
        </SafeArea>
      }
    >
      <SafeArea edges={["bottom"]} className="pb-8">
        <Section className="px-4 py-6">
          <div className="mb-1 text-[22px] font-bold leading-7 text-foreground">
            Ultimate Onchain Researcher
          </div>
          <div className="text-[14px] leading-5 text-muted-foreground">
            Crypto research companion for Telegram
          </div>
        </Section>

        <Divider variant="full" />

        <Section className="px-4 py-4">
          <div className="space-y-3 text-[14px] leading-5 text-muted-foreground">
            <p>
              Track projects, funds, and on-chain activity from inside Telegram. Weekly rankings,
              funding rounds, token unlocks, and portfolio analysis — all in one place.
            </p>
            <p>
              Data is aggregated from public on-chain sources and updated continuously.
            </p>
          </div>
        </Section>

        <Divider variant="full" />

        <Section className="px-4 py-4">
          <div className="flex items-center justify-between text-[14px]">
            <span className="text-muted-foreground">Version</span>
            <span className="font-medium text-foreground">1.0.0</span>
          </div>
        </Section>
      </SafeArea>
    </PageLayout>
  );
}
