import { SignIn } from "@clerk/nextjs";

import { AuthShell } from "@/components/auth/auth-shell";

export default function SignInPage() {
    return (
        <AuthShell headline="Turn your words into voices worth hearing.">
            <SignIn
                signUpUrl="/sign-up"
                forceRedirectUrl="/"
            />
        </AuthShell>
    );
}
