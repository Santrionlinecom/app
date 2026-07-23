export const isSuccessfulMidtransTransaction = (transactionStatus: string, fraudStatus: string) =>
	transactionStatus === 'settlement' ||
	(transactionStatus === 'capture' && fraudStatus.toLowerCase() === 'accept');

export const mapMidtransPaymentStatus = (transactionStatus: string, fraudStatus: string) => {
	if (isSuccessfulMidtransTransaction(transactionStatus, fraudStatus)) return 'sukses';

	switch (transactionStatus) {
		case 'expire':
			return 'expired';
		case 'cancel':
			return 'canceled';
		case 'deny':
			return 'denied';
		case 'refund':
			return 'refunded';
		case 'partial_refund':
			// Keep the order fulfilled: a partial refund does not justify revoking
			// the entire coin credit or addon. provider_status still records it.
			return 'sukses';
		case 'failure':
			return 'gagal';
		default:
			return 'pending';
	}
};
