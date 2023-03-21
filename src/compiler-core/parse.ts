import { NodeTypes } from './ast';

const enum TagType {
	start,
	end
}

export function baseParse(content: string) {
	const context = createParseContext(content);

	return createRoot(parseChildren(context, ''));
}

function createParseContext(content: string) {
	return {
		source: content
	};
}

function createRoot(children) {
	return {
		children
	};
}

function parseChildren(context, parentTag) {
	const nodes: any[] = [];

	while (!isEnd(context, parentTag)) {
		let node;
		const s = context.source;
		if (s.startsWith('{{')) {
			node = parseInterpolation(context);
		} else if (s[0] === '<') {
			if (/[a-z]/i.test(s[1])) {
				node = parseElement(context);
			}
		}

		if (!node) {
			node = parseText(context);
		}

		nodes.push(node);
	}
	return nodes;
}

function isEnd(context, parentTag) {
	// 2. 当遇到结束标签的时候
	if (parentTag && context.source.startsWith(`</${ parentTag }>`)) {
		return true;
	}

	// 1. source有值的时候
	return !context.source;
}

// 插值
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

	const rawContent = parseTextData(context, rawContentLength);

	const content = rawContent.trim();

	advanceBy(context, closeDelimiter.length);

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

// element
function parseElement(context) {
	const element: any = parseTag(context, TagType.start);
	element.children = parseChildren(context, element.tag);

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

// 文本
function parseText(context) {
	let endIndex = context.source.length;
	let endToken = '{{';

	const index = context.source.indexOf(endToken);
	if (index !== -1) {
		endIndex = index;
	}

	const content = parseTextData(context, endIndex);

	return {
		type: NodeTypes.TEXT,
		content
	};
}

function parseTextData(context, length) {
	// 1. 获取当前的内容
	const content = context.source.slice(0, length);

	// 2. 推进
	advanceBy(context, length);
	return content;
}
