export type LearnLockStatus = 'belum' | 'proses' | 'selesai';

export type TrackLockInput = {
	pathKey: string;
	status: LearnLockStatus;
};

export const applyTrackLocks = <T extends TrackLockInput>(
	modules: T[]
): Array<T & { locked: boolean }> => {
	const previousStatusByPath = new Map<string, LearnLockStatus>();

	return modules.map((module) => {
		const pathKey = module.pathKey || 'arabic_nahwu';
		const previousStatus = previousStatusByPath.get(pathKey);
		const locked = previousStatus !== undefined && previousStatus !== 'selesai';
		previousStatusByPath.set(pathKey, module.status);
		return { ...module, locked };
	});
};
