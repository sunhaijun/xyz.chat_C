import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

import styles from "./auth.module.scss";
import { IconButton } from "./button";

import { Path } from "../constant";
import { useAccessStore, useUpdateStore } from "../store";
import Locale from "../locales";

import LogoIcon from "../icons/logo.svg";

const emailIsValid = (email: string) => {
  const re =
    /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
};

export function AuthPage() {
  const navigate = useNavigate();
  const accessStore = useAccessStore();
  const updateStore = useUpdateStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [onegptUri, setOnegptUri] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setOnegptUri(accessStore.onegptUri + "/register");
  }, [accessStore.onegptUri]);

  const resetAccessCode = () => {
    accessStore.update((access) => {
      access.rpsEndPoint = "";
      access.authToken = "";
    });
  };

  const signIn = async () => {
    if (!emailIsValid(email) || password.length < 6) {
      setError(Locale.Auth.Error.SignInError);
      return;
    }

    setLoading(true);
    setError("");

    interface AxiosError extends Error {
      response?: {
        status: number;
      };
    }

    try {
      const uri = accessStore.onegptLoginUri;
      const response = await axios.post(
        uri,
        { email, password },
        { timeout: 5000 },
      );
      const bodyData = response.data;

      if (bodyData.status === "success") {
        console.log("rps:", bodyData.data.rps);
        accessStore.update((access) => {
          access.rpsEndPoint = bodyData.data.rps;
          access.authToken = bodyData.data.access_token;
        });

        // 更新本地用户信息
        updateStore.updateUserInfoDirectly(
          {
            userName: bodyData.data.name,
            email: bodyData.data.email,
            referrerId: bodyData.data.referrer_id,
            userStatus: bodyData.data.status,
            planType: bodyData.data.plan_type,
            balance: bodyData.data.balance,
            freeCredits: bodyData.data.available_credits_free,
            prepaidCredits: bodyData.data.available_credits_prepaid,
            monthlyCredits: bodyData.data.available_credits_monthly,
          }
        )

        navigate(Path.Chat);
      } else {
        throw new Error(bodyData.message);
      }
    } catch (err) {
      const axiosError = err as AxiosError;
      if (axiosError.response) {
        console.log(axiosError.response.status);
        if (axiosError.response.status === 401) {
          setError(Locale.Auth.Error.SignInError);
          return;
        }
      }

      setError("Error: " + (err as Error).message);
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  // 如果处于登录状态，提示用户是否要退出登录，或者直接跳转到HOME页面
  if (accessStore.isAuthorized()) {
    return (
      <div className={styles["auth-page"]}>
        <div className={`no-dark ${styles["auth-logo"]}`}>
          <LogoIcon />
        </div>

        <div className={styles["auth-title"]}>
          {Locale.Auth.AlreadyLoginTitle}
        </div>
        <div className={styles["auth-tips"]}>
          {Locale.Auth.AlreadyLoginTips}
        </div>

        <div className={styles["auth-actions"]}>
          <IconButton
            type="danger"
            text={Locale.UI.SignOut}
            onClick={() => {
              resetAccessCode();
              navigate(Path.Auth);
            }}
          />
          <IconButton
            type="primary"
            text={Locale.Auth.Return}
            onClick={() => {
              navigate(Path.Chat);
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={styles["auth-page"]}>
      <div className={`no-dark ${styles["auth-logo"]}`}>
        <LogoIcon />
      </div>

      <div className={styles["auth-title"]}>{Locale.Auth.Title}</div>

      <input
        className={styles["auth-input"]}
        type="text"
        value={email}
        placeholder={Locale.Auth.Email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        className={styles["auth-input"]}
        type="password"
        value={password}
        placeholder={Locale.Auth.Password}
        onChange={(e) => setPassword(e.target.value)}
      />

      {error && <div style={{ color: "red" }}>{error}</div>}

      <div className={styles["auth-actions"]}>
        <IconButton
          text={Locale.UI.SignIn}
          type="primary"
          onClick={signIn}
          disabled={!emailIsValid(email) || password.length < 6 || loading}
        />
        <IconButton
          text={Locale.UI.SingUp}
          onClick={() => {
            window.location.href = onegptUri;
          }}
        />
        <IconButton
          text={Locale.Auth.Later}
          onClick={() => {
            navigate(Path.Home);
          }}
        />
      </div>

      <div className={styles["auth-footer"]}>
        <a href={onegptUri} target="_blank" rel="noopener noreferrer">
          {Locale.Auth.Footer}
        </a>
      </div>
    </div>
  );
}
