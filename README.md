## 使用

### 安装

```bash
// with npm
npm install pulldown-infinity-scroll

// with yarn
yarn add pulldown-infinity-scroll
```
### 示例
```js
import BScroll from '@better-scroll/core'
import InfinityScroll from 'pulldown-infinity-scroll'
BScroll.use(InfinityScroll)

export interface InfinityOptions<T> {
	fetch: (count: number, loadednum: number) => Promise<Array<T> | false>;
	render: (item: T, div?: HTMLElement, index?: number) => HTMLElement;
	onUpdate?: (loadednum: number) => void;
	destroy: (id: string) => void;
	createTombstone: () => HTMLElement;
}
const bs = new BScroll('.wrapper', {
  'pulldown-infinity-scroll': {
    fetch(count, loadednum) {
      // 获取大于 count 数量的数据，该函数是异步的，它需要返回一个 Promise。
      // 成功获取数据后，你需要 resolve 数据数组（也可以 resolve 一个 Promise）（数据中必须包含id,计算、销毁等都需要id来确认）。
      // 数组的每一个元素是列表数据，在 render 方法执行的时候会传递这个数据渲染。
      // 如果没有数据的时候，你可以 resolve(false)，来告诉无限滚动列表已经没有更多数据了。
      // loadednum为已加载的数量
    }
    render(item, div, index) {
      // 渲染每一个元素节点，item 是数据，div 是包裹元素节点的容器, index为当前索引。
      // 该函数需要返回渲染后的 DOM 节点。
      // 在vue2中可以使用 Vue.extend来生成组件并获取组件的dom返回
      // 在vue3（当前最新为3.25）中可以使用 createApp来生成一个应用，然后挂载到指定dom中然后返回
    },
    createTombstone() {
      // 返回一个墓碑 DOM 节点。
    },
    destroy(id) {
      // 当未展示内容销毁时触发
    }
  } as InfinityOptions
})
```


| Event               | Description                                             | 参数                      |
| ------------------- | ------------------------------------------------------- | ------------------------ |
| reset               | 刷新scroll,并且重新请求数据 | 无 | 
| unshift             | 手动添加新的数据 | extends {id: string \| number} | 
| resize              | 保持滚动位置，重新计算，当列表dom尺寸改变时调用，以保证布局正确 | 无 ｜
| remove              | 删除指定数据 | id: string \| number |
| replace              | 替换指定数据 | extends {id: string \| number} |



#### 示例

```js
bs.trigger('reset');
bs.trigger('resize');
bs.trigger('unshift', chatData);
bs.trigger('replace', chatData);
bs.trigger('remove', id);
```