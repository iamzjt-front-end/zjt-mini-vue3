// zjt-mini-vue 出口
export * from '@zjt-mini-vue3/runtime-dom';
import { baseCompile } from '@zjt-mini-vue3/compiler-core';
import * as runtimeDom from '@zjt-mini-vue3/runtime-dom';
import { registerRuntimeCompiler } from '@zjt-mini-vue3/runtime-dom';

function compilerToFunction(template) {
	const { code } = baseCompile(template);

	const render = new Function('Vue', code)(runtimeDom);
	return render;
}

registerRuntimeCompiler(compilerToFunction);
