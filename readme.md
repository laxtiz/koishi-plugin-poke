# koishi-plugin-poke

[![npm](https://img.shields.io/npm/v/koishi-plugin-poke?style=flat-square)](https://www.npmjs.com/package/koishi-plugin-poke)

## 戳一戳

仅兼容 OneBot 平台，支持 [Lagrange.OneBot] 和 [NapCat]

**最新版本NapCat支持主动发起戳一戳，请及时更新**

## 主动发起

NapCat支持主动发起戳一戳

命令格式：`poke @user`

如果没有指定用户，默认戳自己，支持私聊和群聊

## 响应配置

Lagrange.OneBot 和 NapCat 均支持响应戳一戳事件


### 使用方法

当前支持两种模式

1. 命令模式：执行指定命令，可指定触发概率，默认 50%
2. 消息模式：发送随机消息，可指定每条消息的权重，默认 50

### 高级用法

- 命令模式为轻度用户设计，如需更复杂的用法，请使用消息模式
- 消息模式不仅支持发送消息，还支持发送[标准元素]和[消息组件]
- 使用`<at id={userId}/>` 可以插入`@用户`，`userId`属性将会自动替换
- 使用`<at id={targetId}/>` 可以插入`@被戳用户`，`targetId`属性将会自动替换
- 支持替换的属性可以查看[Session]文档
- 使用消息模式随机触发机制，可以使用`<execute>status</execute>`执行不同的命令
- 使用`<execute>poke <at id={userId}/></execute>`可以回戳
- 也可以简写成`<execute>poke</execute>`
- 直接使用命令模式更方便

### 特别说明

戳一戳事件具有`targetId`属性，表示被戳的用户，可以通过`<at id={targetId}/>`插入

关闭`filter`选项后，将会响应所有戳一戳事件，即使被戳的不是自己

配合`filter`选项，即可使用下面的示例

> `<at id={userId}/> 戳了一下 <at id={targetId}/>`

[Lagrange.OneBot]: https://lagrangedev.github.io/Lagrange.Doc/
[NapCat]: https://napcat.napneko.icu/
[标准元素]: https://koishi.chat/zh-CN/api/message/elements.html
[消息组件]: https://koishi.chat/zh-CN/api/message/components.html
[Session]: https://koishi.chat/zh-CN/api/core/session.html
