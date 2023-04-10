<script setup lang="ts">
  import {onMounted, ref} from 'vue';
  import BScroll from '@better-scroll/core'
  import InfinityScroll, {InfinityOptions} from "@/plugins/pulldown-infinity-scroll"
  import message from '../data/message.json'

  BScroll.use(InfinityScroll)


  interface commentType {
    id: number,
    avatar: number,
    self: boolean,
    image: number | HTMLImageElement,
    time: Date,
    message: string
  }

  const NUM_AVATARS = 4
  const NUM_IMAGES = 77
  const INIT_TIME = new Date().getTime()

  function getItem(id: any) {
    function pickRandom(a: Array<string>) {
      return a[Math.floor(Math.random() * a.length)]
    }

    return new Promise<commentType>(function (resolve) {
      let item: commentType = {
        id: id,
        avatar: Math.floor(Math.random() * NUM_AVATARS),
        self: Math.random() < 0.1,
        image: Math.random() < 1.0 / 20 ? Math.floor(Math.random() * NUM_IMAGES) : 0,
        time: new Date(Math.floor(INIT_TIME + id * 20 * 1000 + Math.random() * 20 * 1000)),
        message: pickRandom(message)
      }
      if (item.image === 0) {
        resolve(item)
      } else {
        let image = new Image()
        image.src = new URL(`../image/image${item.image}.jpg`, import.meta.url).href
        image.addEventListener('load', function () {
          item.image = image
          resolve(item)
        })
        image.addEventListener('error', function () {
          item.image = 0
          resolve(item)
        })
      }
    })
  }
  
let nextItem = 0;
let pageNum = 0;

let bs: BScroll;

const chat = ref<HTMLDivElement>()


const messageDom = ref<HTMLDivElement>()
const tombstone =ref<HTMLDivElement>()
   function createInfinityScroll() {
    bs = new BScroll(chat.value as HTMLDivElement, {
      'pulldown-infinity': {
        render: (item, div) => {
            console.log(item)
            div = (messageDom.value as HTMLDivElement).cloneNode(true) as HTMLElement;
            div.dataset.id = item.id+'';
            (div.querySelector('.infinity-avatar') as HTMLImageElement).src = new URL(`../image/avatar${item.avatar}.jpg`, import.meta.url).href;
            (div.querySelector('.infinity-bubble p') as HTMLDivElement).textContent = item.id + '  ' + item.message;
            (div.querySelector('.infinity-bubble .infinity-posted-date') as HTMLDivElement).textContent = item.time.toString();

            let img = (div.querySelector('.infinity-bubble img') as HTMLImageElement);
            if (item.image instanceof HTMLImageElement) {
                img.style.display = ''
                img.src = item.image.src
                img.width = item.image.width
                img.height = item.image.height
            } else {
                img.src = ''
                img.style.display = 'none'
            }

            if (item.self) {
                div.classList.add('infinity-from-me')
            } else {
                div.classList.remove('infinity-from-me')
            }
            return div;
        },
        createTombstone: () => {
            return tombstone.value
                ? (tombstone.value.cloneNode(true) as HTMLElement)
                : document.createElement('div');
        },
        fetch: (count, loadednum) => {
          // Fetch at least 30 or count more objects for display.
          count = Math.max(30, count)
          return new Promise((resolve, reject) => {
            // Assume 50 ms per item.
            setTimeout(() => {
              if (++pageNum > 20) {
                resolve(false)
              } else {
                console.log('pageNum', pageNum)
                let items = []
                for (let i = 0; i < Math.abs(count); i++) {
                  items[i] = getItem(nextItem++)
                }
                resolve(Promise.all(items))
              }
            }, 500)
          })
        },
        destroy() {

        }
      } as InfinityOptions<commentType>
    })
  }
  onMounted(() => {
     createInfinityScroll()
  })

  function remove(){
    getItem(2).then((res) => {
      bs.trigger('replace', res)
    })
  }
</script>




<template>
  <div class="infinity">
    <div class="template">
      <li ref="messageDom" class="infinity-item">
        <img class="infinity-avatar" width="48" height="48">
        <div class="infinity-bubble">
          <p></p>
          <img width="300" height="300">
          <div class="infinity-meta">
            <time class="infinity-posted-date"></time>
          </div>
        </div>
      </li>
      <li ref="tombstone" class="infinity-item tombstone">
        <img class="infinity-avatar" width="48" height="48" src="../image/unknown.jpg">
        <div class="infinity-bubble">
          <p></p>
          <p></p>
          <p></p>
          <div class="infinity-meta">
            <time class="infinity-posted-date"></time>
          </div>
        </div>
      </li>
    </div>
    <div ref="chat" class="infinity-timeline">
      <ul>
      </ul>
    </div>
  </div>
</template>

<style lang="stylus" scoped>
  .infinity
    height: 100vh
    width: 100vw
    .template
      display: none

  .infinity-timeline
    position: relative
    height: 100%
    padding: 0 10px
    border: 1px solid #ccc
    overflow: hidden
    will-change: transform
    background-color: #efeff5

  .infinity-timeline > ul
    position: relative
    -webkit-backface-visibility: hidden
    -webkit-transform-style: flat

  .infinity-item
    display: flex
    left: 0
    padding: 10px 0
    width: 100%
    contain: layout
    will-change: transform
    list-style: none
  
  .infinity-avatar
    border-radius: 500px
    margin-left: 20px
    margin-right: 6px
    min-width: 48px

  .infinity-item
    p
      margin: 0
      word-wrap: break-word
      font-size: 13px

  .infinity-item.tombstone
    p
      width: 100%
      height: 0.5em
      background-color: #ccc
      margin: 0.5em 0

  .infinity-bubble img 
    max-width: 100%
    height: auto

  .infinity-bubble 
    padding: 7px 10px
    color: #333
    background: #fff
    /*box-shadow: 0 3px 2px rgba(0, 0, 0, 0.1)*/
    position: relative
    max-width: 420px
    min-width: 80px
    margin: 0 5px

  .infinity-bubble::before 
    content: ''
    border-style: solid
    border-width: 0 10px 10px 0
    border-color: transparent #fff transparent transparent
    position: absolute
    top: 0
    left: -10px

  .infinity-meta 
    font-size: 0.8rem
    color: #999
    margin-top: 3px

  .infinity-from-me 
    justify-content: flex-end

  .infinity-from-me .infinity-avatar 
    order: 1
    margin-left: 6px
    margin-right: 20px

  .infinity-from-me .infinity-bubble 
    background: #F9D7FF

  .infinity-from-me .infinity-bubble::before 
    left: 100%
    border-width: 10px 10px 0 0
    /*border-color: #F9D7FF transparent transparent transparent*/

  .infinity-state 
    display: none

  .infinity-invisible 
    display: none
  
</style>
