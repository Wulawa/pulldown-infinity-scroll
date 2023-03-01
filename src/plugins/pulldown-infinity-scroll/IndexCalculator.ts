export const PRE_NUM = 10;
export const POST_NUM = 30;

const enum DIRECTION {
	UP,
	DOWN,
}

export default class IndexCalculator {
	private lastDirection = DIRECTION.UP;
	lastPos = 0;

	constructor(public wrapperHeight: number, private tombstoneHeight: number) {}

	calculate(pos: number, list: Array<any>): { start: number; end: number } {
		let offset = pos - this.lastPos;
		this.lastPos = pos;

		const direction = this.getDirection(offset);

		// important! start index is much more important than end index.
		let start = this.calculateIndex(0, this.wrapperHeight - pos, list);

		let end = this.calculateIndex(start, -pos, list);

		if (direction === DIRECTION.UP) {
			start -= PRE_NUM;
			end += POST_NUM;
		} else {
			start -= POST_NUM;
			end += PRE_NUM;
		}

		if (start < 0) {
			start = 0;
		}

		return {
			start,
			end,
		};
	}

	private getDirection(offset: number): DIRECTION {
		let direction;
		if (offset < 0) {
			direction = DIRECTION.DOWN;
		} else if (offset > 0) {
			direction = DIRECTION.UP;
		} else {
			return this.lastDirection;
		}
		this.lastDirection = direction;
		return direction;
	}

	private calculateIndex(
		start: number,
		boundary: number, // 显示区域的顶部边界（end时）或底部边界（start时），
		list: Array<any>
	): number {
		if (boundary >= this.wrapperHeight || !list.length) {
			return 0;
		}
		let i = start;
		// 起始dom底部位置
		// let startPos = list[i] && list[i].pos !== null ? list[i].pos + list[i].height : this.wrapperHeight
		// let lastPos = startPos
		let tombstone = 0;
		// 真实数据 & 在显示区间内
		while (i < list.length - 1 && list[i].pos > boundary) {
			if (list[i].pos !== null || i === 0) {
				i++;
			}
		}
		// // 初识定位更新后
		// if(i === 0) {
		//   while (i < list.length && list[i].pos === null && lastPos > boundary) {
		//     lastPos -= list[i].height || 0
		//     i++
		//   }
		// }
		// 如果有填充dom, 计算下拉后的填充物数量
		if (start !== 0 && i === list.length - 1 && this.tombstoneHeight) {
			const lasttopPos = list[i].pos; // 最后元素位置
			const topOffset =boundary - lasttopPos;
			tombstone = Math.floor(topOffset / this.tombstoneHeight);
			i += tombstone;
		}

		return i;
	}
	resize(wrapperHeight?: number) {
		if (wrapperHeight) {
			this.wrapperHeight = wrapperHeight;
		}
	}
	resetState(wrapperHeight?: number) {
		this.resize(wrapperHeight);
		this.lastDirection = DIRECTION.DOWN;
		this.lastPos = 0;
	}
}
