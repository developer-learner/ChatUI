import {
  StoreKey,
} from "../constant";
import { getClientConfig } from "../config/client";
import { createPersistStore } from "../utils/store";
import { DEFAULT_CONFIG } from "./config";
import { getModelProvider } from "../utils/model";

let fetchState = 0; // 0 not fetch, 1 fetching, 2 done

const DEFAULT_ACCESS_STATE = {
  accessCode: "",
  useCustomConfig: false,

  // single local endpoint
  openaiUrl: "http://localhost:8000/v1",
  openaiApiKey: "none",

  // tavily search
  tavilyApiKey: "",
  webSearchEnabled: false,
};

export const useAccessStore = createPersistStore(
  { ...DEFAULT_ACCESS_STATE },

  (set, get) => ({
    enabledAccessControl() {
      this.fetch();
      return get().needCode;
    },
    isAuthorized() {
      this.fetch();
      return true;
    },
    fetch() {
      if (fetchState > 0 || getClientConfig()?.buildMode === "export") return;
      fetchState = 2;
    },
  }),
  {
    name: StoreKey.Access,
    version: 3,
    migrate(persistedState, version) {
      return persistedState as any;
    },
  },
);
