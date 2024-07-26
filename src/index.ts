import { Context, Schema, Session } from "koishi";

declare module "koishi" {
  interface Events {
    notice(session: Session): void;
  }
  interface Session {
    targetId: string;
  }
}

export const name = "poke";
export const usage = `
## 自定义戳一戳事件响应

仅兼容 OneBot 平台，支持 [Lagrange.OneBot] 和 [NapCat]

[Lagrange.OneBot]: https://lagrangedev.github.io/Lagrange.Doc/
[NapCat]: https://napneko.github.io/zh-CN/
`;

export interface Config {
  mode: "command" | "message";
  filter: boolean;
  command: { content: string; probility: number };
  messages: { content: string; weight: number }[];
}

export const Config: Schema<Config> = Schema.intersect([
  Schema.object({
    mode: Schema.union([
      Schema.const("command").description("执行命令"),
      Schema.const("message").description("回复消息"),
    ])
      .default("command")
      .description("响应模式"),
    filter: Schema.boolean().default(true).description("只响应戳自己的事件"),
  }),
  Schema.object({
    command: Schema.object({
      content: Schema.string().default("status").description("命令内容"),
      probility: Schema.number()
        .min(0)
        .max(100)
        .role("slider")
        .default(50)
        .description("触发概率"),
    }),
  }).description("命令内容配置"),
  Schema.object({
    messages: Schema.array(
      Schema.object({
        content: Schema.string().required().description("消息内容"),
        weight: Schema.number().min(0).max(100).default(50).description("权重"),
      })
    )
      .role("table")
      .default([{ content: "戳你一下", weight: 50 }])
      .description("消息内容"),
  }).description("消息内容配置"),
]);

export function apply(ctx: Context, config: Config) {
  // write your plugin here
  ctx.on("notice", (session: Session) => {
    // 不是戳一戳事件，则返回
    if (session.subtype != "poke") {
      return;
    }

    // 被戳的不是自己，则返回
    if (config.filter && (session.targetId != session.selfId)) {
      return;
    }

    switch (config.mode) {
      case "command":
        if (Math.random() * 100 < config.command.probility) {
          session.execute(config.command.content);
        }
        break;
      case "message":
        if (config.messages.length > 0)
          session.sendQueued(randomMessage(config.messages));
        break;
      default:
        break;
    }
  });
}

function randomMessage(messages: { content: string; weight: number }[]) {
  const totalWeight = messages.reduce((sum, cur) => sum + cur.weight, 0);
  const random = Math.random() * totalWeight;
  let sum = 0;
  for (const message of messages) {
    sum += message.weight;
    if (random < sum) return message.content;
  }
}
