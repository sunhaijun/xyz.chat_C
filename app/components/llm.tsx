import { useNavigate } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";

import { IconButton } from "./button";
import { ErrorBoundary } from "./error";

import styles from "./llm.module.scss";

import AddIcon from "../icons/add.svg";
import CloseIcon from "../icons/close.svg";
import EyeIcon from "../icons/eye.svg";
import EyeOffIcon from "../icons/eye-off.svg";

import Locale, { getLang } from "../locales";
import { useLLMStore, useChatStore, useAccessStore } from "../store";
import { LLMModel } from "../client/api";
import { Path } from "../constant";

import {
    Select,
    showToast,
} from "./ui-lib";

import { Avatar } from "./emoji";


export function LLMPage() {
    const navigate = useNavigate();
    const chatStore = useChatStore();
    const session = chatStore.currentSession();
    const accessStore = useAccessStore();
    const uri = accessStore.onegptModelListUri;

    const llmStore = useLLMStore();
    // 加载本地模型列表
    const [llmList, setLlmList] = useState(llmStore.getModels(getLang()));
    // 尝试从服务端获取模型列表
    useEffect(() => {
        // 尝试从服务端获取模型列表
        llmStore.fetchModels(getLang(), uri).then(() => {
            // 重新加载本地模型列表
            setLlmList(llmStore.getModels(getLang()));
        });
    }, []);

    const [searchLLMs, setSearchLLMs] = useState<LLMModel[]>([]);
    const [searchText, setSearchText] = useState("");
    const [filterProvider, setFilterProvider] = useState<string>();

    const llms = useMemo(() => {
        let models = searchText.length > 0 ? searchLLMs : llmList;
        if (filterProvider) {
            models = models.filter(m => m.provider === filterProvider);
        }
        return models;
    }, [searchLLMs, llmList, searchText, filterProvider]);

    // useMemo, 从llms获取去重后的provider数组
    const providers = useMemo(() => {
        const providerMap = new Map<string, string>();
        llmList.forEach((m) => providerMap.set(m.provider, m.provider));
        return Array.from(providerMap.values());
    }, [llmList]);

    // 检索模型
    const onSearch = (text: string) => {
        setSearchText(text);
        if (text.length > 0) {
            let result = llmStore.searchModels(getLang(), text);
            if (filterProvider) {
                result = result.filter(m => m.provider === filterProvider);
            }
            setSearchLLMs(result);
        } else {
            setSearchLLMs(llmList);
        }
    };

    // 设置模型收藏状态
    const setFavoriteModel = (name: string, favorite: boolean) => {
        llmStore.setFavoriteModel(name, favorite);
    }

    return (
        <ErrorBoundary>
            <div className={styles["llm-page"]}>
                <div className="window-header">
                    <div className="window-header-title">
                        <div className="window-header-main-title">
                        {Locale.LLM.Page.Title}
                        </div>
                        <div className="window-header-submai-title">
                        {Locale.LLM.Page.SubTitle(llmList.length)}
                        </div>
                    </div>

                    <div className="window-actions">
                        <div className="window-action-button">
                            <IconButton
                                icon={<CloseIcon />}
                                bordered
                                onClick={() => navigate(-1)}
                            />
                        </div>
                    </div>
                </div>

                <div className={styles["llm-page-body"]}>
                    <div className={styles["llm-filter"]}>
                        <input
                            type="text"
                            className={styles["search-bar"]}
                            placeholder={Locale.LLM.Page.Search}
                            autoFocus
                            onInput={(e) => onSearch(e.currentTarget.value)}
                        />
                        <Select
                            className={styles["llm-filter-provider"]}
                            value={filterProvider ?? Locale.LLM.Page.AllProviders}
                            onChange={(e) => {
                                const value = e.currentTarget.value;
                                if (value === Locale.LLM.Page.AllProviders) {
                                    setFilterProvider(undefined);
                                } else {
                                    setFilterProvider(value as string);
                                }
                            }}
                        >
                            <option key="all" value={Locale.LLM.Page.AllProviders}>
                                {Locale.LLM.Page.AllProviders}
                            </option>
                            {providers.map((p) => (
                                <option value={p} key={p}>
                                    {p}
                                </option>
                            ))}
                        </Select>
                        
                    </div>

                    <div>
                        {llms.map((m) => (
                            <div className={styles["llm-item"]} key={m.name}>
                                <div className={styles["llm-icon"]}>
                                    <Avatar model={m.name} />
                                </div>
                                <div className={styles["llm-header"]}>
                                    <div className={styles["llm-title"]}>
                                        <div className={styles["llm-name"] + (session.mask.modelConfig.model === m.name ? ' ' + styles['llm-selected-color'] : '') + (!m.favorite ? ' ' + styles['llm-list-included'] : '')}>
                                            {`${m.displayName} (${m.provider})`}
                                        </div>
                                        <div className={styles["llm-info"]}>
                                            {m.description}
                                        </div>
                                        <div className={styles["llm-footer"]}>
                                        {Locale.LLM.Page.ContextWindow((m.contextWindow ? m.contextWindow.toString() + 'K' : '-'))}
                                        </div>
                                    </div>
                                </div>
                                <div className={styles["llm-actions"]}>
                                    {session.mask.modelConfig.model !== m.name && (
                                        <IconButton
                                            icon={<AddIcon />}
                                            text={Locale.LLM.Page.SelectModel}
                                            onClick={() => {
                                                // Select current model
                                                chatStore.updateCurrentSession((session) => {
                                                    session.mask.modelConfig.model = m.name;
                                                    session.mask.syncGlobalConfig = false;
                                                });
                                                showToast(m.displayName);
                                                navigate(Path.Chat);
                                            }}
                                        />
                                    )}
                                    
                                    <IconButton
                                        icon={m.favorite ? <EyeIcon /> : <EyeOffIcon />}
                                        text={m.favorite ? Locale.LLM.Page.Unfavorite : Locale.LLM.Page.Favorite}
                                        onClick={() => setFavoriteModel(m.name, !m.favorite)}
                                        />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </ErrorBoundary>
    );

}