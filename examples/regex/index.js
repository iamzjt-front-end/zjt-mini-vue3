// /abc/.test();

export function test(string) {
	let i;
	let startIndex;
	let endIndex;
	let result = [];

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
			result.push([startIndex, endIndex]);
			currentState = waitForA;
		}

		if (i === string.length - 1 && result.length) {
			return `Found abc at string: ${ JSON.stringify(result.length === 1 ? result[0] : result) }`;
		}
	}

	return `Not found 'abc' at string: '${ string }'`;
}
