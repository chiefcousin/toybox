import type { Metadata } from "next";
import { ProfilePage } from "@/components/storefront/profile-page";

export const metadata: Metadata = {
  title: "My Profile - Kaira Enterprises",
  description: "View and manage your account details",
};

export default function ProfileRoute() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <ProfilePage />
    </div>
  );
}
