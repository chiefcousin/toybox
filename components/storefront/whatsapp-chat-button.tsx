"use client";

interface WhatsAppChatButtonProps {
  phone: string | null | undefined;
}

export function WhatsAppChatButton({ phone }: WhatsAppChatButtonProps) {
  if (!phone) return null;

  const cleanPhone = phone.replace(/[^0-9+]/g, "");
  const chatUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent("Hi! I have a question about your products.")}`;

  return (
    <a
      href={chatUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      title="Chat with us on WhatsApp"
      className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] shadow-lg transition-transform hover:scale-110 hover:shadow-xl md:bottom-8 md:right-8"
    >
      {/* WhatsApp SVG icon */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 32 32"
        className="h-8 w-8 fill-white"
      >
        <path d="M16 0C7.163 0 0 7.163 0 16c0 2.82.734 5.47 2.02 7.774L0 32l8.467-2.217A15.94 15.94 0 0016 32c8.837 0 16-7.163 16-16S24.837 0 16 0zm0 29.333a13.278 13.278 0 01-6.76-1.846l-.483-.288-5.026 1.316 1.34-4.896-.315-.502A13.266 13.266 0 012.667 16C2.667 8.636 8.636 2.667 16 2.667S29.333 8.636 29.333 16 23.364 29.333 16 29.333zm7.275-9.938c-.398-.199-2.355-1.161-2.72-1.294-.364-.133-.63-.199-.895.2-.266.398-1.029 1.294-1.262 1.56-.232.265-.465.298-.863.1-.398-.2-1.68-.619-3.2-1.974-1.183-1.054-1.981-2.354-2.213-2.752-.232-.399-.025-.614.175-.812.18-.179.398-.465.597-.698.2-.232.266-.398.399-.664.133-.265.066-.498-.033-.697-.1-.2-.895-2.157-1.227-2.953-.323-.776-.65-.67-.895-.683l-.763-.013c-.266 0-.697.1-1.062.498-.365.399-1.393 1.361-1.393 3.318s1.427 3.849 1.626 4.115c.2.265 2.808 4.286 6.804 6.013.951.41 1.694.655 2.272.839.955.303 1.823.26 2.51.158.765-.114 2.355-.963 2.688-1.893.332-.93.332-1.727.232-1.893-.1-.166-.365-.265-.763-.464z" />
      </svg>
    </a>
  );
}
