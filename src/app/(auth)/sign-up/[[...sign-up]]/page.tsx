import { SignUp } from "@clerk/nextjs";

import { AuthShell } from "@/components/auth/auth-shell";

export default function SignUpPage() {
    return (
        <AuthShell headline="Your next great voice starts here.">
            <SignUp
                signInUrl="/sign-in"
                forceRedirectUrl="/"
            />
        </AuthShell>
    );
}
