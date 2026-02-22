import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { UserPlus } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Settings</h2>
        <p className="text-muted-foreground">Organization and account settings.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Team</CardTitle>
          <CardDescription>Invite staff and manage team members.</CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/dashboard/settings/invite">
            <Button variant="outline" leftIcon={<UserPlus className="h-4 w-4" />}>
              Invite staff
            </Button>
          </Link>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Settings</CardTitle>
          <CardDescription>Use useOrganization and user.service for profile and org settings.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Content coming soon.</p>
        </CardContent>
      </Card>
    </div>
  );
}
