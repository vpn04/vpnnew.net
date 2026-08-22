/**
 * @see https://theme-plume.vuejs.press/config/navigation/ 查看文档了解配置详情
 *
 * Navbar 配置文件，它在 `.vuepress/plume.config.ts` 中被导入。
 */

import { defineNavbarConfig } from 'vuepress-theme-plume'

export default defineNavbarConfig([
  { text: '首页', link: '/', icon: 'material-symbols:home-rounded' },
  { text: '博客', link: '/blog/', icon: 'material-symbols:article-rounded' },
  {
    text: '推荐',
    icon: 'material-symbols:flight-takeoff',
    items: [
      { text: '机场总榜', link: '/vpn-recommend/', icon: 'material-symbols:workspace-premium-rounded' },
      { text: '中国可用', link: '/best-vpn-for-china/', icon: 'material-symbols:public-rounded' },
      { text: '评测中心', link: '/vpn-airport-reviews/', icon: 'material-symbols:fact-check-rounded' },
      { text: '价格对比', link: '/airport/jichangpk/', icon: 'material-symbols:compare-arrows-rounded' },
      { text: '免费试用', link: '/article/mianfeijichang/', icon: 'material-symbols:redeem-rounded' },
      { text: '优惠券', link: '/article/youhuijuan/', icon: 'material-symbols:sell' },
    ],
  },
  {
    text: '工具',
    icon: 'ic:baseline-construction',
    items: [
      { text: 'iOS 小火箭', link: '/article/Shadowrocket/', icon: 'material-symbols:smartphone' },
      { text: 'Android Clash', link: '/article/ClashforAndroid/', icon: 'material-symbols:android' },
      { text: 'Clash Verge', link: '/article/ClashVerge/', icon: 'material-symbols:computer' },
      { text: '免费 Apple ID', link: '/article/freeAppleID/', icon: 'material-symbols:account-circle' },
      { text: '路由器', link: '/article/luyouqi/', icon: 'material-symbols:router' },
    ],
  },
  {
    text: '专题',
    icon: 'material-symbols:hub-rounded',
    items: [
      { text: '专题索引', link: '/topics/', icon: 'material-symbols:hub-rounded' },
      { text: 'Clash', link: '/clash/', icon: 'material-symbols:terminal-rounded' },
      { text: '小火箭', link: '/shadowrocket/', icon: 'material-symbols:rocket-launch-rounded' },
      { text: '速度测试', link: '/vpn-speed-test/', icon: 'material-symbols:speed-rounded' },
      { text: '跑路汇总', link: '/scamvpn/paolujichang/', icon: 'material-symbols:warning-rounded' },
      { text: '避坑信号', link: '/article/airport-scam-warning-signs-2026/', icon: 'material-symbols:health-and-safety' },
    ],
  },
  {
    text: '更多',
    icon: 'icon-park-outline:more-three',
    items: [
      { text: '统计', link: '/analytics/', icon: 'material-symbols:monitoring-rounded' },
      { text: '归档', link: '/blog/archives/', icon: 'material-symbols:archive-rounded' },
      { text: '标签', link: '/blog/tags/', icon: 'material-symbols:sell' },
      { text: '分类', link: '/blog/categories/', icon: 'material-symbols:category' },
      { text: '友链', link: '/friends/', icon: 'material-symbols:link-rounded' },
      { text: '评测方法', link: '/methodology/', icon: 'material-symbols:rule-settings-rounded' },
      { text: '关于', link: '/about/', icon: 'material-symbols:person-rounded' },
      { text: '披露', link: '/disclosure/', icon: 'material-symbols:policy-rounded' },
      { text: '联系', link: '/contact/', icon: 'material-symbols:mail-rounded' },
      { text: 'English', link: '/en/', icon: 'material-symbols:translate-rounded' },
    ],
  },
])
