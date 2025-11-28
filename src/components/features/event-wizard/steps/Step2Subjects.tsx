"use client";

/**
 * Step 2: 投票候補の追加
 * @module event-wizard/steps/Step2Subjects
 */

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Plus, Trash2 } from "lucide-react";
import type { SubjectInput } from "@/lib/actions/event";
import { useEventWizard } from "../EventWizardContext";

/**
 * 投票候補追加ステップコンポーネント
 * 投票対象となる選択肢を追加・管理
 */
export function Step2Subjects() {
  const t = useTranslations("event.create");
  const { subjects, setSubjects, generalError } = useEventWizard();

  // 新規追加用の入力状態
  const [newSubject, setNewSubject] = useState<SubjectInput>({
    title: "",
    description: "",
    url: "",
  });

  /**
   * 投票候補を追加
   */
  const addSubject = () => {
    if (!newSubject.title.trim()) return;
    setSubjects((prev) => [...prev, { ...newSubject }]);
    setNewSubject({ title: "", description: "", url: "" });
  };

  /**
   * 投票候補を削除
   */
  const removeSubject = (index: number) => {
    setSubjects((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      {generalError && (
        <div className="border-destructive/50 bg-destructive/10 text-destructive rounded-md border p-4 text-sm">
          {generalError}
        </div>
      )}

      <p className="text-muted-foreground">{t("wizard.stepDescription2")}</p>

      {/* 既存の候補一覧 */}
      {subjects.length > 0 ? (
        <div className="space-y-3">
          {subjects.map((subject, index) => (
            <div
              key={index}
              className="bg-card flex items-center justify-between rounded-lg border p-4"
            >
              <div>
                <p className="font-medium">{subject.title}</p>
                {subject.description && (
                  <p className="text-muted-foreground text-sm">
                    {subject.description}
                  </p>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeSubject(index)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-muted-foreground rounded-lg border border-dashed p-8 text-center">
          {t("wizard.noSubjects")}
        </div>
      )}

      {/* 新規追加フォーム */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">{t("wizard.addSubject")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>{t("wizard.subjectTitle")} *</Label>
            <Input
              value={newSubject.title}
              onChange={(e) =>
                setNewSubject((prev) => ({ ...prev, title: e.target.value }))
              }
              placeholder={t("wizard.subjectTitlePlaceholder")}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addSubject();
                }
              }}
            />
          </div>
          <div className="space-y-2">
            <Label>{t("wizard.subjectDescription")}</Label>
            <Textarea
              value={newSubject.description}
              onChange={(e) =>
                setNewSubject((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              placeholder={t("wizard.subjectDescriptionPlaceholder")}
              rows={2}
            />
          </div>
          <div className="space-y-2">
            <Label>{t("wizard.subjectUrl")}</Label>
            <Input
              value={newSubject.url}
              onChange={(e) =>
                setNewSubject((prev) => ({ ...prev, url: e.target.value }))
              }
              placeholder={t("wizard.subjectUrlPlaceholder")}
              type="url"
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={addSubject} disabled={!newSubject.title.trim()}>
            <Plus className="size-4" />
            {t("wizard.addSubject")}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
