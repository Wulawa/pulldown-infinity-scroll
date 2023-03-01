import BScroll, { Boundary } from '@better-scroll/core';
import { warn } from '@better-scroll/shared-utils';
import IndexCalculator from './IndexCalculator';
import DataManager from './DataManager';
import DomManager from './DomManager';
import Tombstone from './Tombstone';

export interface InfinityOptions<T extends {id: any}> {
	fetch: (count: number, loadednum: number) => Promise<Array<T> | false>;
	render: (item: T, div?: HTMLElement, index?: number) => HTMLElement;
	onUpdate?: (loadednum: number) => void;
	destroy: (id: string) => void;
	createTombstone: () => HTMLElement;
}

declare module '@better-scroll/core' {
	interface CustomOptions {
		'pulldown-infinity'?: InfinityOptions<any>;
	}
}

const EXTRA_SCROLL_Y = -2000;

export default class InfinityScroll<T extends {id: any}> {
	static pluginName = 'pulldown-infinity';
	start: number = 0;
	end: number = 0;
	options: InfinityOptions<T> | undefined;
	private tombstone: Tombstone;
	private domManager: DomManager;
	private dataManager: DataManager;
	private indexCalculator: IndexCalculator;

	constructor(public scroll: BScroll) {
		this.handleOptions();

		const {
			fetch: fetchFn,
			render: renderFn,
			destroy: destroyFn,
			createTombstone: createTombstoneFn,
		} = <InfinityOptions<T>>this.options;

		this.scroll.eventTypes = {
			...this.scroll.eventTypes,
			unshift: 'unshift',
			resize: 'resize',
			remove: 'remove',
			reset: 'reset',
			replace: 'replace',
		};

		this.tombstone = new Tombstone(createTombstoneFn);
		this.indexCalculator = new IndexCalculator(
			this.scroll.scroller.scrollBehaviorY.wrapperSize,
			this.tombstone.height
		);
		this.domManager = new DomManager(
			this.scroll.scroller.content,
			renderFn,
			destroyFn,
			this.tombstone,
			this.scroll.scroller.scrollBehaviorY.wrapperSize
		);
		this.dataManager = new DataManager([], fetchFn, this.onFetchFinish.bind(this));

		this.scroll.on(this.scroll.eventTypes.destroy, this.destroy, this);
		this.scroll.on(this.scroll.eventTypes.scroll, this.update, this);

		this.scroll.on(this.scroll.eventTypes.contentChanged, (content: HTMLElement) => {
			this.domManager.setContent(content);
			this.refresh();
		});

		this.scroll.on(this.scroll.eventTypes.reset, this.refresh, this);
		this.scroll.on(this.scroll.eventTypes.unshift, this.unshift, this);
		this.scroll.on(this.scroll.eventTypes.resize, this.resize, this);
		this.scroll.on(this.scroll.eventTypes.remove, this.remove, this);
		this.scroll.on(this.scroll.eventTypes.replace, this.replace, this);

		const { scrollBehaviorY } = this.scroll.scroller;
		scrollBehaviorY.hooks.on(scrollBehaviorY.hooks.eventTypes.computeBoundary, this.modifyBoundary, this);

		this.update({ y: 0 });
	}
	init() {}
	private remove(id: number | string) {
		const data = this.dataManager.remove(id);
		if (data && data.dom) {
			this.scroll.scroller.content.removeChild(data.dom);
			this.update({ y: this.indexCalculator.lastPos });
		}
	}
	private refresh() {
		this.indexCalculator.resetState(this.scroll.scroller.scrollBehaviorY.wrapperSize);
		this.domManager.resetState(this.scroll.scroller.scrollBehaviorY.wrapperSize);
		this.dataManager.resetState();
		this.update({ y: 0 });
	}
	private async replace(data: any) {
		const status = await this.dataManager.resetState(data);
		if (status) {
			(<InfinityOptions<T>>this.options).destroy(data.id);
			this.resize();
		}
	}
	private resize() {
		this.scroll.scroller.scrollBehaviorY.refresh(this.scroll.scroller.content);
		this.indexCalculator.resize(this.scroll.scroller.scrollBehaviorY.wrapperSize);
		this.domManager.resize(this.scroll.scroller.scrollBehaviorY.wrapperSize);
		this.update({ y: this.indexCalculator.lastPos });
	}
	private modifyBoundary(boundary: Boundary) {
		// this.indexCalculator.resetState(this.scroll.scroller.scrollBehaviorY.wrapperSize)
		// this.domManager.resetState(this.scroll.scroller.scrollBehaviorY.wrapperSize)
		// this.dataManager.resetState()
		// this.update({ y: 0 })
		// manually set position to allow scroll
		boundary.maxScrollPos = EXTRA_SCROLL_Y;
	}

	private handleOptions() {
		// narrow down type to an object
		const infinityOptions = this.scroll.options['pulldown-infinity'];
		if (infinityOptions) {
			if (typeof infinityOptions.fetch !== 'function') {
				warn('Infinity plugin need fetch Function to new data.');
			}
			if (typeof infinityOptions.render !== 'function') {
				warn('Infinity plugin need render Function to render each item.');
			}
			if (typeof infinityOptions.render !== 'function') {
				warn('Infinity plugin need createTombstone Function to create tombstone.');
			}
			this.options = infinityOptions;
		}

		this.scroll.options.probeType = 3;
	}
	unshift(data: any) {
		// const data = {
		//   avatar: 3,
		//   id: Math.random(),
		//   image: "",
		//   message: "That should",
		//   self: false,
		//   time: new Date()
		// }
		this.dataManager.unshift(data);
		if (this.scroll.y === 0) {
			this.dataManager.updateToList();
			this.updateDom(this.dataManager.getList());
		}
	}
	update(pos: { y: number }): void {
		const position = Math.round(pos.y);
		// important! calculate start/end index to render
		const { start, end } = this.indexCalculator.calculate(position, this.dataManager.getList());
		this.start = start;
		this.end = end;
		// console.log(pos);
		if (pos.y <= 0) {
			this.dataManager.updateToList();
		}
		// tslint:disable-next-line: no-floating-promises
		this.dataManager.update(end);
		this.updateDom(this.dataManager.getList());
	}

	private onFetchFinish(list: Array<any>, hasMore: boolean) {
		const { end } = this.updateDom(list);
		if (!hasMore) {
			this.domManager.removeTombstone();
			// this.scroll.scroller.animater.stop()
			// this.scroll.resetPosition()
		}
		// tslint:disable-next-line: no-floating-promises
		return end;
	}

	private updateDom(list: Array<any>): { end: number; startPos: number; endPos: number } {
		const { end, startPos, endPos, startDelta } = this.domManager.update(list, this.start, this.end);

		// console.log(end, startPos, endPos, startDelta);
		this.scroll.maxScrollY = 0; //this.scroll.scroller.scrollBehaviorY.wrapperSize;
		// if (startDelta) {
		//   this.scroll.minScrollY = startDelta
		// }

		this.scroll.minScrollY = endPos < 0 ? -endPos : 0;
		if (this.options?.onUpdate) {
			this.options?.onUpdate(this.dataManager.loadedNum);
		}
		return {
			end,
			startPos,
			endPos,
		};
	}

	destroy() {
		const { scrollBehaviorY } = this.scroll.scroller;

		this.domManager.destroy();
		this.scroll.off('scroll', this.update);
		this.scroll.off('destroy', this.destroy);
		scrollBehaviorY.hooks.off(scrollBehaviorY.hooks.eventTypes.computeBoundary);
	}
}
