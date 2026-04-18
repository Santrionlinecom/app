import type { D1Database } from '@cloudflare/workers-types';
import { listDigitalPaymentMethods, upsertDigitalPaymentMethod } from '$lib/server/digital-commerce';

const DEFAULT_MANUAL_PAYMENT_METHODS = [
	{
		id: 'manual-bca-yogik',
		name: 'BCA Transfer',
		type: 'bank' as const,
		accountName: 'Yogik Pratama Aprilian',
		accountNumber: '3314050695',
		instructions: 'Transfer sesuai nominal lalu upload bukti bayar.',
		displayOrder: 1
	},
	{
		id: 'manual-bank-jago-yogik',
		name: 'Bank Jago',
		type: 'bank' as const,
		accountName: 'Yogik Pratama Aprilian',
		accountNumber: '505492752074',
		instructions: 'Transfer sesuai nominal lalu upload bukti bayar.',
		displayOrder: 2
	},
	{
		id: 'manual-gopay-yogik',
		name: 'GoPay',
		type: 'ewallet' as const,
		accountName: 'Yogik Pratama Aprilian',
		accountNumber: '087854545274',
		instructions: 'Kirim sesuai nominal lalu upload bukti bayar.',
		displayOrder: 3
	},
	{
		id: 'manual-shopeepay-yogik',
		name: 'ShopeePay',
		type: 'ewallet' as const,
		accountName: 'Yogik Pratama Aprilian',
		accountNumber: '087854545274',
		instructions: 'Kirim sesuai nominal lalu upload bukti bayar.',
		displayOrder: 4
	},
	{
		id: 'manual-dana-yogik',
		name: 'DANA',
		type: 'ewallet' as const,
		accountName: 'Yogik Pratama Aprilian',
		accountNumber: '083878535157',
		instructions: 'Kirim sesuai nominal lalu upload bukti bayar.',
		displayOrder: 5
	},
	{
		id: 'manual-qris-santri-cell',
		name: 'QRIS Santri Cell',
		type: 'qris' as const,
		accountName: 'Yogik Pratama Aprilian',
		accountNumber: 'Scan QRIS',
		assetUrl: 'https://files.santrionline.com/qris%20SANTRI%20CELL.jpg',
		instructions: 'Scan QR lalu upload bukti bayar.',
		displayOrder: 6
	}
];

export async function ensureDefaultManualPaymentMethods(db: D1Database) {
	const methods = await listDigitalPaymentMethods(db);
	const ids = new Set(methods.map((method) => method.id));
	const names = new Set(methods.map((method) => method.name.trim().toLowerCase()));

	for (const method of DEFAULT_MANUAL_PAYMENT_METHODS) {
		if (ids.has(method.id) || names.has(method.name.trim().toLowerCase())) continue;
		await upsertDigitalPaymentMethod(db, {
			id: method.id,
			name: method.name,
			type: method.type,
			accountName: method.accountName,
			accountNumber: method.accountNumber,
			assetUrl: method.assetUrl ?? null,
			instructions: method.instructions,
			displayOrder: method.displayOrder,
			isActive: true
		});
	}
}
