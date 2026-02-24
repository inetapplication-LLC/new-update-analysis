"use client";

import { useState, useEffect } from "react";
import { Bell, BellOff } from "lucide-react";
import { createClient } from "@/lib/supabase/browser";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function PushNotificationToggle() {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setIsLoading(false);
      return;
    }
    setIsSupported(true);
    checkSubscription();
  }, []);

  async function checkSubscription() {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
    } catch {
      // Service worker not ready yet
    } finally {
      setIsLoading(false);
    }
  }

  async function subscribe() {
    setIsLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const keyArray = urlBase64ToUint8Array(
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
      );
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: keyArray.buffer as ArrayBuffer,
      });

      const key = subscription.getKey("p256dh");
      const auth = subscription.getKey("auth");

      if (!key || !auth) throw new Error("Missing subscription keys");

      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("push_subscriptions").upsert(
        {
          user_id: user.id,
          endpoint: subscription.endpoint,
          p256dh: btoa(String.fromCharCode(...new Uint8Array(key))),
          auth_key: btoa(String.fromCharCode(...new Uint8Array(auth))),
          user_agent: navigator.userAgent,
        },
        { onConflict: "user_id,endpoint" }
      );

      if (error) throw error;
      setIsSubscribed(true);
    } catch (err) {
      console.error("Failed to subscribe to push notifications:", err);
    } finally {
      setIsLoading(false);
    }
  }

  async function unsubscribe() {
    setIsLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        const supabase = createClient();
        await supabase
          .from("push_subscriptions")
          .delete()
          .eq("endpoint", subscription.endpoint);

        await subscription.unsubscribe();
      }

      setIsSubscribed(false);
    } catch (err) {
      console.error("Failed to unsubscribe from push notifications:", err);
    } finally {
      setIsLoading(false);
    }
  }

  if (!isSupported) return null;

  return (
    <button
      onClick={isSubscribed ? unsubscribe : subscribe}
      disabled={isLoading}
      title={isSubscribed ? "Disable notifications" : "Enable notifications"}
      className="flex items-center justify-center w-8 h-8 rounded-full bg-transparent border border-white/[0.06] text-white/35 hover:bg-white/[0.06] hover:border-white/10 hover:text-white/70 active:bg-white/10 transition-all duration-150 cursor-pointer disabled:opacity-50"
    >
      {isSubscribed ? (
        <Bell className="h-4 w-4 text-[#7abc64]" />
      ) : (
        <BellOff className="h-4 w-4" />
      )}
    </button>
  );
}
