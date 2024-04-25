import { ServiceProvider, StoreKey } from "../constant";
import { getHeaders } from "../client/api";
import { getClientConfig } from "../config/client";
import { createPersistStore } from "../utils/store";
import { ensure } from "../utils/clone";

let fetchState = 0; // 0 not fetch, 1 fetching, 2 done

const DEFAULT_ACCESS_STATE = {
  // accessCode: "",
  // useCustomConfig: true,

  provider: ServiceProvider.OpenAI,

  // RP服务器地址
  rpsEndPoint: "",
  // RP服务授权码
  authToken: "",

  // server config
  // needCode: true, // TODO
  // hideUserApiKey: false, // TODO
  // hideBalanceQuery: true, // TODO
  // disableGPT4: false,
  disableFastLink: false,
  customModels: "", // TODO

  getAuthTokenUri: "https://onedollargpt.com/api/v1/user/token",
  onegptUri: "https://onedollargpt.com",
  onegptLoginUri: "https://onedollargpt.com/api/v1/user/login",
  onegptUserInfoUri: "https://onedollargpt.com/api/v1/user/info",
  onegptModelListUri: "https://onedollargpt.com/api/v1/sys/model/list",
};

export const useAccessStore = createPersistStore(
  { ...DEFAULT_ACCESS_STATE },

  (set, get) => ({
    isValidRpsEndpoint() {
      return ensure(get(), ["rpsEndPoint"]);
    },

    isValidAuthToken() {
      return ensure(get(), ["authToken"]);
    },

    isAuthorized() {
      this.fetch();

      // 检查是否已经设定了代理服务器相关配置
      return this.isValidRpsEndpoint() && this.isValidAuthToken();
    },
    fetch() {
      if (fetchState > 0 || getClientConfig()?.buildMode === "export") return;
      fetchState = 1;
      fetch("/api/config", {
        method: "post",
        body: null,
        // TODO: confirm if we need to send headers?
        // headers: {
        //   ...getHeaders(),
        // },
      })
        .then((res) => res.json())
        .then((res: DangerConfig) => {
          // console.log("[Config] got config from server", res);
          set(() => ({ ...res }));
        })
        .catch(() => {
          console.error("[Config] failed to fetch config");
        })
        .finally(() => {
          fetchState = 2;
        });
    },
  }),
  {
    name: StoreKey.Access,
    version: 2,
    migrate(persistedState, version) {
      // if (version < 2) {
      //   const state = persistedState as {
      //     token: string;
      //     openaiApiKey: string;
      //     azureApiVersion: string;
      //     googleApiKey: string;
      //   };
      //   state.openaiApiKey = state.token;
      //   state.azureApiVersion = "2023-08-01-preview";
      // }

      return persistedState as any;
    },
  },
);
