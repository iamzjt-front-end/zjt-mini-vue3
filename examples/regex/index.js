// /abc/.test();

export function test(string) {
	let i;
	let startIndex;
	let endIndex;

	function waitForA(char) {
		if (char === 'a') {
			startIndex = i;
			return waitForB;
		}
		return waitForA;
	}

	function waitForB(char) {
		if (char === 'b') {
			return waitForC;
		}

		return waitForA;
	}

	function waitForC(char) {
		if (char === 'c') {
			endIndex = i;
			return end;
		}

		return waitForA;
	}

	function end() {
		return end;
	}

	let currentState = waitForA;

	for (i = 0; i < string.length; i++) {
		currentState = currentState(string[i]);

		if (currentState === end) {
			return `Found abc at string: [${ startIndex }, ${ endIndex }]`;
		}
	}

	return `Not found 'abc' at string: '${ string }'`;
}
