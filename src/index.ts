import { Context, h, Schema, Session } from "koishi";
import zhCN from "./locale/zh-CN.yml";

declare module "koishi" {
  interface Events {
    notice(session: Session): void;
  }

  interface Session {
    targetId: string;
  }
}

export const name = "poke";
export const usage = zhCN._usage;

interface CommandReply {
  content: string;
  probility: number;
}

interface MessageReply {
  content: string;
  weight: number;
}

const defaultMessage: MessageReply = {
  content: "<at id={userId}/> 戳你一下",
  weight: 50,
};

export interface Config {
  filter: boolean;
  mode: "command" | "message";
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
  Schema.union([
    Schema.object({
      mode: Schema.const("command"),
      command: Schema.object({
        content: Schema.string().default("status").description("命令内容"),
        probility: Schema.number()
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
  ctx.on("notice", (session: Session) => {
    // 不是戳一戳事件，则返回
    if (session.subtype != "poke") {
      return;
    }

    // 被戳的不是自己，则返回
    if (config.filter && session.targetId != session.selfId) {
      return;
    }

    switch (config.mode) {
      case "command":
        if (Math.random() * 100 < config.command.probility) {
          session.execute(config.command.content);
        }
        break;
      case "message":
        if (config.messages.length > 0) {
          const msg = randomMessage(config.messages);
          const content = h.parse(msg, session);
          session.sendQueued(content);
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
