"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Bookmark, ChevronRight, Info, MessageCircle, Settings } from "lucide-react";
import { SafeArea, Section, StickyHeader } from "@/components/layout";
import { Avatar, Divider } from "@/components/ui";
import { useAuthIdentity, useTelegramViewport } from "@/store";
import { typography } from "@/lib/theme";

interface ProfileRowProps {
  icon: ReactNode;
  label: string;
  value?: string;
  onClick: () => void;
}

function ProfileRow({ icon, label, value, onClick }: ProfileRowProps) {
  return (
    <button type="button" onClick={onClick} className="flex min-h-14 w-full items-center gap-3 px-4 text-left">
      <span className="text-muted-foreground">{icon}</span>
      <span className="flex-1 text-[15px] font-medium leading-5 text-foreground">{label}</span>
      {value ? <span className="text-[13px] leading-[18px] tracking-[0.1px] text-muted-foreground">{value}</span> : null}
      <ChevronRight size={16} className="text-muted-foreground" />
    </button>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const telegram = useTelegramViewport();
  const identity = useAuthIdentity();

  return (
    <>
      <StickyHeader>
        <SafeArea edges={["top"]}>
          <div className="px-4 py-3">
            <h1 className={typography.heading.className}>Profile</h1>
          </div>
        </SafeArea>
      </StickyHeader>

      <SafeArea edges={["bottom"]} className="flex flex-col pb-8">
        <Section className="flex flex-col items-center gap-2 px-4 text-center">
          <Avatar alt={identity?.firstName ?? "Guest"} fallback={(identity?.firstName ?? "Guest").slice(0, 2).toUpperCase()} size="xl" />
          <span className="text-[17px] font-semibold leading-[22px] text-foreground">{identity?.firstName ?? "Guest"}</span>
          {identity?.username ? <span className="text-[14px] leading-[20px] text-muted-foreground">@{identity.username}</span> : null}
        </Section>

        <Section>
          <ProfileRow
            icon={<MessageCircle size={20} />}
            label="Telegram Account"
            value={telegram.isAvailable ? "Connected" : "Not connected"}
            onClick={() => {}}
          />
          <Divider variant="full" />
          <ProfileRow icon={<Bookmark size={20} />} label="Favorites" onClick={() => router.push("/favorites")} />
          <Divider variant="full" />
          <ProfileRow icon={<Settings size={20} />} label="Settings" onClick={() => router.push("/settings")} />
          <Divider variant="full" />
          <ProfileRow icon={<Info size={20} />} label="About" onClick={() => router.push("/about")} />
        </Section>
      </SafeArea>
    </>
  );
}
