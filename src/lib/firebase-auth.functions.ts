import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/**
 * Exchange a verified Firebase Phone Auth ID token for a Lovable Cloud session.
 * The token is validated with Google before any account is created.
 */
export const exchangeFirebaseToken = createServerFn({ method: "POST" })
  .inputValidator((input) => z.object({ idToken: z.string().min(20) }).parse(input))
  .handler(async ({ data }) => {
    const { verifyFirebaseIdToken, mintSessionForPhone } =
      await import("@/lib/firebase-auth.server");
    const verified = await verifyFirebaseIdToken(data.idToken);
    return mintSessionForPhone(verified.phoneNumber, verified.uid);
  });
