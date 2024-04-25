export const OWNER = "OneDollarGPT.com";
export const REPO = "xyz.chat";
export const REPO_URL = "";
export const ISSUE_URL = "";
export const UPDATE_URL = "";
export const RELEASE_URL = "";
export const FETCH_COMMIT_URL = "";
export const FETCH_TAG_URL = "";
export const RUNTIME_CONFIG_DOM = "danger-runtime-config";

export const DEFAULT_API_HOST = "https://rp.onedollargpt.com";
export const OPENAI_BASE_URL = "https://api.openai.com";

export const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/";

export enum Path {
  Home = "/",
  Chat = "/chat",
  Settings = "/settings",
  NewChat = "/new-chat",
  Masks = "/masks",
  LLMs = "/llms",
  Auth = "/auth",
}

export enum ApiPath {
  Cors = "/api/cors",
  OpenAI = "/api/openai",
}

export enum SlotID {
  AppBody = "app-body",
  CustomModel = "custom-model",
}

export enum FileName {
  Masks = "masks.json",
  Prompts = "prompts.json",
}

export enum StoreKey {
  Chat = "xyz-chat-store",
  Access = "access-control",
  Config = "app-config",
  Mask = "mask-store",
  LLM = "llm-store",
  Prompt = "prompt-store",
  Update = "chat-update",
  Sync = "sync",
}

export const DEFAULT_SIDEBAR_WIDTH = 300;
export const MAX_SIDEBAR_WIDTH = 500;
export const MIN_SIDEBAR_WIDTH = 230;
export const NARROW_SIDEBAR_WIDTH = 100;

export const LAST_INPUT_KEY = "last-input";
export const UNFINISHED_INPUT = (id: string) => "unfinished-input-" + id;

export const STORAGE_KEY = "xyz-chat";

export const REQUEST_TIMEOUT_MS = 60000;

export const EXPORT_MESSAGE_CLASS_NAME = "export-markdown";

export enum ServiceProvider {
  OpenAI = "OpenAI",
  Anthropic = "Anthropic",
  Google = "Google",
  Groq = "Groq",
}

export enum ModelProvider {
  GPT = "GPT",
  Claude = "Claude",
  GeminiPro = "GeminiPro",
  Groq = "Groq",
}

export enum ModelCodePrefix {
  OpenAI = "gpt",
  Anthropic = "claude",
  Google = "gemini",
}

export const OpenaiPath = {
  ChatPath: "v1/chat/completions",
};

export const AnthropicPath = {
  ChatPath: "v1/messages",
};

export const Azure = {
  ExampleEndpoint: "https://{resource-url}/openai/deployments/{deploy-id}",
};

export const Google = {
  ExampleEndpoint: "https://generativelanguage.googleapis.com/",
  ChatPath: "v1beta/models/gemini-pro:generateContent",
  VisionChatPath: "v1beta/models/gemini-pro-vision:generateContent",
};

export const DEFAULT_INPUT_TEMPLATE = `{{input}}`; // input / time / model / lang
export const DEFAULT_SYSTEM_TEMPLATE = `
You are ChatGPT, a large language model trained by {{ServiceProvider}}.
Current model: {{model}}
Current time: {{time}}
Latex inline: $x^2$ 
Latex block: $$e=mc^2$$
`;

// 用于提取摘要的模型（低价且快速为首选）
export const SUMMARIZE_MODEL = "claude-3-haiku-20240307";

export const MODEL_LIST_VERSION = "20240323"; // 用来送给服务端，以判断模型列表是否需要更新
export const DEFAULT_MODELS = [
  {
    name: "claude-3-haiku-20240307",
    displayName: "Claude 3 Haiku ✰✰✰",
    description:
      "Fastest and most compact model for near-instant responsiveness",
    contextWindow: 200,
    favorite: true,
    provider: "Anthropic",
  },
  {
    name: "gpt-3.5-turbo",
    displayName: "GPT-3.5 Turbo ✰✰✰",
    description:
      "The latest GPT-3.5 Turbo model. this models are capable and cost-effective.",
    contextWindow: 16,
    favorite: true,
    provider: "OpenAI",
  },
  {
    name: "claude-3-sonnet-20240229",
    displayName: "Claude 3 Sonnet ✰✰✰✰",
    description:
      "Ideal balance of intelligence and speed for enterprise workloads",
    contextWindow: 200,
    favorite: true,
    provider: "Anthropic",
  },
  {
    name: "gpt-4-vision-preview",
    displayName: "GPT-4 Turbo Vision ✰✰✰✰✰",
    description:
      "The latest GPT-4 Turbo vision model. this model with the ability to understand images, in addition to all other GPT-4 Turbo capabilities.",
    contextWindow: 128,
    favorite: true,
    provider: "OpenAI",
  },
  {
    name: "gpt-4-turbo-preview",
    displayName: "GPT-4 Turbo ✰✰✰✰✰",
    description:
      "With 128k context, fresher knowledge and the broadest set of capabilities, GPT-4 Turbo is more powerful than GPT-4 and offered at a lower price.",
    contextWindow: 128,
    favorite: true,
    provider: "OpenAI",
  },
  {
    name: "claude-3-opus-20240229",
    displayName: "Claude 3 Opus ✰✰✰✰✰",
    description: "Most powerful model for highly complex tasks",
    contextWindow: 200,
    favorite: true,
    provider: "Anthropic",
  },
  
  
] as const;

export const CHAT_PAGE_SIZE = 15;
export const MAX_RENDER_MSG_COUNT = 45;
