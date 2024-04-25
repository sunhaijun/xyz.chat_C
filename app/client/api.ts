import { getClientConfig } from "../config/client";
import { ModelProvider, ServiceProvider } from "../constant";
import { ChatMessage, useAccessStore } from "../store";

import { ChatGPTApi } from "./platforms/openai";
import { ClaudeApi } from "./platforms/anthropic";
import { GeminiProApi } from "./platforms/google";

export const ROLES = ["system", "user", "assistant"] as const;
export type MessageRole = (typeof ROLES)[number];

// 模型定义
export interface LLMModel {
  name: string;
  displayName: string;
  description?: string;
  speed?: string;
  strengths?: string;
  vision?: boolean;
  contextWindow?: number;
  max_output?: number;
  data_cut_off?: number;
  favorite?: boolean;
  provider: string;
}


// Request.Messages.content定义
// 兼容OpenAI和Anthropic的MultimodalContent定义
// TODO：赋值的代码需要区分Anthropic和OpenAI
export interface MultimodalContent {
  type: "text" | "image_url" | "image";
  text?: string;
  image_url?: {
    // openai
    url: string;
  };
  source?: {
    // anthropic
    type: string; // "base64"
    media_type: string; // "image/jpeg"
    data: string;
  };
}

// export const claudeSupportedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

// Request.Messages定义
export interface RequestMessage {
  role: MessageRole;
  content: string | MultimodalContent[];
}

// Model会话配置定义
export interface LLMConfig {
  model: string;
  // temperature?: number;
  // top_p?: number;
  stream?: boolean;
  // presence_penalty?: number;
  // frequency_penalty?: number;
}

// 会话定义
export interface ChatOptions {
  messages: RequestMessage[];
  config: LLMConfig;

  // callback functions
  onUpdate?: (message: string, chunk: string) => void;
  onFinish: (message: string) => void;
  onError?: (err: Error) => void;
  onController?: (controller: AbortController) => void;
}

// Token消耗量定义
export interface LLMUsage {
  used: number;
  total: number;
}

// 会话interface定义
export abstract class LLMApi {
  abstract chat(options: ChatOptions): Promise<void>;
}

// LLM Client调用类
export class ClientApi {
  public llm: LLMApi; // 当前使用的模型Client调用实例

  constructor(provider: ModelProvider = ModelProvider.GPT) {
    if (provider === ModelProvider.Claude) {
      this.llm = new ClaudeApi();
      return;
    } else if (provider === ModelProvider.GeminiPro) {
      this.llm = new GeminiProApi();
      return;
    }

    this.llm = new ChatGPTApi(); // 默认使用OpenAI
  }

  config() {}

  prompts() {}

  masks() {}

  // 分享会话内容到 sharegpt
  async share(messages: ChatMessage[], avatarUrl: string | null = null) {
    const msgs = messages
      .map((m) => ({
        from: m.role === "user" ? "human" : "gpt",
        value: m.content,
      }))
      .concat([
        {
          from: "human",
          value: "Share from [xyz.chat]",
        },
      ]);

    console.log("[Share]", messages, msgs);
    const clientConfig = getClientConfig();
    const proxyUrl = "/sharegpt";
    const rawUrl = "https://sharegpt.com/api/conversations";
    const shareUrl = clientConfig?.isApp ? rawUrl : proxyUrl;
    const res = await fetch(shareUrl, {
      body: JSON.stringify({
        avatarUrl,
        items: msgs,
      }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    });

    const resJson = await res.json();
    console.log("[Share]", resJson);
    if (resJson.id) {
      return `https://shareg.pt/${resJson.id}`;
    }
  }
}

// Headers生成辅助函数
export function getHeaders(provider: ServiceProvider) {
  const accessStore = useAccessStore.getState();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "x-requested-with": "XMLHttpRequest",
    Accept: "application/json",
  };

  const authHeader = "Authorization";
  const providerHeader = "X-Provider-Code";
  const apiKey = accessStore.authToken;
  const makeBearer = (s: string) => `${"Bearer "}${s.trim()}`;
  const validString = (x: string) => x && x.length > 0;

  if (validString(apiKey)) {
    headers[providerHeader] = provider;
    headers[authHeader] = makeBearer(apiKey);
  }

  return headers;
}
