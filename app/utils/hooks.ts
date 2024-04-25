import { useMemo } from "react";
import { useLLMStore } from "../store/llm";
import { getLang } from "../locales";

export function useAllModels() {
  
  const llmStore = useLLMStore();
  const models = useMemo(() => {
    return llmStore.getModels(getLang());
  }, [llmStore]);

  return models;
}
