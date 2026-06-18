"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Sparkles, Zap, ArrowLeft } from "lucide-react";
import Link from "next/link";
import Script from "next/script";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function PricingPage() {
  const handleRazorpay = async () => {
    if (typeof window === "undefined" || !(window as any).Razorpay) {
      alert("Razorpay SDK failed to load. Are you online?");
      return;
    }

    const options = {
      key: "rzp_test_dummykey", // Enter the Key ID generated from the Dashboard
      amount: "10000", // Amount is in currency subunits. Default currency is INR. Hence, 10000 refers to 100 INR
      currency: "INR",
      name: "Zero Inbox",
      description: "Upgrade to Pro Subscription",
      handler: function (response: any) {
        alert(
          "Payment successful! Payment ID: " + response.razorpay_payment_id,
        );
      },
      prefill: {
        name: "User",
        email: "user@example.com",
      },
      theme: {
        color: "#6366f1",
      },
    };
    const rzp = new (window as any).Razorpay(options);
    rzp.open();
  };

  return (
    <div className="bg-background relative min-h-screen overflow-hidden pt-24 pb-16">
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="lazyOnload"
      />

      {/* Back Button */}
      <div className="absolute top-8 left-8 z-50">
        <Link href="/dashboard">
          <Button variant="ghost" className="gap-2">
            <ArrowLeft size={16} /> Back to Dashboard
          </Button>
        </Link>
      </div>

      {/* Background Gradients */}
      <div className="absolute inset-0 z-0">
        <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-indigo-500/10 blur-[100px]" />
        <div className="absolute top-40 -left-40 h-96 w-96 rounded-full bg-rose-500/10 blur-[100px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-5xl px-6">
        <div className="text-center">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex justify-center"
          >
            <Badge
              variant="outline"
              className="mb-6 rounded-full border-indigo-500/30 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
            >
              <Sparkles size={12} className="mr-2" /> Upgrade your workflow
            </Badge>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="text-4xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl"
          >
            Pricing that scales <br className="hidden sm:block" />
            <span className="bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
              with your team.
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="text-muted-foreground mx-auto mt-6 max-w-2xl text-lg sm:text-xl"
          >
            Transparent, predictable pricing. No hidden fees. Empower your team
            with our suite of AI-driven automation tools.
          </motion.p>
        </div>

        <div className="mt-20 flex flex-col items-center justify-center gap-8 md:flex-row md:items-stretch">
          {/* Free Tier */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-card dark:bg-card/50 relative flex w-full max-w-sm flex-col rounded-3xl p-8 shadow-sm backdrop-blur-xl transition-shadow hover:shadow-md"
          >
            <div className="mb-6">
              <h2 className="text-2xl font-bold">Free</h2>
              <p className="text-muted-foreground mt-2 text-sm">
                Perfect for individuals just getting started with AI automation.
              </p>
            </div>
            <div className="mb-6 flex items-baseline gap-1">
              <span className="text-5xl font-extrabold tracking-tight">$0</span>
              <span className="text-muted-foreground text-sm font-medium">
                /forever
              </span>
            </div>
            <ul className="mb-8 flex-1 space-y-4">
              {[
                "1,000 AI Triage Actions/mo",
                "Basic Calendar Sync",
                "Standard Email Replies",
                "Community Support",
              ].map((feature) => (
                <li key={feature} className="flex items-center gap-3 text-sm">
                  <CheckCircle2 size={16} className="text-muted-foreground" />
                  <span className="text-muted-foreground">{feature}</span>
                </li>
              ))}
            </ul>
            <Link href="/dashboard" className="w-full">
              <Button
                variant="outline"
                size="lg"
                className="border-border/60 w-full rounded-2xl"
              >
                Get Started Free
              </Button>
            </Link>
          </motion.div>

          {/* Pro Tier */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="group relative w-full max-w-sm"
          >
            {/* Glowing gradient background */}
            <div className="absolute -inset-[2px] rounded-3xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 opacity-75 blur-md transition-opacity duration-500 group-hover:opacity-100" />

            <div className="bg-background relative flex h-full flex-col rounded-3xl p-8 sm:p-10">
              <div className="absolute inset-x-0 -top-4 flex justify-center">
                <span className="flex items-center gap-1 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 px-4 py-1 text-xs font-bold tracking-wider text-white uppercase shadow-lg">
                  <Zap size={12} className="fill-white" /> Most Popular
                </span>
              </div>
              <div className="mt-2 mb-6">
                <h2 className="text-foreground text-2xl font-bold">Pro</h2>
                <p className="text-muted-foreground mt-2 text-sm">
                  For founders and power users who need unrestricted access.
                </p>
              </div>
              <div className="mb-6 flex items-baseline gap-1">
                <span className="text-foreground text-5xl font-extrabold tracking-tight">
                  ₹100
                </span>
                <span className="text-muted-foreground text-sm font-medium">
                  /mo
                </span>
              </div>
              <ul className="mb-8 flex-1 space-y-4">
                {[
                  "Unlimited AI Actions",
                  "Realtime Webhooks",
                  "Advanced Custom Prompts",
                  "Keyboard Shortcuts",
                  "Priority Support 24/7",
                ].map((feature) => (
                  <li key={feature} className="flex items-center gap-3 text-sm">
                    <CheckCircle2 size={16} className="text-indigo-500" />
                    <span className="text-foreground font-medium">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>
              <Button
                size="lg"
                onClick={handleRazorpay}
                className="w-full rounded-2xl bg-indigo-600 text-white shadow-md transition-all hover:bg-indigo-700 hover:shadow-lg"
              >
                Upgrade to Pro
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
