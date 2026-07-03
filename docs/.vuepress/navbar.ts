/**
 * @see https://theme-plume.vuejs.press/config/navigation/ 查看文档了解配置详情
 *
 * Navbar 配置文件，它在 `.vuepress/plume.config.ts` 中被导入。
 */

import { defineNavbarConfig } from 'vuepress-theme-plume'

export default defineNavbarConfig(
  [ 
    { text: '首页', link: '/', icon: 'material-symbols:home-rounded' },
    { text: '博客', link: '/blog/', icon: 'material-symbols:article-rounded' },
    { text: '机场推荐', link: '/vpn-recommend/', icon: 'material-symbols:flight-takeoff' },
    { 
      text: '梯子工具',
      icon: 'ic:baseline-construction',
      items: [
        { text: 'iOS 小火箭', link: '/article/Shadowrocket/', icon: 'material-symbols:smartphone' },
        { text: 'Android Clash', link: '/article/ClashforAndroid/', icon: 'material-symbols:android' },
        { text: '桌面端 Clash Verge', link: '/article/ClashVerge/', icon: 'material-symbols:computer' },
        { text: '免费 Apple ID', link: '/article/freeAppleID/', icon: 'material-symbols:account-circle' },
        { text: '路由器翻墙', link: '/article/luyouqi/', icon: 'material-symbols:router' },
      ]
    },
    {
      text: '优惠与避坑',
      icon: 'material-symbols:savings-rounded',
      items: [
        { text: '机场优惠券', link: '/article/youhuijuan/', icon: 'material-symbols:local-offer-rounded' },
        { text: '免费试用合集', link: '/article/mianfeijichang/', icon: 'material-symbols:redeem-rounded' },
        { text: '机场跑路汇总', link: '/scamvpn/paolujichang/', icon: 'material-symbols:warning' },
        { text: '跑路前征兆', link: '/article/airport-scam-warning-signs-2026/', icon: 'material-symbols:health-and-safety' },
      ],
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
