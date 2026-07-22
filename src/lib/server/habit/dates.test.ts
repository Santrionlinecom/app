import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
	addDays,
	computeCurrentStreak,
	countMetInWindow,
	defaultPilotWindow,
	diffDays,
	formatLocalDate,
	isConsistent5of7,
	isValidLocalDate,
	weekStartMonday
} from './dates.ts';
import { normalizeCheckinPayload, supportCopyFor, dayStatusFor } from './service.ts';
import type { HabitCheckin } from './types.ts';

describe('habit dates', () => {
	it('validates local dates', () => {
		assert.equal(isValidLocalDate('2026-07-22'), true);
		assert.equal(isValidLocalDate('2026-02-30'), false);
		assert.equal(isValidLocalDate('22-07-2026'), false);
	});

	it('adds days and builds 28-day pilot window', () => {
		assert.equal(addDays('2026-07-01', 27), '2026-07-28');
		assert.equal(diffDays('2026-07-01', '2026-07-28'), 27);
		const window = defaultPilotWindow('2026-07-01');
		assert.deepEqual(window, { startDate: '2026-07-01', endDate: '2026-07-28' });
	});

	it('computes Monday week start', () => {
		// 2026-07-22 is Wednesday
		assert.equal(weekStartMonday('2026-07-22'), '2026-07-20');
		// Sunday rolls back to previous Monday
		assert.equal(weekStartMonday('2026-07-26'), '2026-07-20');
	});

	it('counts 5 of 7 consistency', () => {
		const met = ['2026-07-16', '2026-07-17', '2026-07-18', '2026-07-19', '2026-07-20'];
		assert.equal(isConsistent5of7(met, '2026-07-22'), true);
		assert.equal(countMetInWindow(met, '2026-07-22', 7).met, 5);
		assert.equal(isConsistent5of7(['2026-07-20', '2026-07-21'], '2026-07-22'), false);
	});

	it('computes streak ending at date', () => {
		const met = new Set(['2026-07-20', '2026-07-21', '2026-07-22']);
		assert.equal(computeCurrentStreak(met, '2026-07-22'), 3);
		assert.equal(computeCurrentStreak(met, '2026-07-23'), 0);
	});

	it('formats WIB-ish calendar date without throwing', () => {
		const formatted = formatLocalDate(new Date('2026-07-22T00:30:00.000Z'), 'Asia/Jakarta');
		assert.match(formatted, /^\d{4}-\d{2}-\d{2}$/);
	});
});

describe('habit normalize checkin', () => {
	it('marks quran met only at 10+ minutes', () => {
		const short = normalizeCheckinPayload({
			missionKey: 'quran_harian',
			mode: 'membaca',
			durationBucket: '5-9'
		});
		assert.equal(short.isDayMet, false);
		assert.equal(short.status, 'usaha');

		const ok = normalizeCheckinPayload({
			missionKey: 'quran_harian',
			mode: 'murajaah',
			durationBucket: '10-19'
		});
		assert.equal(ok.isDayMet, true);
		assert.equal(ok.status, 'tercapai');
	});

	it('treats shalat uzur as non-failure handled time', () => {
		const result = normalizeCheckinPayload({
			missionKey: 'shalat_wajib',
			times: {
				subuh: 'tepat_waktu',
				zuhur: 'uzur',
				asar: 'belum'
			}
		});
		assert.equal(result.isDayMet, true);
		assert.equal(result.status, 'sebagian');
		const detail = JSON.parse(result.detailJson!);
		assert.equal(detail.keptCount, 1);
		assert.equal(detail.times.zuhur, 'uzur');
	});

	it('requires kebaikan done flag for met day', () => {
		const done = normalizeCheckinPayload({
			missionKey: 'amal_adab_harian',
			done: true,
			category: 'orang_tua'
		});
		assert.equal(done.isDayMet, true);
		assert.equal(done.status, 'sudah');

		const pending = normalizeCheckinPayload({
			missionKey: 'amal_adab_harian',
			done: false
		});
		assert.equal(pending.isDayMet, false);
	});
});

describe('habit ui helpers', () => {
	it('maps day status and support copy', () => {
		assert.equal(dayStatusFor(null), 'pending');
		const partial: HabitCheckin = {
			id: '1',
			userId: 'u',
			missionKey: 'quran_harian',
			localDate: '2026-07-22',
			status: 'usaha',
			detail: { mode: 'membaca' },
			durationBucket: '5-9',
			optionalReflection: null,
			isDayMet: false,
			createdAt: 1,
			updatedAt: 1
		};
		assert.equal(dayStatusFor(partial), 'partial');
		assert.match(supportCopyFor('quran_harian', partial), /Usahamu/);
	});
});
