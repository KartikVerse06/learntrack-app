import { Settings, Bell, Volume2, Globe, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function SettingsPage() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div className="pb-2 border-b">
        <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Settings className="h-6 w-6 text-primary" />
          <span>Settings & Preferences</span>
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your focus duration defaults, sound chimes, notification permissions, and timezone.
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              <span>Focus Session Defaults</span>
            </CardTitle>
            <CardDescription>Default duration for deliberate study blocks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="p-3 bg-muted/40 rounded-lg text-sm text-muted-foreground">
              Locked to <strong className="text-foreground">45 minutes</strong> (2,700 seconds) in MVP.
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Bell className="h-4 w-4 text-primary" />
              <span>Desktop Notifications</span>
            </CardTitle>
            <CardDescription>Web Notifications API integration</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="p-3 bg-muted/40 rounded-lg text-sm text-muted-foreground">
              Alerts will trigger upon 45-minute focus session completion.
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Volume2 className="h-4 w-4 text-primary" />
              <span>Sound & Audio Chimes</span>
            </CardTitle>
            <CardDescription>HTML5 Audio notification chimes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="p-3 bg-muted/40 rounded-lg text-sm text-muted-foreground">
              Pre-unlocked on focus start to gracefully comply with browser autoplay policies.
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Globe className="h-4 w-4 text-primary" />
              <span>Timezone Configuration</span>
            </CardTitle>
            <CardDescription>Ensures revision dates remain aligned with local calendar days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="p-3 bg-muted/40 rounded-lg text-sm text-muted-foreground">
              Calculations evaluate boundaries against user local time to prevent off-by-one errors.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
