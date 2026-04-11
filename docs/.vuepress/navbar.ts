/**
 * @see https://theme-plume.vuejs.press/config/navigation/ 查看文档了解配置详情
 *
 * Navbar 配置文件，它在 `.vuepress/plume.config.ts` 中被导入。
 */

import { defineNavbarConfig } from 'vuepress-theme-plume'

export default defineNavbarConfig(
  [ 
    { text: 'YouYou博客', link: '/blog/', icon: 'material-symbols:home-rounded' },
    { text: '机场排名汇总', link: '/vpn-recommend/', icon: 'material-symbols:flight-takeoff' },
    { text: '机场跑路汇总', link: '/scamvpn/paolujichang/', icon: 'material-symbols:warning' },
    { 
      text: '梯子工具',
      icon: 'ic:baseline-construction',
      items: [
        { text: 'iOS手机', link: '/article/Shadowrocket/', icon: 'material-symbols:smartphone' },
        { text: 'Android手机', link: '/article/ClashforAndroid/', icon: 'material-symbols:smartphone' },
        { text: 'Windows/Linux/Mac', link: '/article/ClashVerge/', icon: 'material-symbols:computer' },
        { text: 'Apple ID', link: '/article/freeAppleID/', icon: 'material-symbols:account-circle' },
      ]
    },
    {
        text: "更多",
        icon: 'icon-park-outline:more-three',
        items: [
          { text: '归档', link: '/blog/archives/', icon: 'material-symbols:archive-rounded' },
          { text: '友链' , link: '/friends/', icon: 'material-symbols:footprint' },
          { text: '标签', link: '/blog/tags/', icon: 'material-symbols:sell' },
          { text: '分类', link: '/blog/categories/', icon: 'material-symbols:category' },
      ],
    },
  ]
)
