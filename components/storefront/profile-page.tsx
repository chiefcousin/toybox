"use client";

import { useState, useEffect } from "react";
import {
  User,
  Phone,
  MapPin,
  Calendar,
  Loader2,
  Trash2,
  Pencil,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";

interface CustomerProfile {
  id: string;
  name: string;
  phone: string;
  address: string | null;
  created_at: string;
}

export function ProfilePage() {
  const [customer, setCustomer] = useState<CustomerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [legacyCookie, setLegacyCookie] = useState(false);

  // Edit state
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  // Delete state
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetch("/api/auth/customer/profile")
      .then((res) => {
        if (res.status === 403) {
          setLegacyCookie(true);
          setLoading(false);
          return null;
        }
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data) => {
        if (data?.customer) {
          setCustomer(data.customer);
          setName(data.customer.name);
          setPhone(data.customer.phone);
          setAddress(data.customer.address || "");
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  function startEditing() {
    if (!customer) return;
    setName(customer.name);
    setPhone(customer.phone);
    setAddress(customer.address || "");
    setSaveError("");
    setEditing(true);
  }

  async function handleSave() {
    setSaveError("");
    setSaving(true);
    try {
      const res = await fetch("/api/auth/customer/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, address }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update");

      // If phone changed the cookie was updated server-side; refresh to pick it up
      if (phone.trim().replace(/\s+/g, "") !== customer?.phone) {
        window.location.reload();
        return;
      }

      setCustomer((prev) =>
        prev
          ? {
              ...prev,
              name: name.trim(),
              phone: phone.trim().replace(/\s+/g, ""),
              address: address.trim() || null,
            }
          : prev
      );
      setEditing(false);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch("/api/auth/customer/profile", { method: "DELETE" });
      if (!res.ok) throw new Error();
      localStorage.removeItem("ka_customer_registered");
      window.location.href = "/signup";
    } catch {
      setDeleting(false);
    }
  }

  async function handleReRegister() {
    await fetch("/api/auth/customer/logout", { method: "POST" });
    localStorage.removeItem("ka_customer_registered");
    window.location.href = "/signup";
  }

  // ── Loading ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // ── Legacy cookie ─────────────────────────────────────────────────
  if (legacyCookie) {
    return (
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <User className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>Session Outdated</CardTitle>
          <CardDescription>
            We&apos;ve updated our system. Please sign up again to access your
            profile.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Button onClick={handleReRegister}>Sign Up Again</Button>
        </CardContent>
      </Card>
    );
  }

  // ── No customer found ─────────────────────────────────────────────
  if (!customer) {
    return (
      <Card>
        <CardHeader className="text-center">
          <CardTitle>Profile not found</CardTitle>
          <CardDescription>
            We couldn&apos;t find your profile. Please sign up again.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Button onClick={handleReRegister}>Sign Up Again</Button>
        </CardContent>
      </Card>
    );
  }

  // ── Edit mode ─────────────────────────────────────────────────────
  if (editing) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Edit Profile</CardTitle>
          <CardDescription>Update your account details below.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">
              Full Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="edit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Rahul Sharma"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-phone">
              WhatsApp Number <span className="text-destructive">*</span>
            </Label>
            <Input
              id="edit-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+919876543210"
              required
            />
            <p className="text-xs text-muted-foreground">
              Include country code (e.g. +91 for India)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-address">Delivery Address</Label>
            <Input
              id="edit-address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="123 MG Road, Mumbai"
            />
          </div>

          {saveError && <p className="text-sm text-destructive">{saveError}</p>}

          <div className="flex gap-3 pt-2">
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
            <Button
              variant="outline"
              onClick={() => setEditing(false)}
              disabled={saving}
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ── View mode ─────────────────────────────────────────────────────
  const memberSince = new Date(customer.created_at).toLocaleDateString(
    "en-IN",
    { year: "numeric", month: "long", day: "numeric" }
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <User className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle>{customer.name}</CardTitle>
                <CardDescription>Your account details</CardDescription>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={startEditing}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">WhatsApp Number</p>
              <p className="text-sm font-medium">{customer.phone}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Delivery Address</p>
              <p className="text-sm font-medium">
                {customer.address || "Not provided"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Member Since</p>
              <p className="text-sm font-medium">{memberSince}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Danger zone */}
      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="text-base text-destructive">
            Danger Zone
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Delete Account</p>
              <p className="text-xs text-muted-foreground">
                Permanently remove your account and all data.
              </p>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Delete your account?</DialogTitle>
                  <DialogDescription>
                    This action cannot be undone. Your account and all associated
                    data will be permanently deleted.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter className="gap-2 sm:gap-0">
                  <DialogClose asChild>
                    <Button variant="outline">Cancel</Button>
                  </DialogClose>
                  <Button
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={deleting}
                  >
                    {deleting && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Delete My Account
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
