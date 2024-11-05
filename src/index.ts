import { Context, h, Schema, Session } from "koishi";
import {} from "koishi-plugin-adapter-onebot";

import zhCN from "./locale/zh-CN.yml";
import { MessageReply, CommandReply } from "./types";
import { parsePlatform } from "./utils";

export const name = "poke";
export const usage = zhCN._usage;

const defaultMessage: MessageReply = {
  content: "<at id={userId}/> 戳你一下",
  weight: 50,
};

export interface Config {
  filter: boolean;
  mode: "command" | "message";
  interval?: number;
  warning?: boolean;
  prompt?: string;
  command?: CommandReply;
  messages?: MessageReply[];
}

export const Config: Schema<Config> = Schema.intersect([
  Schema.object({
    filter: Schema.boolean().default(true).description("只响应戳自己的事件"),
    mode: Schema.union([
      Schema.const("command").description("执行命令"),
      Schema.const("message").description("回复消息"),
    ])
      .default("command")
      .description("响应模式"),
  }),
  Schema.object({
    interval: Schema.number()
      .default(1000)
      .step(100)
      .description("最小触发间隔（毫秒)"),
    warning: Schema.boolean()
      .default(false)
      .description("频繁触发是否发送警告"),
    prompt: Schema.string().default("别戳了，歇一歇吧").description("警告内容"),
  }).description("响应间隔配置"),
  Schema.union([
    Schema.object({
      mode: Schema.const("command"),
      command: Schema.object({
        content: Schema.string().default("status").description("命令内容"),
        probability: Schema.number()
          .min(0)
          .max(100)
          .role("slider")
          .default(50)
          .description("触发概率"),
      }),
    }).description("命令模式配置"),
    Schema.object({
      mode: Schema.const("message").required(),
      messages: Schema.array(
        Schema.object({
          content: Schema.string().required().description("消息内容"),
          weight: Schema.number()
            .min(0)
            .max(100)
            .default(50)
            .description("权重"),
        })
      )
        .role("table")
        .default([defaultMessage])
        .description("消息内容"),
    }).description("消息模式配置"),
  ]),
]);

export function apply(ctx: Context, config: Config) {
  const cache = new Map<string, number>();

  ctx.i18n.define("zh-CN", zhCN);

  ctx
    .platform("onebot")
    .command("poke [target:user]")
    .action(async ({ session }, target) => {
      // 不是 onebot 平台，则返回
      if (!session.onebot) {
        return;
      }

      const params = { user_id: session.userId };
      if (target) {
        const [platform, id] = parsePlatform(target);
        if (platform != "onebot") {
          return;
        }
        params.user_id = id;
      }

      if (session.isDirect) {
        await session.onebot._request("friend_poke", params);
      } else {
        params["group_id"] = session.guildId;
        await session.onebot._request("group_poke", params);
      }
    });

  ctx.platform("onebot").on("notice", async (session: Session) => {
    // 不是戳一戳事件，则返回
    if (session.subtype != "poke") {
      return;
    }

    // 被戳的不是自己，则返回
    if (config.filter && session.targetId != session.selfId) {
      return;
    }

    // 冷却中，则返回
    if (config.interval > 0 && cache.has(session.userId)) {
      const ts = cache.get(session.userId)!;
      if (session.timestamp - ts < config.interval) {
        if (config.warning) session.sendQueued(config.prompt);
        return;
      }
    }

    // 更新缓存
    cache.set(session.userId, session.timestamp);

    switch (config.mode) {
      case "command":
        if (Math.random() * 100 < config.command.probability) {
          await session.execute(config.command.content);
        }
        break;
      case "message":
        if (config.messages.length > 0) {
          const msg = randomMessage(config.messages);
          const content = h.parse(msg, session);
          await session.sendQueued(content);
        }
        break;
      default:
        break;
    }
  });
}

function randomMessage(messages: MessageReply[]) {
  const totalWeight = messages.reduce((sum, cur) => sum + cur.weight, 0);
  const random = Math.random() * totalWeight;
  let sum = 0;
  for (const message of messages) {
    sum += message.weight;
    if (random < sum) return message.content;
  }
}
