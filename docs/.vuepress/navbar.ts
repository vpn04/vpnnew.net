/**
 * @see https://theme-plume.vuejs.press/config/navigation/ 查看文档了解配置详情
 *
 * Navbar 配置文件，它在 `.vuepress/plume.config.ts` 中被导入。
 */

import { defineNavbarConfig } from 'vuepress-theme-plume'

export default defineNavbarConfig(
  [ 
    { text: '🛩机场排名汇总', link: '/vpn-recommend/' },
    { text: '⚠️机场跑路汇总', link: '/scamvpn/paolujichang/' },
    { text: '📁YouYou博客', link: '/blog/' },
    { 
      text: '📂翻墙工具',
      items: [
        { text: 'iOS手机', link: '/article/Shadowrocket/' },
        { text: 'Android手机', link: '/article/ClashforAndroid/' },
        { text: 'Windows/Linux/Mac', link: '/article/ClashVerge/' },
        { text: 'Apple ID', link: '/article/freeAppleID/' },
        { text: '友链' , link: '/friends/'},
      ]
    }
  ]
)
