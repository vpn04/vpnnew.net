---
title: Markdown 示例
tags:
  - markdown
createTime: 2025/10/05 07:44:47
permalink: /article/us83p9t3/
---

## 二级标题示例

### 三级标题

#### 四级标题

##### 五级标题

###### 六级标题

## 二级标题带徽章 <Badge type="tip" text="新" />

### 三级标题带徽章 <Badge type="warning" text="注意" />

#### 四级标题带徽章 <Badge type="danger" text="警告" />

正文段落内容。

`@layer` CSS at-rule 属于 [CSS Houdini API](https://developer.mozilla.org/zh-CN/docs/Web/Guide/Houdini) 的一环，
它让开发者可以自定义 [CSS 层级](https://developer.mozilla.org/zh-CN/docs/Web/CSS/@layer)，
实现样式优先级的灵活控制。

`@layer` 的引入，极大提升了样式管理的灵活性。

加粗：**粗体文本**

斜体： _斜体内容_

~~删除线内容~~

内容 ==高亮==

数学公式： $a^2 + b^2 = c^2$

$\int_0^1 x^2 dx = \frac{1}{3}$

21^st^

CO~2~

::: center
居中内容
:::

::: right
右对齐内容
:::

- 列表项A
- 列表项B
- 列表项C


1. 第一项
2. 第二项
3. 第三项

- [ ] 待办事项A
- [ ] 待办事项B
- [x] 已完成事项C
- [x] 已完成事项D

| 表头1         | 表头2         | 表头3  |
| ------------- |:-------------:| -----:|
| 内容A         | 居中          | $100  |
| 内容B         | 居中          |  $20  |
| 内容C         | 居中          |   $5  |


> 这是引用块
>
> 依然是引用内容


[站内链接](/)

[GitHub 主页](https://github.com/)



**徽章示例：**

- <Badge type="info" text="信息徽章" />
- <Badge type="tip" text="提示徽章" />
- <Badge type="warning" text="警告徽章" />
- <Badge type="danger" text="危险徽章" />


**图标示例：**

- house - <Icon name="material-symbols:home" color="currentColor" size="1em" />
- github - <Icon name="skill-icons:github-dark" size="2em" />
- mail - <Icon name="skill-icons:gmail-light" size="2em" />


**demo 包裹器：**

::: demo-wrapper title="演示" no-padding height="180px"
<style scoped>
.demo-flex {
  display: flex;
  gap: 16px;
  padding: 16px;
}
.demo-flex .main {
  background: #eee;
}
</style>

<div class="demo-flex">
  <div class="main">主内容</div>
  <div class="aside">侧边栏</div>
</div>

:::

**代码：**

```js whitespace
const a = 1
const b = 2
const c = a + b

// [!code word:obj]
const obj = {
  toLong: {
    deep: {
      deep: {
        deep: {
          value: 'this is to long text. this is to long text. this is to long text. this is to long text.', // [!code highlight]
        }
      }
    }
  }
}
```

**Code Blocks TwoSlash：**

```ts twoslash
// @errors: 2339
const welcome = 'Tudo bem gente?'
const words = welcome.contains(' ')
```

```ts twoslash
import express from 'express'
const app = express()
app.get('/', (req, res) => {
  res.send
})
app.listen(3000)
```

```ts twoslash
import { createHighlighter } from 'shiki'

const highlighter = await createHighlighter({ themes: ['nord'], langs: ['javascript'] })
// @log: Custom log message
const a = 1
// @error: Custom error message
const b = 1
// @warn: Custom warning message
const c = 1
// @annotate: Custom annotation message
```

```ts twoslash
// @errors: 2540
interface Todo {
  title: string
}

const todo: Readonly<Todo> = {
  title: 'Delete inactive users'.toUpperCase(),
//  ^?
}

todo.title = 'Hello'

Number.parseInt('123', 10)
//      ^|

//
//
```

```vue twoslash
<script setup lang="ts">
import { ref } from 'vue'

const count = ref(0)
</script>

<template>
  <p>{{ count }}</p>
</template>
```

**代码分组：**

::: code-tabs
@tab tab1

```js
const a = 1
const b = 2
const c = a + b
```

@tab tab2

```ts
const a: number = 1
const b: number = 2
const c: number = a + b
```

:::

**代码块高亮：**

```ts
function foo() {
  const a = 1 // [!code highlight]

  console.log(a)

  const b = 2 // [!code ++]
  const c = 3 // [!code --]

  console.log(a + b + c) // [!code error]
  console.log(a + b) // [!code warning]
}
```

**代码块聚焦：**

```ts
function foo() {
  const a = 1 // [!code focus]
}
```

::: tip 仅标题
:::

::: note 注释
注释内容 [link](https://github.com/pengzhanbo) `inline code`

```js
const a = 1
const b = 2
const c = a + b
```

:::

::: info 信息
信息内容 [link](https://github.com/pengzhanbo) `inline code`

```js
const a = 1
const b = 2
const c = a + b
```

:::

::: tip 提示
提示内容 [link](https://github.com/pengzhanbo) `inline code`

```js
const a = 1
const b = 2
const c = a + b
```

:::

::: warning 警告
警告内容 [link](https://github.com/pengzhanbo) `inline code`

```js
const a = 1
const b = 2
const c = a + b
```

:::

::: caution 错误
错误内容 [link](https://github.com/pengzhanbo) `inline code`

```js
const a = 1
const b = 2
const c = a + b
```

:::

::: important 重要
重要内容 [link](https://github.com/pengzhanbo) `inline code`

```js
const a = 1
const b = 2
const c = a + b
```

:::

::: details 详细标题

这里是内容。
:::

**GFM alert：**

> [!note]
> note

> [!info]
> info

> [!tip]
> tip

> [!warning]
> warning

> [!caution]
> caution

> [!important]
> important

**代码演示：**

:::: demo title="常规示例" desc="一个常规示例"

::: code-tabs
@tab HTML

```html
<div id="app">
  <h3>vuepress-theme-plume</h3>
</div>
```

@tab Javascript

```js
const a = 'So Awesome!'
const app = document.querySelector('#app')
app.appendChild(window.document.createElement('small')).textContent = a
```

@tab CSS

```css
#app {
  font-size: 2em;
  text-align: center;
}
```

:::
::::

**选项卡：**

::: tabs
@tab 标题1
内容区块

@tab 标题2
内容区块
:::

:::: warning
::: tabs
@tab 标题1
内容区块

@tab 标题2
内容区块
:::
::::

**脚注：**

脚注 1 链接[^first]。

脚注 2 链接[^second]。

行内的脚注^[行内脚注文本] 定义。

重复的页脚定义[^second]。

[^first]: 脚注 **可以包含特殊标记**

    也可以由多个段落组成

[^second]: 脚注文字。
