import { getCurrentInstance } from './component';

export function provide(key, value) {
	// 存
	// 存在哪里 -> 当前组件实例对象
	const currentInstance: any = getCurrentInstance();

	if (currentInstance) {
		const { provides } = currentInstance;
		provides[key] = value;
	}
}

export function inject(key, defaultValue) {
	// 取
	const currentInstance: any = getCurrentInstance();

	if (currentInstance) {
		const parentProvides = currentInstance.parent.provides;

		return key in parentProvides ? parentProvides[key] : defaultValue;
	}
}
