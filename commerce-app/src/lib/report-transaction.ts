import type { AuthData } from "@saleor/app-sdk/APL";

const mutation = `
  mutation BotflagsTransactionEventReport(
    $transactionId: ID!, $message: String!, $amount: PositiveDecimal!,
    $pspReference: String!, $time: DateTime!, $type: TransactionEventTypeEnum!,
    $availableActions: [TransactionActionEnum!]
  ) {
    transactionEventReport(
      id: $transactionId, message: $message, amount: $amount,
      pspReference: $pspReference, time: $time, type: $type,
      availableActions: $availableActions
    ) { alreadyProcessed errors { message code } transactionEvent { id } }
  }
`;

export async function reportChargeSuccess(input: {
	authData: AuthData;
	transactionId: string;
	reference: string;
	amount: number;
	time: string;
}) {
	const response = await fetch(input.authData.saleorApiUrl, {
		method: "POST",
		headers: { Authorization: `Bearer ${input.authData.token}`, "Content-Type": "application/json" },
		body: JSON.stringify({
			query: mutation,
			variables: {
				transactionId: input.transactionId,
				message: "Paystack charge confirmed",
				amount: input.amount,
				pspReference: input.reference,
				time: input.time,
				type: "CHARGE_SUCCESS",
				availableActions: ["REFUND"],
			},
		}),
	});
	const body = (await response.json()) as {
		data?: { transactionEventReport?: { errors?: Array<{ message?: string }> } };
		errors?: Array<{ message?: string }>;
	};
	const error = body.errors?.[0]?.message ?? body.data?.transactionEventReport?.errors?.[0]?.message;
	if (!response.ok || error) throw new Error(error || "Saleor transaction report failed");
}
