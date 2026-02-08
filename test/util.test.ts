import {
	angleDiff,
	normalizeAngle,
	ANGLE_MAX
} from '../src/util.js';

import { describe, it, expect } from 'vitest';

describe('angleDiff', () => {
	it('should return 0 for same angles', () => {
		expect(angleDiff(0, 0)).toBe(0);
		expect(angleDiff(Math.PI, Math.PI)).toBe(0);
		expect(angleDiff(Math.PI / 2, Math.PI / 2)).toBe(0);
	});

	it('should return positive for counter-clockwise rotation', () => {
		// 0 to π/2 (90°)
		expect(angleDiff(0, Math.PI / 2)).toBeCloseTo(Math.PI / 2);
		// 0 to π (180°)
		expect(angleDiff(0, Math.PI)).toBeCloseTo(Math.PI);
	});

	it('should return negative for clockwise rotation', () => {
		// π/2 to 0 (-90°)
		expect(angleDiff(Math.PI / 2, 0)).toBeCloseTo(-Math.PI / 2);
		// π to 0: exactly 180°, either direction is equally valid
		const diff = angleDiff(Math.PI, 0);
		expect(Math.abs(diff)).toBeCloseTo(Math.PI);
	});

	it('should take shortest path around the circle', () => {
		// From 0 to 3π/2: shortest is -π/2 (clockwise) not 3π/2 (counter-clockwise)
		expect(angleDiff(0, 3 * Math.PI / 2)).toBeCloseTo(-Math.PI / 2);

		// From 3π/2 to 0: shortest is π/2 (counter-clockwise)
		expect(angleDiff(3 * Math.PI / 2, 0)).toBeCloseTo(Math.PI / 2);

		// From π/4 to 7π/4: shortest is -π/2 (clockwise) not 3π/2 (counter-clockwise)
		expect(angleDiff(Math.PI / 4, 7 * Math.PI / 4)).toBeCloseTo(-Math.PI / 2);

		// From 7π/4 to π/4: shortest is π/2 (counter-clockwise)
		expect(angleDiff(7 * Math.PI / 4, Math.PI / 4)).toBeCloseTo(Math.PI / 2);
	});

	it('should handle unnormalized angles', () => {
		// 2π is the same as 0
		expect(angleDiff(0, ANGLE_MAX)).toBeCloseTo(0);
		expect(angleDiff(ANGLE_MAX, 0)).toBeCloseTo(0);

		// 3π is the same as π
		const diff1 = angleDiff(0, 3 * Math.PI);
		expect(Math.abs(diff1)).toBeCloseTo(Math.PI);

		// Negative angles should be normalized: -π/2 to π/2 is exactly 180°
		const diff2 = angleDiff(-Math.PI / 2, Math.PI / 2);
		expect(Math.abs(diff2)).toBeCloseTo(Math.PI);
	});

	it('should handle very small differences', () => {
		const epsilon = 0.001;
		expect(angleDiff(0, epsilon)).toBeCloseTo(epsilon);
		expect(angleDiff(epsilon, 0)).toBeCloseTo(-epsilon);
	});

	it('should handle wraparound near boundaries', () => {
		// Just before 2π to just after 0
		const almostMax = ANGLE_MAX - 0.1;
		const justAfterMin = 0.1;
		// Shortest path is 0.2, going counter-clockwise
		expect(angleDiff(almostMax, justAfterMin)).toBeCloseTo(0.2);
		// Going the other way should be negative
		expect(angleDiff(justAfterMin, almostMax)).toBeCloseTo(-0.2);
	});

	it('should be commutative with sign flip', () => {
		const angle1 = Math.PI / 3;
		const angle2 = 5 * Math.PI / 4;
		expect(angleDiff(angle1, angle2)).toBeCloseTo(-angleDiff(angle2, angle1));
	});

	it('should stay within [-π, π] range', () => {
		// Test many random angle pairs
		for (let i = 0; i < 100; i++) {
			const a1 = Math.random() * ANGLE_MAX;
			const a2 = Math.random() * ANGLE_MAX;
			const diff = angleDiff(a1, a2);
			expect(diff).toBeGreaterThanOrEqual(-Math.PI);
			expect(diff).toBeLessThanOrEqual(Math.PI);
		}
	});
});

describe('normalizeAngle', () => {
	it('should keep angles in range', () => {
		expect(normalizeAngle(0)).toBe(0);
		expect(normalizeAngle(Math.PI)).toBeCloseTo(Math.PI);
		expect(normalizeAngle(ANGLE_MAX - 0.1)).toBeCloseTo(ANGLE_MAX - 0.1);
	});

	it('should wrap angles above 2π', () => {
		expect(normalizeAngle(ANGLE_MAX)).toBeCloseTo(0);
		expect(normalizeAngle(ANGLE_MAX + Math.PI)).toBeCloseTo(Math.PI);
		expect(normalizeAngle(3 * Math.PI)).toBeCloseTo(Math.PI);
	});

	it('should wrap negative angles', () => {
		expect(normalizeAngle(-Math.PI)).toBeCloseTo(Math.PI);
		expect(normalizeAngle(-Math.PI / 2)).toBeCloseTo(3 * Math.PI / 2);
	});
});
