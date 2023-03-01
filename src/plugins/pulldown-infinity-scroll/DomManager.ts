import { pListItem } from './DataManager';
import Tombstone from './Tombstone';
import { style, cssVendor } from '@better-scroll/shared-utils';
const ANIMATION_DURATION_MS = 200;

export default class DomManager {
	private unusedDom: HTMLElement[] = [];
	private timers: Array<number> = [];

	constructor(
		private content: HTMLElement,
		private renderFn: (data: any, div?: HTMLElement, index?: number) => HTMLElement,
		private destroyFn: (id: string) => void,
		private tombstone: Tombstone,
		private wrapperHeight: number
	) {
		this.setContent(content);
	}

	update(
		list: Array<pListItem>,
		start: number,
		end: number
	): {
		start: number;
		end: number;
		startPos: number;
		startDelta: number;
		endPos: number;
	} {
		if (start >= list.length) {
			start = list.length - 1;
		}
		start = Math.max(0, start);
		if (end > list.length) {
			end = list.length;
		}

		this.collectUnusedDom(list, start, end);
		this.createDom(list, start, end);
		this.cacheHeight(list, start, end);
		const { startPos, startDelta, endPos } = this.positionDom(list, start, end);

		return {
			start,
			startPos,
			startDelta,
			end,
			endPos,
		};
	}

	private collectUnusedDom(list: Array<pListItem>, start: number, end: number): Array<any> {
		// TODO optimise
		for (let i = 0; i < list.length; i++) {
			if (i === start) {
				i = end - 1;
				continue;
			}

			if (list[i].dom) {
				const dom = list[i].dom as HTMLElement;
				if (Tombstone.isTombstone(dom)) {
					this.tombstone.recycleOne(dom);
					dom.style.display = 'none';
				} else {
					this.unusedDom.push(dom);
				}
				list[i].dom = null;
			}
		}

		return list;
	}

	private createDom(list: Array<pListItem>, start: number, end: number): void {
		for (let i = start; i < end; i++) {
			let dom = list[i].dom;
			const data = list[i].data;

			if (dom) {
				if (Tombstone.isTombstone(dom) && data) {
					// tombstone 有值即隐藏
					list[i].tombstone = dom;
					list[i].dom = null;
				} else {
					continue;
				}
			}
			// console.log(this.unusedDom.map(item => item.dataset.index));
			// console.log(`current: ${i}; start: ${start}; end: ${end}`);
			// const element = data
			//   ? this.renderFn(data, this.unusedDom.pop())
			//   : this.tombstone.getOne()

			const cacheDomIndex = this.unusedDom.findIndex((item) => data && item.dataset.id === data.id + '');
			// 优先使用自己的缓存
			if (cacheDomIndex > -1) {
				dom = this.unusedDom[cacheDomIndex];
				this.unusedDom.splice(cacheDomIndex, 1);
			} else {
				if (data) {
					const destroyDom = this.unusedDom.pop();
					if (destroyDom) {
						const destroyId = destroyDom.dataset.id;
						if (destroyId) {
							this.destroyFn(destroyId);
						}
					}

					dom = this.renderFn(data, destroyDom, i);
				} else {
					dom = this.tombstone.getOne();
				}
			}

			dom.style.position = 'absolute';
			data && (dom.dataset.id = data.id + '');
			list[i].dom = dom;
			list[i].pos = null;
			this.content.append(dom);
			// if(element instanceof HTMLElement) {
			//   element.style.position = 'absolute'
			//   list[i].dom = element
			//   list[i].pos = -1
			//   this.content.insertBefore(element, this.content.firstChild);
			// } else if(element._isVue){
			//   if(dom instanceof HTMLElement) {
			//     this.content.removeChild(dom)
			//   }
			//   list[i].component = element;
			//   const inner = document.createElement('div');
			//   const wrapdom = document.createElement('div');
			//   wrapdom.append(inner);
			//   wrapdom.style.position = 'absolute'
			//   list[i].dom = wrapdom
			//   list[i].pos = -1
			//   this.content.insertBefore(wrapdom, this.content.firstChild);
			//   element.$mount(inner);
			// }
		}
	}

	private cacheHeight(list: Array<pListItem>, start: number, end: number): void {
		for (let i = start; i < end; i++) {
			if (list[i].data && !list[i].height) {
				list[i].height = list[i].dom!.offsetHeight;
			}
		}
	}

	private positionDom(
		list: Array<pListItem>,
		start: number,
		end: number
	): { startPos: number; startDelta: number; endPos: number } {
		const tombstoneEles: Array<HTMLElement> = [];
		const { start: startPos, delta: startDelta } = this.getStartPos(list, start, end);
		let pos = startPos;
		for (let i = start; i < end; i++) {
			// if(i>20) {
			//   debugger;
			// }
			pos -= list[i].height || this.tombstone.height;
			const tombstone = list[i].tombstone;
			if (tombstone) {
				const tombstoneStyle = tombstone.style as any;
				tombstoneStyle[
					style.transition
				] = `${cssVendor}transform ${ANIMATION_DURATION_MS}ms, opacity ${ANIMATION_DURATION_MS}ms`;
				tombstoneStyle[style.transform] = `translateY(${pos}px)`;
				tombstoneStyle.opacity = '0';
				list[i].tombstone = null;
				tombstoneEles.push(tombstone);
			}

			if (list[i].dom && list[i].pos !== pos) {
				list[i].dom!.style[style.transform as any] = `translateY(${pos}px)`;
				list[i].pos = pos;
			}
		}

		const timerId = window.setTimeout(() => {
			this.tombstone.recycle(tombstoneEles);
		}, ANIMATION_DURATION_MS);
		this.timers.push(timerId);

		return {
			startPos,
			startDelta,
			endPos: pos,
		};
	}

	private getStartPos(list: Array<any>, start: number, end: number): { start: number; delta: number } {
		let pos = 0;

		if (start === 0) {
			let height = 0;
			let i = 0;
			while (height < this.wrapperHeight) {
				if (!list[i] || !list[i].height) {
					break;
				}
				height += list[i].height;
				i++;
			}

			//  pos为初始渲染底部位置的值，第一页最大在底部
			pos = Math.min(this.wrapperHeight, height);
			return {
				start: pos,
				delta: 0,
			};
		}

		if (list[start] && list[start].pos !== null) {
			return {
				start: list[start].pos + list[start].height,
				delta: 0,
			};
		}

		for (let i = 0; i < start; i++) {
			pos -= list[i].height || this.tombstone.height;
		}

		const originPos = pos;

		// 找到start - end之间最近有定位信息的pos,在此基础上计算start位置，从前后两个方向计算确认
		let i;
		for (i = start; i < end; i++) {
			if (!Tombstone.isTombstone(list[i].dom) && list[i].pos !== null) {
				pos = list[i].pos;
				break;
			}
		}
		let x = i;
		if (x < end) {
			while (x > start) {
				pos += list[x].height;
				x--;
			}
			pos += list[x].height;
		}
		const delta = originPos - pos;
		return {
			start: pos,
			delta: delta,
		};
	}

	removeTombstone(): void {
		const tombstones = this.content.querySelectorAll('.tombstone');
		for (let i = tombstones.length - 1; i >= 0; i--) {
			this.content.removeChild(tombstones[i]);
		}
	}

	setContent(content: HTMLElement) {
		if (content !== this.content) {
			this.content = content;
		}
	}

	destroy(): void {
		while (this.content.firstChild) {
			this.content.removeChild(this.content.firstChild);
		}
		// this.removeTombstone()

		this.timers.forEach((id) => {
			clearTimeout(id);
		});
	}
	resize(wrapperHeight?: number) {
		if (wrapperHeight) {
			this.wrapperHeight = wrapperHeight;
		}
	}
	resetState(wrapperHeight?: number) {
		this.resize(wrapperHeight);
		this.destroy();
		this.timers = [];
		this.unusedDom = [];
	}
}
