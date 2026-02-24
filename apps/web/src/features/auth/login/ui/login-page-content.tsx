import type { FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { useLoginForm } from "../model/use-login-form";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";

export function LoginPageContent() {
  const form = useLoginForm();

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await form.submit();
  };

  return (
    <main className="mx-auto flex w-full max-w-md items-center px-4 pb-4 pt-16">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>ログイン</CardTitle>
          <CardDescription>auth.takagi.dev の認証基盤を利用します。</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="space-y-2">
              <Label htmlFor="username">ユーザー名</Label>
              <Input
                id="username"
                value={form.username}
                onChange={(event) => form.setUsername(event.target.value)}
                autoComplete="username"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">パスワード</Label>
              <Input
                id="password"
                type="password"
                value={form.password}
                onChange={(event) => form.setPassword(event.target.value)}
                autoComplete="current-password"
                required
              />
            </div>
            {form.error && <p className="text-sm text-destructive">{form.error}</p>}
            <Button type="submit" className="w-full" disabled={form.loading}>
              {form.loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ログイン中...
                </>
              ) : (
                "ログイン"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
