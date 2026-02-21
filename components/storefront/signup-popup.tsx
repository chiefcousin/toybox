"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { X, Phone, ShieldCheck, User, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const STORAGE_KEY = "ka_customer_registered";

type Step = "phone" | "otp" | "profile" | "done";

export function SignupPopup() {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [devOtp, setDevOtp] = useState<string | null>(null);

  useEffect(() => {
    // Don't show if already registered
    if (typeof window !== "undefined" && localStorage.getItem(STORAGE_KEY)) return;

    const timer = setTimeout(() => setVisible(true), 5000);
    return () => clearTimeout(timer);
  }, []);

  function dismiss() {
    setVisible(false);
    // Don't set storage on dismiss — show again next visit until completed
  }

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/customer/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send OTP");
      if (data.otp) setDevOtp(data.otp); // dev mode only
      setStep("otp");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/customer/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, otp }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to verify OTP");
      setDevOtp(null);
      setStep("profile");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleCompleteProfile(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/customer/complete-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, name, address }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save profile");
      localStorage.setItem(STORAGE_KEY, "1");
      setStep("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
        {/* Close button */}
        {step !== "done" && (
          <button
            onClick={dismiss}
            className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        )}

        {step === "phone" && (
          <>
            <div className="mb-5 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <Phone className="h-6 w-6 text-green-600" />
              </div>
              <h2 className="text-xl font-bold">Create Your Account</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Sign up with your WhatsApp number to track orders and get updates.
              </p>
            </div>
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="popup-phone">WhatsApp Number</Label>
                <Input
                  id="popup-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+2348012345678"
                  required
                  autoFocus
                />
                <p className="text-xs text-muted-foreground">
                  Include country code (e.g. +234 for Nigeria)
                </p>
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Send OTP via WhatsApp
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                By signing up you agree to our{" "}
                <Link href="/privacy" className="underline hover:text-foreground" target="_blank">
                  Privacy Policy
                </Link>
                .
              </p>
            </form>
          </>
        )}

        {step === "otp" && (
          <>
            <div className="mb-5 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                <ShieldCheck className="h-6 w-6 text-blue-600" />
              </div>
              <h2 className="text-xl font-bold">Enter OTP</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                We sent a 6-digit code to{" "}
                <span className="font-medium text-foreground">{phone}</span>
              </p>
              {devOtp && (
                <p className="mt-2 rounded bg-yellow-50 px-2 py-1 text-xs text-yellow-700">
                  Dev mode — OTP: <strong>{devOtp}</strong>
                </p>
              )}
            </div>
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="popup-otp">6-Digit OTP</Label>
                <Input
                  id="popup-otp"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  placeholder="123456"
                  required
                  autoFocus
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading || otp.length !== 6}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Verify OTP
              </Button>
              <button
                type="button"
                className="w-full text-sm text-muted-foreground underline"
                onClick={() => { setStep("phone"); setError(""); setOtp(""); }}
              >
                Change number or resend OTP
              </button>
            </form>
          </>
        )}

        {step === "profile" && (
          <>
            <div className="mb-5 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <User className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-xl font-bold">Complete Your Profile</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Just a few more details to complete your account.
              </p>
            </div>
            <form onSubmit={handleCompleteProfile} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="popup-name">Full Name <span className="text-destructive">*</span></Label>
                <Input
                  id="popup-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  required
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="popup-address">Delivery Address</Label>
                <Input
                  id="popup-address"
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="123 Main Street, Lagos"
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save & Continue
              </Button>
            </form>
          </>
        )}

        {step === "done" && (
          <div className="py-4 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
              <ShieldCheck className="h-7 w-7 text-green-600" />
            </div>
            <h2 className="text-xl font-bold">You&apos;re all set!</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Welcome to Kaira Enterprises, {name}! You can now order products via WhatsApp and we&apos;ll keep you updated.
            </p>
            <Button className="mt-5 w-full" onClick={() => setVisible(false)}>
              Start Shopping
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
