export function baseParse(content: string) {
	const context = createParseContext(content);

	return createRoot(parseChildren(context));
}

function createRoot(children) {
	return {
		children
	};
}

function parseChildren(context) {
	const nodes: any[] = [];
	const node = parseInterpolation(context);

	nodes.push(node);
	return nodes;
}

function parseInterpolation(context) {
	const closeIndex = context.source.indexOf('}}', 2);
	context.source = context.source.slice(2);
	const rawContentLength = closeIndex - 2;
	const content = context.source.slice(0, rawContentLength);
	return {
		type: 'interpolation',
		content: {
			type: 'simple_expression',
			content
		}
	};
}

function createParseContext(content: string) {
	return {
		source: content
	};
}
