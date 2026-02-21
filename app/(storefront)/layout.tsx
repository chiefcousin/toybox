import { StorefrontHeader } from "@/components/storefront/header";
import { StorefrontFooter } from "@/components/storefront/footer";
import { SignupPopup } from "@/components/storefront/signup-popup";
import { WhatsAppChatButton } from "@/components/storefront/whatsapp-chat-button";
import { getStoreSetting } from "@/lib/store-settings";

export const dynamic = "force-dynamic";

export default async function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const whatsappNumber = await getStoreSetting("whatsapp_number");

  return (
    <div className="flex min-h-screen flex-col">
      <StorefrontHeader />
      <main className="flex-1">{children}</main>
      <StorefrontFooter />
      <SignupPopup />
      <WhatsAppChatButton phone={whatsappNumber} />
    </div>
  );
}
