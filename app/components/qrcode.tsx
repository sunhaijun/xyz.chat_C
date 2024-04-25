import { useState, useEffect, useMemo, use } from "react";

import { Modal } from "./ui-lib";
import Locale from "../locales";

import {
    useUpdateStore,
  } from "../store";

  export function QRCodeModal(props: { onClose: () => void }) {
    const updateStore = useUpdateStore();
    const referrerId = updateStore.getUserInfo().referrerId

    console.log("referrerId:", referrerId);

    // 生成 qrCodeString
    const qrCodeString = useMemo(() => {
        if (!referrerId || referrerId.trim() === "") {
            return "https://onedollargpt.com";
        } else {
            return `https://onedollargpt.com/?ref=${referrerId}`;
        }
    }, [referrerId]);

    // 二维码和加载状态
    const [qrCode, setQrCode] = useState("");
    const [loading, setLoading] = useState(false);

    // 当 qrCodeString 更改时，检查 localStorage 并可能调用外部 API 服务生成二维码
    useEffect(() => {
        const cachedQrCode = localStorage.getItem(qrCodeString);
        if (cachedQrCode) {
            setQrCode(cachedQrCode);
        } else {
            setLoading(true);
            fetch(`https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(qrCodeString)}`)
                .then(response => response.blob())
                .then(blob => {
                    const reader = new FileReader();
                    reader.onloadend = function() {
                        const base64data = reader.result;
                        setQrCode(base64data as string);
                        localStorage.setItem(qrCodeString, base64data as string);
                        setLoading(false);
                    }
                    reader.readAsDataURL(blob);
                });
        }
    }, [qrCodeString]);

    return (
      <div className="modal-mask">
        <Modal
          title={Locale.ShareQRCode.Title}
          onClose={props.onClose}
          footer={
            <div
              style={{
                width: "100%",
                textAlign: "center",
                fontSize: 14,
                opacity: 0.75,
              }}
            >
              {Locale.ShareQRCode.Description}
            </div>
          }
        >
          <div style={{ minHeight: "40vh" }}>
            <div style={{ textAlign: "center" }}>
              {loading ? <div>Loading...</div> : <img src={qrCode} alt="QR Code" />}
              <div>{qrCodeString}</div>
            </div>
          </div>
        </Modal>
      </div>
    );
  }