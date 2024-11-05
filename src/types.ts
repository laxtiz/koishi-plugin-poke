import {} from "koishi";

declare module "koishi" {
  interface Events {
    notice(session: Session): void;
  }

  interface Session {
    targetId: string;
  }
}

export interface CommandReply {
  content: string;
  probability: number;
}

export interface MessageReply {
  content: string;
  weight: number;
}
