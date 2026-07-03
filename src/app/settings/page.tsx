"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, Moon, Sun } from "lucide-react";
import { PageLayout, SafeArea, Section, SectionHeader } from "@/components/layout";
import { Card } from "@/components/ui";
import { typography } from "@/lib/theme";
import { useThemePreference, useSetTheme } from "@/store";
import type { ThemePreference } from "@/store";

interface ThemeOptionProps {
  label: string;
  icon: React.ReactNode;
  value: ThemePreference;
  current: ThemePreference;
  onSelect: (value: ThemePreference) => void;
}

function ThemeOption({ label, icon, value, current, onSelect }: ThemeOptionProps) {
  const isActive = value === current;
  return (
    <button
      type="button"
      onClick={() => onSelect(value)}
      aria-pressed={isActive}
      className={`flex flex-1 flex-col items-center gap-2 rounded-xl border px-4 py-5 text-center transition-colors ${
        isActive
          ? "border-accent bg-accent/10 text-accent"
          : "border-border bg-card text-muted-foreground"
      }`}
    >
      {icon}
      <span className="text-[13px] font-medium leading-[18px]">{label}</span>
    </button>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const theme = useThemePreference();
  const setTheme = useSetTheme();

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
            <h1 className={typography.heading.className}>Settings</h1>
          </div>
        </SafeArea>
      }
    >
      <SafeArea edges={["bottom"]} className="pb-8">
        <Section>
          <SectionHeader title="Appearance" />
          <Card className="p-4">
            <div className="flex gap-3">
              <ThemeOption
                label="Dark"
                icon={<Moon size={22} />}
                value="dark"
                current={theme}
                onSelect={setTheme}
              />
              <ThemeOption
                label="Light"
                icon={<Sun size={22} />}
                value="light"
                current={theme}
                onSelect={setTheme}
              />
            </div>
          </Card>
        </Section>
      </SafeArea>
    </PageLayout>
  );
}
