import { convexAuth } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";

/**
 * Email and password for course buyers.
 *
 * No role system here — the only question this app asks is "has this
 * person paid", and that is a purchases row, not a role.
 */
export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [Password],
});
