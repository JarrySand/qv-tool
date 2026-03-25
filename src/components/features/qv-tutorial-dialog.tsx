"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const STORAGE_KEY = "qv-tutorial-seen";

interface QvTutorialDialogProps {
  totalCredits: number;
  alwaysShow?: boolean;
}

export function QvTutorialDialog({
  totalCredits,
  alwaysShow,
}: QvTutorialDialogProps) {
  const t = useTranslations("vote.tutorial");
  const tCommon = useTranslations("common");

  const [open, setOpen] = useState(() => {
    if (alwaysShow) return true;
    if (typeof window === "undefined") return false;
    return !localStorage.getItem(STORAGE_KEY);
  });
  const [step, setStep] = useState<"ask" | 1 | 2 | 3>("ask");

  const handleClose = () => {
    if (!alwaysShow) {
      localStorage.setItem(STORAGE_KEY, "true");
    }
    setOpen(false);
  };

  const handleYes = () => {
    setStep(1);
  };

  const handleNext = () => {
    if (step === 1) setStep(2);
    else if (step === 2) setStep(3);
    else handleClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-md">
        {step === "ask" && (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl">{t("askTitle")}</DialogTitle>
              <DialogDescription>{t("askDescription")}</DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex-row gap-2 sm:justify-center">
              <Button onClick={handleYes} className="flex-1">
                {t("yes")}
              </Button>
              <Button
                variant="outline"
                onClick={handleClose}
                className="flex-1"
              >
                {t("no")}
              </Button>
            </DialogFooter>
          </>
        )}

        {step === 1 && (
          <>
            <DialogHeader>
              <div className="bg-primary/10 text-primary mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full text-2xl font-bold">
                1
              </div>
              <DialogTitle className="text-center text-xl">
                {t("step1Title")}
              </DialogTitle>
              <DialogDescription className="text-center">
                {t("step1Description")}
              </DialogDescription>
            </DialogHeader>
            <div className="bg-muted rounded-lg p-4">
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span>1票</span>
                  <span className="font-mono font-semibold">
                    1² = 1 {t("credit")}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>2票</span>
                  <span className="font-mono font-semibold">
                    2² = 4 {t("credits")}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>3票</span>
                  <span className="font-mono font-semibold">
                    3² = 9 {t("credits")}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>4票</span>
                  <span className="font-mono font-semibold">
                    4² = 16 {t("credits")}
                  </span>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleNext} className="w-full">
                {tCommon("next")}
              </Button>
            </DialogFooter>
          </>
        )}

        {step === 2 && (
          <>
            <DialogHeader>
              <div className="bg-primary/10 text-primary mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full text-2xl font-bold">
                2
              </div>
              <DialogTitle className="text-center text-xl">
                {t("step2Title")}
              </DialogTitle>
              <DialogDescription className="text-center">
                {t("step2Description", { credits: totalCredits })}
              </DialogDescription>
            </DialogHeader>
            <div className="bg-muted rounded-lg p-4">
              <p className="mb-3 text-sm">{t("step2Example")}</p>
              <div className="space-y-2 text-sm">
                <div>
                  <div>{t("step2OptionA")}</div>
                  <div className="text-muted-foreground font-mono text-xs">
                    6票 → 36 {t("credits")}
                  </div>
                </div>
                <div>
                  <div>{t("step2OptionB")}</div>
                  <div className="text-muted-foreground font-mono text-xs">
                    5票 → 25 {t("credits")}
                  </div>
                </div>
                <div>
                  <div>{t("step2OptionC")}</div>
                  <div className="text-muted-foreground font-mono text-xs">
                    4票 → 16 {t("credits")}
                  </div>
                </div>
                <div className="border-t pt-2 font-semibold">
                  {t("step2Total")}: 77 / 100 {t("credits")}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleNext} className="w-full">
                {tCommon("next")}
              </Button>
            </DialogFooter>
          </>
        )}

        {step === 3 && (
          <>
            <DialogHeader>
              <div className="bg-primary/10 text-primary mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full text-2xl font-bold">
                3
              </div>
              <DialogTitle className="text-center text-xl">
                {t("step3Title")}
              </DialogTitle>
            </DialogHeader>
            <div className="bg-muted space-y-2 rounded-lg p-4 text-sm">
              <p>・{t("step3Tip1")}</p>
              <p>・{t("step3Tip2")}</p>
              <p>・{t("step3Tip3")}</p>
            </div>
            <DialogFooter>
              <Button onClick={handleClose} className="w-full">
                {t("startVoting")}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
