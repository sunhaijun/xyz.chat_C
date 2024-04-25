import { StoreKey } from "../constant";
import axios from "axios";
import { createPersistStore } from "../utils/store";

const ONE_MINUTE = 60 * 1000;

export const useUpdateStore = createPersistStore(
  {
    userName: "",
    email: "",
    referrerId: "",
    userStatus: "",
    planName: "",
    planType: "",
    balance: 0,
    freeCredits: 0,
    prepaidCredits: 0,
    monthlyCredits: 0,
    lastUpdateUserInfo: 0,
  },
  (set, get) => ({
    // 重置用户信息
    resetUserInfo() {
      set(() => ({
        userName: "",
        email: "",
        referrerId: "",
        userStatus: "",
        planName: "",
        planType: "",
        balance: 0,
        freeCredits: 0,
        prepaidCredits: 0,
        monthlyCredits: 0,
      }));
    },

    // 获取用户信息
    getUserInfo() {
      return {
        userName: get().userName,
        email: get().email,
        referrerId: get().referrerId,
        userStatus: get().userStatus,
        planName: get().planName,
        planType: get().planType,
        balance: get().balance,
        freeCredits: get().freeCredits,
        prepaidCredits: get().prepaidCredits,
        monthlyCredits: get().monthlyCredits,
      };
    },

    // 直接更新用户信息
    updateUserInfoDirectly(userInfo: {
      userName: string;
      email: string;
      referrerId: string;
      userStatus: string;
      planType: string;
      balance: number;
      freeCredits: number;
      prepaidCredits: number;
      monthlyCredits: number;
    }) {
      // 更新用户信息
      set(() => ({
        lastUpdateUserInfo: Date.now(), // 更新最后一次更新用户信息的时间
        
        userName: userInfo.userName,
        email: userInfo.email,
        referrerId: userInfo.referrerId,
        userStatus: userInfo.userStatus,
        planType: userInfo.planType,
        balance: userInfo.balance,
        freeCredits: userInfo.freeCredits,
        prepaidCredits: userInfo.prepaidCredits,
        monthlyCredits: userInfo.monthlyCredits,
      }));
    },

    // 从服务器获取最新用户信息
    async updateUserInfo(getUserInfoUri: string, token: string, force = false) {
      const overOneMinute = Date.now() - get().lastUpdateUserInfo >= ONE_MINUTE;
      if (!overOneMinute && !force) return;

      // 更新最后一次更新用户信息的时间
      set(() => ({
        lastUpdateUserInfo: Date.now(),
      }));

      try {
        const response = await axios.get(getUserInfoUri, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        const bodyData = response.data;
        if (bodyData.status === "success") {
          set(() => ({
            userName: bodyData.data.name,
            email: bodyData.data.email,
            referrerId: bodyData.data.referrer_id,
            userStatus: bodyData.data.status,
            planName: bodyData.data.plan_name,
            planType: bodyData.data.plan_type,
            balance: bodyData.data.balance,
            freeCredits: bodyData.data.credits_free,
            prepaidCredits: bodyData.data.credits_prepaid,
            monthlyCredits: bodyData.data.credits_monthly,
          }));
        } else {
          throw new Error(bodyData.message);
        }
      } catch (e) {
        console.error((e as Error).message);
      }
    },
  }),
  {
    name: StoreKey.Update,
    version: 1,
  },
);
