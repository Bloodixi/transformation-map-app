import Link from "next/link";
import { Button } from "./ui/button";
import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "./logout-button";
import { getLocale } from 'next-intl/server';

export async function AuthButton() {
  const supabase = await createClient();
  const locale = await getLocale();

  // You can also use getUser() which will be slower.
  const { data } = await supabase.auth.getClaims();

  const user = data?.claims;

  return user ? (
    <div className="flex items-center gap-4">
      Hey, {user.email}!
      <LogoutButton />
    </div>
  ) : (
    <div className="flex gap-2">
      <Button asChild size="sm" variant={"outline"}>
        <Link href={`/${locale}/auth/login`}>Войти</Link>
      </Button>
      <Button asChild size="sm" variant={"default"}>
        <Link href={`/${locale}/auth/sign-up`}>Регистрация</Link>
      </Button>
    </div>
  );
}
