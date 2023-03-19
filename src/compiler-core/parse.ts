import { NodeTypes } from './ast';

const enum TagType {
	start,
	end
}

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

	let node;
	const s = context.source;
	if (s.startsWith('{{')) {
		node = parseInterpolation(context);
	} else if (s[0] === '<') {
		if (/[a-z]/i.test(s[1])) {
			node = parseElement(context);
		}
	}

	nodes.push(node);
	return nodes;
}

function parseElement(context) {
	const element = parseTag(context, TagType.start);
	parseTag(context, TagType.end);

	return element;
}

function parseTag(context, type: TagType) {
	// 1. 解析tag
	const match: any = /^<\/?([a-z]*)/i.exec(context.source);
	const tag = match[1];
	// 2. 删除处理完成的代码
	advanceBy(context, match[0].length);
	advanceBy(context, 1);

	if (type === TagType.end) return;

	return {
		type: NodeTypes.ELEMENT,
		tag
	};
}

function parseInterpolation(context) {
	// * {{message}}
	const openDelimiter = '{{';
	const closeDelimiter = '}}';

	const closeIndex = context.source.indexOf(
		closeDelimiter,
		openDelimiter.length
	);

	advanceBy(context, openDelimiter.length);

	const rawContentLength = closeIndex - openDelimiter.length;

	const rawContent = context.source.slice(0, rawContentLength);
	const content = rawContent.trim();

	advanceBy(context, rawContentLength + closeDelimiter.length);

	return {
		type: NodeTypes.INTERPOLATION,
		content: {
			type: NodeTypes.SIMPLE_EXPRESSION,
			content
		}
	};
}

// 推进
function advanceBy(context: any, length: number) {
	context.source = context.source.slice(length);
}

function createParseContext(content: string) {
	return {
		source: content
	};
}
