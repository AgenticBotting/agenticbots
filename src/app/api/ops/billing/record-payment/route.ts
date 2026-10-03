import { handle, json, body } from "@/server/api";
import { repo } from "@/server/db";
import { requireActor } from "@/server/auth/guard";
import { recordPayment, type RecordPaymentInput } from "@/server/billing/service";

/** POST /api/ops/billing/record-payment — operator records an ACH/wire/check payment. */
export const POST = (req: Request) =>
  handle(async () => {
    const b = await body<RecordPaymentInput>(req);
    return json(await recordPayment(await repo(), await requireActor(), b), 201);
  });
