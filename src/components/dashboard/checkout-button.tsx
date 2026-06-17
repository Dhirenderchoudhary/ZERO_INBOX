"use client";

import { useState } from "react";
import Script from "next/script";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function CheckoutButton() {
  const [isLoading, setIsLoading] = useState(false);

  const handlePayment = async () => {
    setIsLoading(true);
    try {
      // 1. Create order on the backend
      const res = await fetch("/api/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: 1000, // 10 USD/EUR etc -> 10.00 -> 1000 paise (for INR: 10 INR = 1000 paise)
          currency: "INR",
        }),
      });

      const orderData = await res.json();

      if (!res.ok) {
        throw new Error(orderData.error || "Failed to create order");
      }

      // 2. Initialize Razorpay Checkout
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Zero Inbox Pro",
        description: "Upgrade to Pro Plan",
        order_id: orderData.order_id,
        handler: async function (response: any) {
          try {
            // 3. Verify signature on the backend
            const verifyRes = await fetch("/api/verify-payment", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            const verifyData = await verifyRes.json();

            if (!verifyRes.ok) {
              throw new Error(
                verifyData.error || "Payment verification failed",
              );
            }

            toast.success("Payment successful! Welcome to Pro.");
          } catch (error: any) {
            console.error("Verification error:", error);
            toast.error(error.message || "Payment verification failed.");
          }
        },
        prefill: {
          name: "User",
          email: "user@example.com",
        },
        theme: {
          color: "#000000",
        },
      };

      const rzp = new (window as any).Razorpay(options);

      rzp.on("payment.failed", function (response: any) {
        console.error("Payment failed:", response.error);
        toast.error(`Payment failed: ${response.error.description}`);
      });

      rzp.open();
    } catch (error: any) {
      console.error("Checkout error:", error);
      toast.error(error.message || "Something went wrong during checkout.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="lazyOnload"
      />
      <Button
        className="mt-4 w-full"
        onClick={handlePayment}
        disabled={isLoading}
      >
        {isLoading ? "Processing..." : "Upgrade to Pro"}
      </Button>
    </>
  );
}
