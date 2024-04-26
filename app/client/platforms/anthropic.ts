"use client";

import {
  AnthropicPath,
  REQUEST_TIMEOUT_MS,
  ServiceProvider,
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

// LLM Client的Anthropic实现
export class ClaudeApi implements LLMApi {
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

    return [baseUrl, path].join("/");
  }

  extractMessage(res: any) {
    //return res.choices?.at(0)?.message?.content ?? "";
    return res.content?.at(0)?.text ?? "";
  }

  // 实现Chat方法
  async chat(options: ChatOptions) {
    // 检查是否为视觉模型
    const visionModel = isVisionModel(options.config.model);

    // let systemMsg = "";
    // const filteredMessages = options.messages.filter((msg) => {
    //   // 过滤role为system的message
    //   if (msg.role === "system") {
    //     if (systemMsg) {
    //       systemMsg += "\n";
    //     }
    //     systemMsg += getMessageTextContent(msg);
    //     return false;
    //   }

    //   return true;
    // });

    let systemMsg = "";
    let lastRole = "";
    let filteredMessages = [];
    for (let i = options.messages.length - 1; i >= 0; i--) {
      const msg = options.messages[i];

      // 过滤role为system的message
      if (msg.role === "system") {
        if (systemMsg) {
          systemMsg += "\n";
        }
        systemMsg += getMessageTextContent(msg);
        continue;
      }

      // 如果当前消息的角色与上一条消息的角色相同，则跳过这条消息
      if (msg.role === lastRole) {
        continue;
      }

      // 将这条消息添加到过滤后的消息列表中，并更新上一条消息的角色
      filteredMessages.unshift(msg);
      lastRole = msg.role;
    }

    // 转换message的content
    const messages = filteredMessages.map((msg) => {
      let newContent = msg.content;
      if (visionModel && Array.isArray(msg.content)) {
        newContent = msg.content.map((content) => {
          if (content.source && content.source.data) {
            // 创建一个新的对象，而不是修改原始对象
            let newSource = {
              ...content.source,
              data: content.source.data.split(",")[1],
            };
            return { ...content, source: newSource };
          } else {
            return content;
          }
        });
      }

      return {
        role: msg.role,
        content: visionModel ? newContent : getMessageTextContent(msg),
      };
    });

    // 获取模型配置（优先级：全局配置 < 会话配置）
    const modelConfig = {
      ...useAppConfig.getState().modelConfig,
      ...useChatStore.getState().currentSession().mask.modelConfig,
      ...{
        model: options.config.model,
      },
    };

    // 构建Request Payload
    const requestPayload = {
      model: modelConfig.model,
      messages,
      ...(systemMsg ? { system: systemMsg } : {}),
      max_tokens: Math.max(modelConfig.max_tokens, 1024),
      stream: options.config.stream,
    };
    // console.log("[Request] Anthropic payload: ", requestPayload);

    const shouldStream = !!options.config.stream; // 确保转为布尔类型
    const controller = new AbortController();
    options.onController?.(controller);

    try {
      const chatPath = this.path(AnthropicPath.ChatPath);
      const chatPayload = {
        method: "POST",
        body: JSON.stringify(requestPayload),
        signal: controller.signal,
        headers: getHeaders(ServiceProvider.Anthropic),
      };

      // make a fetch request
      const requestTimeoutId = setTimeout(
        () => controller.abort(),
        REQUEST_TIMEOUT_MS,
      );

      const accessStore = useAccessStore.getState();

      if (shouldStream) {
        let responseText = "";
        let remainText = "";
        let finished = false;

        // animate response to make it looks smooth
        function animateResponseText() {
          if (finished || controller.signal.aborted) {
            responseText += remainText;
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
            // console.log("[Response] response status: ", res.status);
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
              // console.log("[Response] http code: ", res.status);

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
            // console.log("[Response] stream msg: ", msg);

            const event = msg.event.trim();
            const data = JSON.parse(msg.data.trim());

            switch (event) {
              case "message_start":
                // Handle message_start event
                break;
              case "content_block_start":
                // Handle content_block_start event
                break;
              case "content_block_delta":
                // Handle content_block_delta event
                const text = data.delta.text;
                if (text) {
                  remainText += text;
                }
                break;
              case "content_block_stop":
                // Handle content_block_stop event
                break;
              case "message_delta":
                // Handle message_delta event
                break;
              case "message_stop":
                // Handle message_stop event
                return finish();
              case "ping":
                // Handle ping event
                break;
              case "error":
                console.error(
                  "[Request] Anthropic error",
                  data.error.type,
                  data.error.message,
                );
                break;
              default:
                console.error("[Request] unknown event, ignore!", event);
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
        const res = await fetch(chatPath, chatPayload);
        clearTimeout(requestTimeoutId);

        const resJson = await res.json();
        const message = this.extractMessage(resJson);
        options.onFinish(message);
      }
    } catch (e) {
      options.onError?.(e as Error);
    }
  }
}
export { AnthropicPath };
