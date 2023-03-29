import { PublicInstanceHandlers } from './componentPublicInstance';
import { initProps } from './componentProps';
import { shallowReadonly } from '../reactivity/reactive';
import { emit } from './componentEmit';
import { initSlots } from './componentSlots';
import { isObject } from '../shared';
import { proxyRefs } from '../reactivity';

export function createComponentInstance(vnode, parent) {
	const component = {
		vnode,
		type: vnode.type,
		next: null,
		setupState: {},
		props: {},
		slots: {},
		provides: {},
		parent,
		isMounted: false,
		subTree: {},
		emit: () => {}
	};

	component.emit = emit.bind(null, component) as any;

	return component;
}

export function setupComponent(instance) {
	initProps(instance, instance.vnode.props);
	initSlots(instance, instance.vnode.children);

	setupStatefulComponent(instance);
}

function setupStatefulComponent(instance) {
	const Component = instance.type;

	instance.proxy = new Proxy({ _: instance }, PublicInstanceHandlers);

	const { setup } = Component;

	if (setup) {
		setCurrentInstance(instance);
		const setupResult = setup(
			shallowReadonly(instance.props),
			{ emit: instance.emit }
		);
		setCurrentInstance(null);

		handleSetupResult(instance, setupResult);
	}
}

function handleSetupResult(instance, setupResult) {
	// function object
	// todo function

	if (isObject(setupResult)) {
		instance.setupState = proxyRefs(setupResult);
	}

	finishComponentSetup(instance);
}

function finishComponentSetup(instance) {
	const Component = instance.type;

	if (compiler && !Component.render) {
		if (Component.template) {
			Component.render = compiler(Component.template);
		}
	}

	instance.render = Component.render;
}

let currentInstance = null;

export function getCurrentInstance() {
	return currentInstance;
}

export function setCurrentInstance(instance) {
	currentInstance = instance;
}

let compiler;

export function registerRuntimeCompiler(_compiler) {
	compiler = _compiler;
}
