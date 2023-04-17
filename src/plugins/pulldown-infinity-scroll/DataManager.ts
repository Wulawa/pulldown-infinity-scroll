class ListItem {
	data: any | null;
	dom: HTMLElement | null;
	component: any | null;
	tombstone: HTMLElement | null;
	width: number;
	height: number;
	pos: number | null;
	constructor(data?: any | null) {
		this.data = data || null;
		this.dom = null;
		this.component = null;
		this.tombstone = null;
		this.width = 0;
		this.height = 0;
		this.pos = null;
	}
}

export type pListItem = Partial<ListItem>;

export default class DataManager {
	public loadedNum = 0;
	private fetching = false;
	private hasMore = true;
	private list: Array<pListItem>;
	private updateList: Array<pListItem>;
	constructor(
		list: Array<pListItem>,
		private fetchFn: (len: number, loadedNum: number) => Promise<Array<any> | boolean>,
		private onFetchFinish: (list: Array<pListItem>, hasMore: boolean) => number
	) {
		this.list = list || [];
		this.updateList = [];
	}

	async update(end: number): Promise<void> {
		if (!this.hasMore) {
			end = Math.min(end, this.list.length);
		}

		// add data placeholder
		if (end > this.list.length) {
			const len = end - this.list.length;
			this.addEmptyData(len);
		}

		// tslint:disable-next-line: no-floating-promises
		return this.checkToFetch(end);
	}
	unshift(data: Object): void {
		this.updateList.unshift(new ListItem(data));

		// for (let i = data.length - 1; i >= 0; i--) {
		//   // this.loadedNum++
		// }
		// 从前面插入初始元素更新，所有位置都需重置
		// TODO optimise 最小范围重置
		// for(let i = 0; i < this.list.length; i++) {
		//   this.list[i].pos = null;
		// }
		// return this.list
	}
	updateToList(): void {
		for (let i = this.updateList.length - 1; i >= 0; i--) {
			this.list.unshift(this.updateList.splice(i, 1)[0]);
			this.loadedNum++;
		}
	}
	add(data: Array<any>): Array<pListItem> {
		for (let i = 0; i < data.length; i++) {
			if (!this.list[this.loadedNum]) {
				this.list[this.loadedNum] = { data: data[i] };
			} else {
				this.list[this.loadedNum] = {
					...this.list[this.loadedNum],
					...{ data: data[i] },
				};
			}
			this.loadedNum++;
		}
		return this.list;
	}

	addEmptyData(len: number): Array<pListItem> {
		for (let i = 0; i < len; i++) {
			this.list.push(new ListItem());
		}
		return this.list;
	}

	async fetch(len: number): Promise<Array<any> | boolean> {
		if (this.fetching) {
			return [];
		}
		this.fetching = true;
		const data = await this.fetchFn(len, this.loadedNum);
		this.fetching = false;
		return data;
	}

	async checkToFetch(end: number): Promise<void> {
		if (!this.hasMore) {
			return;
		}

		if (end <= this.loadedNum) {
			return;
		}

		const min = end - this.loadedNum;
		const newData = await this.fetch(min);
		if (newData instanceof Array && newData.length) {
			this.add(newData);

			const currentEnd = this.onFetchFinish(this.list, true);

			return this.checkToFetch(currentEnd);
		} else if (typeof newData === 'boolean' && newData === false) {
			this.hasMore = false;
			this.list.splice(this.loadedNum);

			this.onFetchFinish(this.list, false);
		}
	}
	remove(id: number | string): pListItem | undefined {
		const index = this.list.findIndex((item) => item.data.id === id);
		if (index > -1) {
			// for (let i = index; i < this.list.length; i++) {
			// 	this.list[i].pos = null;
			// }
			this.loadedNum -= 1;
			return this.list.splice(index, 1)[0];
		} else {
			console.warn(`remove error: not find data with id:${id}`);
		}
	}
	replace(data: any, index?: number): pListItem | null | undefined {
		const i = typeof index === 'number' ? index : this.list.findIndex((item) => item.data.id === data.id);
		if (i > -1) {
			return this.list.splice(i, 1, new ListItem(data))[0];;
		} else {
			console.warn(`remove error: not find data with id:${data.id}`);
		}
	}
	getList(): Array<pListItem> {
		return this.list;
	}
	resetState() {
		this.loadedNum = 0;
		this.fetching = false;
		this.hasMore = true;
		this.list = [];
	}
}
