import { test } from './index';

describe('finite state machine to implement regex', () => {
	it('should find abc at string', () => {
		const res = test('12abc34');
		expect(res).toBe('Found abc at string: [2, 4]');
	});

	it('should not find abc at string', () => {
		const res = test('12ab34');
		expect(res).toBe('Not found \'abc\' at string: \'12ab34\'');
	});

	it('should correct return index [1]', () => {
		const res = test('a12abc34');
		expect(res).toBe('Found abc at string: [3, 5]');
	})

	it('should correct return index [2]', () => {
		const res = test('ab12abc34');
		expect(res).toBe('Found abc at string: [4, 6]');
	})

	it.skip('should correct return index [3]', () => {
		// TODO: fix this test
		const res = test('abc12abc34');
		expect(res).toBe('Found abc at string: [[0, 2], [5, 7]]');
	})
});
