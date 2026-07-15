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
		case 'partial_refund':
			return 'refunded';
		case 'failure':
			return 'gagal';
		default:
			return 'pending';
	}
};
