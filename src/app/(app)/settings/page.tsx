"use client";

import { useState } from "react";
import { Bot, Palette } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function SettingsPage() {
  const [aggressiveTriage, setAggressiveTriage] = useState(true);
  const [toneMatching, setToneMatching] = useState(true);
  const [focusMode, setFocusMode] = useState(true);
  const [soundEffects, setSoundEffects] = useState(false);

  const playPop = () => {
    try {
      const AudioContext =
        window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const audioCtx = new AudioContext();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(800, audioCtx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(
        150,
        audioCtx.currentTime + 0.1,
      );

      gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        audioCtx.currentTime + 0.1,
      );

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.1);
    } catch {
      // Ignore audio errors
    }
  };

  const handleToggle = (
    setter: React.Dispatch<React.SetStateAction<boolean>>,
    currentValue: boolean,
  ) => {
    playPop();
    setter(!currentValue);
  };

  return (
    <div className="bg-background h-full overflow-y-auto p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-4xl space-y-8">
        <div>
          <h1 className="mb-2 text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Manage your workspace preferences, automation rules, and AI
            behaviors.
          </p>
        </div>

        <div className="grid gap-6">
          {/* Automation Profile */}
          <Card className="border-border bg-card/40 overflow-hidden shadow-sm backdrop-blur-xl transition-all hover:shadow-md">
            <div className="from-primary/5 pointer-events-none absolute inset-0 bg-gradient-to-r via-transparent to-transparent" />
            <CardHeader className="relative pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Bot className="text-primary" size={20} /> AI Agent Persona
                <Badge
                  variant="secondary"
                  className="ml-2 font-mono text-[10px]"
                >
                  ACTIVE
                </Badge>
              </CardTitle>
              <CardDescription>
                Configure how your AI responds to incoming emails.
              </CardDescription>
            </CardHeader>
            <CardContent className="relative space-y-4">
              <div className="border-border/50 bg-secondary/30 rounded-xl border p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-foreground text-sm font-medium">
                      Aggressive Triage
                    </h3>
                    <p className="text-muted-foreground mt-1 text-xs">
                      Automatically archive newsletters and promotional content.
                    </p>
                  </div>
                  <div
                    onClick={() =>
                      handleToggle(setAggressiveTriage, aggressiveTriage)
                    }
                    className={`relative flex h-5 w-9 cursor-pointer items-center rounded-full p-0.5 transition-colors duration-200 ${aggressiveTriage ? "bg-primary" : "bg-muted-foreground/30"}`}
                  >
                    <div
                      className={`bg-background h-4 w-4 rounded-full shadow-sm transition-transform duration-200 ${aggressiveTriage ? "translate-x-4" : "translate-x-0"}`}
                    />
                  </div>
                </div>
              </div>
              <div className="border-border/50 bg-secondary/30 rounded-xl border p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-foreground text-sm font-medium">
                      Tone Matching
                    </h3>
                    <p className="text-muted-foreground mt-1 text-xs">
                      AI matches the formality level of the sender in drafts.
                    </p>
                  </div>
                  <div
                    onClick={() => handleToggle(setToneMatching, toneMatching)}
                    className={`relative flex h-5 w-9 cursor-pointer items-center rounded-full p-0.5 transition-colors duration-200 ${toneMatching ? "bg-primary" : "bg-muted-foreground/30"}`}
                  >
                    <div
                      className={`bg-background h-4 w-4 rounded-full shadow-sm transition-transform duration-200 ${toneMatching ? "translate-x-4" : "translate-x-0"}`}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Preferences */}
          <Card className="border-border bg-card/40 overflow-hidden shadow-sm backdrop-blur-xl transition-all hover:shadow-md">
            <CardHeader className="relative pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Palette className="text-primary" size={20} /> Interface
                Preferences
              </CardTitle>
              <CardDescription>
                Customize your layout and visual themes.
              </CardDescription>
            </CardHeader>
            <CardContent className="relative space-y-4">
              <div className="border-border/50 bg-secondary/30 rounded-xl border p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-foreground text-sm font-medium">
                      Focus Mode Default
                    </h3>
                    <p className="text-muted-foreground mt-1 text-xs">
                      Collapse sidebar automatically on smaller screens.
                    </p>
                  </div>
                  <div
                    onClick={() => handleToggle(setFocusMode, focusMode)}
                    className={`relative flex h-5 w-9 cursor-pointer items-center rounded-full p-0.5 transition-colors duration-200 ${focusMode ? "bg-primary" : "bg-muted-foreground/30"}`}
                  >
                    <div
                      className={`bg-background h-4 w-4 rounded-full shadow-sm transition-transform duration-200 ${focusMode ? "translate-x-4" : "translate-x-0"}`}
                    />
                  </div>
                </div>
              </div>
              <div className="border-border/50 bg-secondary/30 rounded-xl border p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-foreground text-sm font-medium">
                      Sound Effects
                    </h3>
                    <p className="text-muted-foreground mt-1 text-xs">
                      Play satisfying micro-sounds on task completion.
                    </p>
                  </div>
                  <div
                    onClick={() => handleToggle(setSoundEffects, soundEffects)}
                    className={`relative flex h-5 w-9 cursor-pointer items-center rounded-full p-0.5 transition-colors duration-200 ${soundEffects ? "bg-primary" : "bg-muted-foreground/30"}`}
                  >
                    <div
                      className={`bg-background h-4 w-4 rounded-full shadow-sm transition-transform duration-200 ${soundEffects ? "translate-x-4" : "translate-x-0"}`}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
