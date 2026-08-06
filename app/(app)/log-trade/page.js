"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/Toast";
import { toISODate } from "@/lib/utils";
import StepIndicator from "@/components/log-trade/StepIndicator";
import UploadStep from "@/components/log-trade/UploadStep";
import ReviewStep from "@/components/log-trade/ReviewStep";
import DescriptionStep from "@/components/log-trade/DescriptionStep";

function blankTrade() {
  return {
    date: toISODate(new Date()),
    stock_name: "",
    exchange: "NSE",
    quantity: "",
    buy_avg_price: "",
    sell_avg_price: "",
    ltp: "",
    gross_pnl: "",
    target_price: "",
    stop_loss_price: "",
    entry_time: "",
    exit_time: "",
  };
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      const base64 = result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function LogTradePage() {
  const router = useRouter();
  const toast = useToast();

  const [step, setStep] = useState(1);
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [base64, setBase64] = useState(null);
  const [mimeType, setMimeType] = useState(null);
  const [extracting, setExtracting] = useState(false);

  const [trades, setTrades] = useState([]);
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const handleFileSelect = useCallback(async (selectedFile) => {
    if (!selectedFile) {
      setFile(null);
      setPreviewUrl(null);
      setBase64(null);
      setMimeType(null);
      return;
    }
    setFile(selectedFile);
    setPreviewUrl(URL.createObjectURL(selectedFile));
    setMimeType(selectedFile.type);
    try {
      const b64 = await fileToBase64(selectedFile);
      setBase64(b64);
    } catch (err) {
      toast.error("Could not read the image file. Please try again.");
    }
  }, [toast]);

  async function handleExtract() {
    if (!base64 || !mimeType) return;
    setExtracting(true);
    try {
      const res = await fetch("/api/extract-trade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64, mimeType }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Could not extract trade data. Enter details manually.");
        setTrades([blankTrade()]);
        setStep(2);
        return;
      }

      const extracted = (data.trades || []).map((t) => ({
        date: toISODate(new Date()),
        stock_name: t.stock_name || "",
        exchange: t.exchange || "NSE",
        quantity: t.quantity ?? "",
        buy_avg_price: t.buy_avg_price ?? "",
        sell_avg_price: t.sell_avg_price ?? "",
        ltp: t.ltp ?? "",
        gross_pnl: t.gross_pnl ?? "",
        target_price: "",
        stop_loss_price: "",
        entry_time: t.entry_time || "",
        exit_time: t.exit_time || "",
      }));

      setTrades(extracted.length > 0 ? extracted : [blankTrade()]);
      setStep(2);
    } catch (err) {
      toast.error("Something went wrong. Please try again.");
      setTrades([blankTrade()]);
      setStep(2);
    } finally {
      setExtracting(false);
    }
  }

  function handleSkipToManual() {
    setTrades([blankTrade()]);
    setStep(2);
  }

  function handleChangeTrade(index, updated) {
    setTrades((prev) => prev.map((t, i) => (i === index ? updated : t)));
  }

  async function handleSave() {
    setSaving(true);
    try {
      let sharedScreenshotUrl = null;
      for (let i = 0; i < trades.length; i++) {
        const trade = trades[i];
        const payload = {
          trade,
          description,
        };
        if (sharedScreenshotUrl) {
          payload.screenshot_url = sharedScreenshotUrl;
        } else if (base64 && mimeType) {
          payload.screenshot = { base64, mimeType };
        }

        const res = await fetch("/api/analyse-trade", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Something went wrong. Please try again.");
        }

        if (!sharedScreenshotUrl && data.trade?.screenshot_url) {
          sharedScreenshotUrl = data.trade.screenshot_url;
        }
      }

      toast.success(
        trades.length > 1 ? `${trades.length} trades saved successfully` : "Trade saved successfully"
      );
      router.push("/");
    } catch (err) {
      toast.error(err.message || "Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <StepIndicator step={step} />

      {step === 1 && (
        <UploadStep
          previewUrl={previewUrl}
          onFileSelect={handleFileSelect}
          onExtract={handleExtract}
          onSkipToManual={handleSkipToManual}
          extracting={extracting}
        />
      )}

      {step === 2 && (
        <ReviewStep
          trades={trades}
          onChangeTrade={handleChangeTrade}
          onNext={() => setStep(3)}
        />
      )}

      {step === 3 && (
        <DescriptionStep
          description={description}
          onChange={setDescription}
          onSubmit={handleSave}
          saving={saving}
        />
      )}
    </div>
  );
}
