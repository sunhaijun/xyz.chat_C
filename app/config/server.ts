
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      // PROXY_URL?: string; // docker only

      // OPENAI_API_KEY?: string;
      // CODE?: string;

      BASE_URL?: string;
      // OPENAI_ORG_ID?: string; // openai only

      VERCEL?: string;
      BUILD_MODE?: "standalone" | "export";
      BUILD_APP?: string; // is building desktop app

      // HIDE_USER_API_KEY?: string; // disable user's api key input
      // DISABLE_GPT4?: string; // allow user to use gpt-4 or not
      // ENABLE_BALANCE_QUERY?: string; // allow user to query balance or not
      // DISABLE_FAST_LINK?: string; // disallow parse settings from url or not
      // CUSTOM_MODELS?: string; // to control custom models

      // azure only
      // AZURE_URL?: string; // https://{azure-url}/openai/deployments/{deploy-name}
      // AZURE_API_KEY?: string;
      // AZURE_API_VERSION?: string;

      // google only
      // GOOGLE_API_KEY?: string;
      // GOOGLE_URL?: string;

      // Official Site
      ONEGPT_URI?: string;
      // 从服务端API获取用户token的URI
      GET_ACCESS_CODE_URI?: string;
      // 从服务端API登录用户的URI
      ONEGPT_LOGIN_URI?: string;
      // 从服务端API获取用户信息的URI
      ONEGPT_USER_INFO_URI?: string;
      // 从服务端API获取模型列表的URI
      ONEGPT_MODEL_LIST_URI?: string;
    }
  }
}

// const ACCESS_CODES = (function getAccessCodes(): Set<string> {
//   const code = process.env.CODE;

//   try {
//     const codes = (code?.split(",") ?? [])
//       .filter((v) => !!v)
//       .map((v) => md5.hash(v.trim()));
//     return new Set(codes);
//   } catch (e) {
//     return new Set();
//   }
// })();

export const getServerSideConfig = () => {
  if (typeof process === "undefined") {
    throw Error(
      "[Server Config] you are importing a nodejs-only module outside of nodejs",
    );
  }

  // let customModels = process.env.CUSTOM_MODELS ?? "";

  // const isAzure = !!process.env.AZURE_URL;
  // const isGoogle = !!process.env.GOOGLE_API_KEY;

  // const apiKeyEnvVar = process.env.OPENAI_API_KEY ?? "";
  // const apiKeys = apiKeyEnvVar.split(",").map((v) => v.trim());
  // const randomIndex = Math.floor(Math.random() * apiKeys.length);
  // const apiKey = apiKeys[randomIndex];
  // console.log(
  //   `[Server Config] using ${randomIndex + 1} of ${apiKeys.length} api key`,
  // );

  return {
    baseUrl: process.env.BASE_URL,
    // apiKey,
    // openaiOrgId: process.env.OPENAI_ORG_ID,

    // isAzure,
    // azureUrl: process.env.AZURE_URL,
    // azureApiKey: process.env.AZURE_API_KEY,
    // azureApiVersion: process.env.AZURE_API_VERSION,

    // isGoogle,
    // googleApiKey: process.env.GOOGLE_API_KEY,
    // googleUrl: process.env.GOOGLE_URL,

    gtmId: process.env.GTM_ID,

    // needCode: ACCESS_CODES.size > 0,
    // code: process.env.CODE,
    // codes: ACCESS_CODES,

    // proxyUrl: process.env.PROXY_URL,
    isVercel: !!process.env.VERCEL,

    // hideUserApiKey: !!process.env.HIDE_USER_API_KEY,
    // hideBalanceQuery: !process.env.ENABLE_BALANCE_QUERY,
    // disableFastLink: !!process.env.DISABLE_FAST_LINK,
    // // customModels,

    onegptUri: process.env.ONEGPT_URI,
    getAccessCodeUri: process.env.GET_ACCESS_CODE_URI,
    onegptLoginUri: process.env.ONEGPT_LOGIN_URI,
    onegptUserInfoUri: process.env.ONEGPT_USER_INFO_URI,
    onegptModelListUri: process.env.ONEGPT_MODEL_LIST_URI,
  };
};
