import { NodeTypes } from './ast';

const enum TagType {
	start,
	end
}

export function baseParse(content: string) {
	const context = createParseContext(content);

	return createRoot(parseChildren(context, []));
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

function parseChildren(context, ancestors: string[]) {
	const nodes: any[] = [];

	while (!isEnd(context, ancestors)) {
		let node;
		const s = context.source;
		if (s.startsWith('{{')) {
			node = parseInterpolation(context);
		} else if (s[0] === '<') {
			if (/[a-z]/i.test(s[1])) {
				node = parseElement(context, ancestors);
			}
		}

		if (!node) {
			node = parseText(context);
		}

		nodes.push(node);
	}
	return nodes;
}

function isEnd(context, ancestors) {
	// 2. 当遇到结束标签的时候
	const s = context.source;

	if (s.startsWith('</')) {
		for (let i = 0; i < ancestors.length; i++) {
			const tag = ancestors[i].tag;
			if (startsWidthEndTagOpen(s, tag)) {
				return true;
			}
		}
	}

	// 1. source有值的时候
	return !s;
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
function parseElement(context, ancestors) {
	const element: any = parseTag(context, TagType.start);
	ancestors.push(element);
	element.children = parseChildren(context, ancestors);
	ancestors.pop();

	// console.log('--------', element.tag, context.source);
	if (startsWidthEndTagOpen(context.source, element.tag)) {
		throw new Error(`Element is missing end tag: ${ element.tag } }`);
	} else {
		parseTag(context, TagType.end);
	}

	return element;
}

// 判断是否是结束标签
function startsWidthEndTagOpen(source, tag) {
  return source.slice(2, tag.length + 2).toLowerCase() === tag.toLowerCase();
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
	const endTokens = ['{{', '<'];
	let endIndex = context.source.length;

	for (let i = 0; i < endTokens.length; i++) {
		const index = context.source.indexOf(endTokens[i], 1);
		if (index !== -1 && endIndex > index) {
			endIndex = index;
		}
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
