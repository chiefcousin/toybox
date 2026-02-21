"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

interface ZohoSettingsProps {
  isConnected: boolean;
  lastSyncAt: string | null;
  syncStatus: string;
  syncError: string | null;
  webhookToken: string;
  baseUrl: string;
}

export function ZohoSettings({
  isConnected,
  lastSyncAt,
  syncStatus: _initialSyncStatus,
  syncError: initialSyncError,
  webhookToken,
  baseUrl,
}: ZohoSettingsProps) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{
    total: number;
    created: number;
    updated: number;
    errors: string[];
  } | null>(null);
  const [syncError, setSyncError] = useState<string | null>(initialSyncError);
  const [copied, setCopied] = useState(false);

  const webhookUrl = `${baseUrl}/api/zoho/webhook?token=${webhookToken}`;

  async function handleSync() {
    setIsSyncing(true);
    setSyncResult(null);
    setSyncError(null);

    try {
      const res = await fetch("/api/zoho/sync", { method: "POST" });
      const json = await res.json();
      if (!res.ok) {
        setSyncError(json.error ?? "Sync failed");
      } else {
        setSyncResult(json.result);
      }
    } catch (err) {
      setSyncError(err instanceof Error ? err.message : "Network error");
    } finally {
      setIsSyncing(false);
    }
  }

  async function copyWebhookUrl() {
    await navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-5">
      {/* Connection status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className={`inline-block h-2.5 w-2.5 rounded-full ${
              isConnected ? "bg-green-500" : "bg-red-400"
            }`}
          />
          <span className="text-sm font-medium">
            {isConnected ? "Connected to Zoho Inventory" : "Not connected"}
          </span>
        </div>

        <Button variant="outline" size="sm" asChild>
          <a href="/api/zoho/auth">
            {isConnected ? "Reconnect" : "Connect Zoho"}
          </a>
        </Button>
      </div>

      {/* Sync controls — only when connected */}
      {isConnected && (
        <>
          {/* Manual sync */}
          <div className="flex items-center gap-4 border-t pt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSync}
              disabled={isSyncing}
            >
              {isSyncing ? (
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Syncing…
                </span>
              ) : (
                "Sync Products from Zoho"
              )}
            </Button>

            {lastSyncAt && (
              <span className="text-xs text-muted-foreground">
                Last synced:{" "}
                {new Date(lastSyncAt).toLocaleString(undefined, {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </span>
            )}
          </div>

          {/* Sync result */}
          {syncResult && (
            <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm">
              <p className="font-medium text-green-800">Sync complete</p>
              <p className="text-green-700">
                {syncResult.total} items from Zoho —{" "}
                <strong>{syncResult.created}</strong> created,{" "}
                <strong>{syncResult.updated}</strong> updated
                {syncResult.errors.length > 0 && (
                  <span className="text-red-700">
                    , {syncResult.errors.length} errors
                  </span>
                )}
              </p>
              {syncResult.errors.length > 0 && (
                <details className="mt-1.5">
                  <summary className="cursor-pointer text-xs text-green-600 hover:underline">
                    View errors
                  </summary>
                  <ul className="mt-1 space-y-0.5">
                    {syncResult.errors.map((e, i) => (
                      <li key={i} className="text-xs text-red-700">
                        {e}
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
          )}

          {syncError && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm">
              <p className="font-medium text-red-800">Sync error</p>
              <p className="text-red-700">{syncError}</p>
            </div>
          )}

          {/* Webhook URL */}
          <div className="border-t pt-4">
            <p className="mb-0.5 text-sm font-medium">Webhook URL</p>
            <p className="mb-2 text-xs text-muted-foreground">
              Register this in Zoho Inventory → Settings → Webhooks for automatic
              real-time product updates when items change in Zoho.
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 overflow-x-auto rounded bg-muted px-3 py-2 text-xs">
                {webhookUrl}
              </code>
              <Button variant="outline" size="sm" onClick={copyWebhookUrl}>
                {copied ? "Copied!" : "Copy"}
              </Button>
            </div>
          </div>

          {/* How it works */}
          <div className="border-t pt-4 text-xs text-muted-foreground space-y-1">
            <p className="font-medium text-foreground text-sm">How it works</p>
            <p>
              <strong>Zoho → Kaira Enterprises:</strong> Click &quot;Sync Products from Zoho&quot; to pull item
              names, descriptions, prices, and stock into your catalog. Set up the
              webhook for automatic real-time updates.
            </p>
            <p>
              <strong>Kaira Enterprises → Zoho:</strong> When you mark a WhatsApp order as{" "}
              <strong>Confirmed</strong> in the Orders page, a Sales Order is
              automatically created in Zoho Inventory, decrementing stock.
            </p>
            <p>
              <strong>Compare At Price:</strong> Add a custom field labeled{" "}
              <em>Compare At Price</em> to your Zoho items to sync sale prices into
              Kaira Enterprises.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
