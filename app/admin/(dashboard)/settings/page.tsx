import { createClient } from "@/lib/supabase/server";
import { SettingsForm } from "@/components/admin/settings-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function SettingsPage() {
  const supabase = createClient();

  // Fetch all store settings
  const { data: settings } = await supabase
    .from("store_settings")
    .select("*");

  // Convert array to object for easier access
  const settingsObj = settings?.reduce((acc, setting) => {
    acc[setting.key] = setting.value;
    return acc;
  }, {} as Record<string, string>) || {};

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Store Settings</h1>
        <p className="text-muted-foreground">
          Configure your store information and preferences
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>General Settings</CardTitle>
          <CardDescription>
            Update your store name, contact information, and homepage content
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SettingsForm settings={settingsObj} />
        </CardContent>
      </Card>
    </div>
  );
}
