import Vue from 'vue'
import App from '@/App.vue'
import '@/assets/iconfont/ionicons.less'
import '@/styles/public.css'
import VueMarkdown from 'vue-markdown'
import { createRouter } from '@/router'
import { createStore } from '@/store'
import { sync } from 'vuex-router-sync'
import ViewUI from 'view-design'
import 'view-design/dist/styles/iview.css'

Vue.use(ViewUI)
Vue.component('VueMarkdown', VueMarkdown)

// 解决 [vue-router] failed to resolve async component default: referenceerror: window is not defined 问题
if (typeof window === 'undefined') {
    global.window = {}
}

export function createApp() {
    const router = createRouter()
    const store = createStore()

    // 将 router 挂载到 store 中，可以通过 store.state.route 访问
    sync(store, router)

    const app = new Vue({
        router,
        store,
        render: h => h(App)
    })

    return { app, router, store }
}
