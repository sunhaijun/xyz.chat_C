import { createPersistStore } from "../utils/store";
import { LLMModel } from "../client/api";
import { StoreKey, DEFAULT_MODELS, MODEL_LIST_VERSION } from "../constant";
import axios from "axios";

// LLM模型列表
type LLMState = {
    models: Record<string, LLMModel[]>,
    version: string
};

// 默认状态
const DEFAULT_STATE: LLMState = {
    models: {},
    version: MODEL_LIST_VERSION
};

export const useLLMStore = createPersistStore(
    DEFAULT_STATE,
    (set, get) => ({
        // 从服务端获取模型列表数据（如果失败，使用默认模型列表）
        async fetchModels(lang: string = 'en', uri: string) {
            try {
                const version = useLLMStore.getState().version;
                const response = await axios.get(`${uri}?lang=${lang}&version=${version}`);
                if (response.status === 200) {
                    set((state: LLMState) => {
                        return { ...state, models: { ...state.models, [lang]: response.data.data as LLMModel[] }, version: response.data.version };
                    });
                } else if (response.status === 204) {
                    console.warn("No model data returned from server");
                }
            } catch (error) {
                console.error("Failed to fetch models", error);
                set((state: LLMState) => {
                    return state;
                });
            }
        },
        // 直接获取本地模型列表数据
        getModels(lang: string = 'en') {
            return useLLMStore.getState().models[lang] || DEFAULT_MODELS;
        },
        // 获取指定lang及name的模型信息
        getModel(lang: string = 'en', name: string) {
            const models = useLLMStore.getState().models[lang] || DEFAULT_MODELS;
            return models.find((model) => model.name === name);
        },
        // 获取指定lang及provider的模型信息
        getProviderModels(lang: string = 'en', provider: string) {
            const models = useLLMStore.getState().models[lang] || DEFAULT_MODELS;
            return models.filter((model) => model.provider === provider);
        },
        // 获取指定语言及name的模型的displayName
        getModelDisplayName(lang: string = 'en', name: string) {
            const model = useLLMStore.getState().models[lang]?.find((model) => model.name === name);
            return model?.displayName || name;
        },
        // 模糊检索指定lang及displayName的模型信息
        searchModels(lang: string = 'en', displayName: string) {
            const models = useLLMStore.getState().models[lang] || DEFAULT_MODELS;
            return models.filter((model) => model.displayName.toLowerCase().includes(displayName.toLowerCase()));
        },
        // 通过指定name及favorite标记，设置所有语言的模型favorite状态
        setFavoriteModel(name: string, favorite: boolean) {
            set((state: LLMState) => {
                const models = { ...state.models };
                Object.keys(models).forEach((lang) => {
                    const model = models[lang].find((model) => model.name === name);
                    if (model) {
                        model.favorite = favorite;
                    }
                });
                return { ...state, models };
            });
        },
        
        // 重置本地模型列表数据
        clearAllData() {
            set(() => DEFAULT_STATE);
        }
    }),
    {
        name: StoreKey.LLM,
        version: 1.0,
        migrate(state, version) {
            // migrate data if needed
            return state as any;
        },
    }
);