/**
 * @see https://theme-plume.vuejs.press/config/navigation/ 查看文档了解配置详情
 *
 * Navbar 配置文件，它在 `.vuepress/plume.config.ts` 中被导入。
 */

import { defineNavbarConfig } from 'vuepress-theme-plume'

export default defineNavbarConfig(
  [ 
    { text: '🛩机场排名汇总', link: '/vpn-recommend/' },
    { text: '💰机场免费试用汇总', link: '/article/mianfeijichang/' },
    { text: '💹机场优惠券汇总', link: '/article/youhuijuan/' },
    { text: '⚠️机场跑路汇总', link: '/scamvpn/paolujichang/' },
    { text: '📁YouYou博客', link: '/blog/' },
    { 
      text: '📂更多',
      items: [
        { text: '🏷️标签', link: '/blog/tags/' },
        { text: '🔗友链' , link: '/friends/'},
        { text: '💼归档', link: '/blog/archives/' },
      ]
    }
  ]
)
