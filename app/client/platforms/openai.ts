"use client";

import {
  OpenaiPath,
  REQUEST_TIMEOUT_MS,
  ServiceProvider,
  ModelCodePrefix,
} from "@/app/constant";
import { useAccessStore, useAppConfig, useChatStore } from "@/app/store";

import { ChatOptions, getHeaders, LLMApi } from "../api";

import Locale from "../../locales";
import {
  EventStreamContentType,
  fetchEventSource,
} from "@fortaine/fetch-event-source";
import { prettyObject } from "@/app/utils/format";

import { getMessageTextContent, isVisionModel } from "@/app/utils";

// LLM Client的GPT实现
export class ChatGPTApi implements LLMApi {
  path(path: string): string {
    const accessStore = useAccessStore.getState();
    let baseUrl = accessStore.rpsEndPoint; // RP服务器地址

    // 如果地址以/结尾，去掉/
    if (baseUrl.endsWith("/")) {
      baseUrl = baseUrl.slice(0, baseUrl.length - 1);
    }
    // 如果地址不是http或https开头，加上https://
    if (!baseUrl.startsWith("http")) {
      baseUrl = "https://" + baseUrl;
    }

    console.log("[RP Endpoint] ", baseUrl, path);

    return [baseUrl, path].join("/");
  }

  extractMessage(res: any) {
    return res.choices?.at(0)?.message?.content ?? "";
  }

  // 实现Chat方法
  async chat(options: ChatOptions) {
    // 检查是否为视觉模型
    const visionModel = isVisionModel(options.config.model);
    // 获取消息列表
    const messages = options.messages.map((v) => ({
      role: v.role,
      content: visionModel ? v.content : getMessageTextContent(v),
    }));

    // 获取模型配置（优先级：全局配置 < 会话配置）
    const modelConfig = {
      ...useAppConfig.getState().modelConfig,
      ...useChatStore.getState().currentSession().mask.modelConfig,
      ...{
        model: options.config.model,
      },
    };

    // 构建Request Payload
    const requestPayload: {
      messages: any;
      stream: boolean | undefined;
      model: string;
      temperature: number;
      presence_penalty: number;
      frequency_penalty: number;
      top_p: number;
      max_tokens?: number;
    } = {
      messages,
      stream: options.config.stream,
      model: modelConfig.model,
      temperature: modelConfig.temperature,
      presence_penalty: modelConfig.presence_penalty,
      frequency_penalty: modelConfig.frequency_penalty,
      top_p: modelConfig.top_p,
    };
    if (visionModel) {
      // fix：vision model如果max_tokens过小，会截断消息
      requestPayload.max_tokens = Math.max(modelConfig.max_tokens, 1024);
    }
    // console.log("[Request] openai payload: ", requestPayload);

    const shouldStream = !!options.config.stream; // 确保转为布尔类型
    const controller = new AbortController();
    options.onController?.(controller);

    try {
      const chatPath = this.path(OpenaiPath.ChatPath);
      // 判断模型供应商（确保兼容OpenAI接口规范的其他Provider可复用本实现！！）
      const serviceProvider = modelConfig.model.startsWith(
        ModelCodePrefix.OpenAI,
      )
        ? ServiceProvider.OpenAI
        : ServiceProvider.Groq;

      const chatPayload = {
        method: "POST",
        body: JSON.stringify(requestPayload),
        signal: controller.signal,
        headers: getHeaders(serviceProvider),
      };

      // make a fetch request
      const requestTimeoutId = setTimeout(
        () => controller.abort(),
        REQUEST_TIMEOUT_MS,
      );

      const accessStore = useAccessStore.getState();

      if (shouldStream) {
        // 如果是流式请求
        let responseText = "";
        let remainText = "";
        let finished = false;

        // animate response to make it looks smooth
        function animateResponseText() {
          if (finished || controller.signal.aborted) {
            responseText += remainText;
            console.log("[Response] Animation finished");
            return;
          }

          if (remainText.length > 0) {
            const fetchCount = Math.max(1, Math.round(remainText.length / 60));
            const fetchText = remainText.slice(0, fetchCount);
            responseText += fetchText;
            remainText = remainText.slice(fetchCount);
            options.onUpdate?.(responseText, fetchText);
          }

          requestAnimationFrame(animateResponseText);
        }

        // start animaion
        animateResponseText();

        const finish = () => {
          if (!finished) {
            finished = true;
            options.onFinish(responseText + remainText);
          }
        };

        controller.signal.onabort = finish;

        // 如果没有登录，直接返回未授权错误
        // console.log("[Request] isAuthorized: ", accessStore.isAuthorized());
        if (!accessStore.isAuthorized()) {
          throw new Error(Locale.Error.Unauthorized2);
        }
        
        fetchEventSource(chatPath, {
          ...chatPayload,
          async onopen(res) {
            clearTimeout(requestTimeoutId);
            const contentType = res.headers.get("content-type");
            // console.log("[Response] response content type: ", contentType);
            if (contentType?.startsWith("text/plain")) {
              if (res.status === 401) {
                responseText = Locale.Error.Unauthorized;
              } else if (res.status === 402) {
                responseText = Locale.Error.NeedRecharge;
              } else if (res.status === 406) {
                responseText = Locale.Error.NeedPaidCredits;
              } else {
                responseText = await res.clone().text();
              }

              return finish();
            }

            // 非正常response的情况
            if (
              !res.ok ||
              !res.headers
                .get("content-type")
                ?.startsWith(EventStreamContentType) ||
              res.status !== 200
            ) {
              const responseTexts = [responseText];
              let extraInfo = await res.clone().text();
              try {
                const resJson = await res.clone().json();
                extraInfo = prettyObject(resJson);
              } catch {}

              if (res.status === 401) {
                responseTexts.push(Locale.Error.Unauthorized);
              } else if (res.status === 402) {
                responseTexts.push(Locale.Error.NeedRecharge);
              } else if (res.status === 406) {
                responseTexts.push(Locale.Error.NeedPaidCredits);
              }

              if (extraInfo) {
                responseTexts.push(extraInfo);
              }

              responseText = responseTexts.join("\n\n");

              return finish();
            }
          },
          onmessage(msg) {
            if (msg.data === "[DONE]" || finished) {
              // 结束标记处理
              return finish();
            }

            const text = msg.data;
            try {
              const json = JSON.parse(text) as {
                choices: Array<{
                  delta: {
                    content: string;
                  };
                }>;
              };
              const delta = json.choices[0]?.delta?.content;
              if (delta) {
                remainText += delta;
              }
            } catch (e) {
              console.error("[Response] stream parse error", text);
            }
          },
          onclose() {
            finish();
          },
          onerror(e) {
            options.onError?.(e);
            throw e;
          },
          openWhenHidden: true,
        });
      } else {
        // 非流式请求
        const res = await fetch(chatPath, chatPayload);
        clearTimeout(requestTimeoutId);

        const resJson = await res.json();
        const message = this.extractMessage(resJson);
        options.onFinish(message);
      }
    } catch (e) {
      // console.log("[Request] failed to make a chat request", e);
      options.onError?.(e as Error);
    }
  }
}
export { OpenaiPath };
