"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  createEventWithSubjects,
  type SubjectInput,
} from "@/lib/actions/event";
import { generateAccessTokens } from "@/lib/actions/access-token";
import {
  Loader2,
  Plus,
  Trash2,
  Check,
  ChevronRight,
  ChevronLeft,
  AlertTriangle,
  Copy,
  ExternalLink,
  Lock,
} from "lucide-react";

type FormErrors = Record<string, string[]>;

type EventFormData = {
  title: string;
  description: string;
  slug: string;
  startDate: string;
  endDate: string;
  creditsPerVoter: number;
  votingMode: "individual" | "google" | "line" | "discord";
  discordGuildId: string;
  discordGuildName: string;
};

type CreatedEvent = {
  id: string;
  slug: string | null;
  title: string;
  adminToken: string;
  startDate: Date;
  endDate: Date;
  creditsPerVoter: number;
  votingMode: string;
  subjects: { id: string; title: string; description: string | null }[];
};

export function EventWizardForm() {
  const t = useTranslations("event.create");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errors, setErrors] = useState<FormErrors>({});
  const [generalError, setGeneralError] = useState<string | null>(null);

  // ステップ管理
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;

  // 基本情報
  const today = new Date();
  const defaultStartDate = today.toISOString().slice(0, 16);
  const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
  const defaultEndDate = nextWeek.toISOString().slice(0, 16);

  const [formData, setFormData] = useState<EventFormData>({
    title: "",
    description: "",
    slug: "",
    startDate: defaultStartDate,
    endDate: defaultEndDate,
    creditsPerVoter: 100,
    votingMode: "individual",
    discordGuildId: "",
    discordGuildName: "",
  });

  // 投票候補
  const [subjects, setSubjects] = useState<SubjectInput[]>([]);
  const [newSubject, setNewSubject] = useState<SubjectInput>({
    title: "",
    description: "",
    url: "",
  });

  // 作成されたイベント
  const [createdEvent, setCreatedEvent] = useState<CreatedEvent | null>(null);

  // トークン生成用
  const [tokenCount, setTokenCount] = useState(10);
  const [generatedTokens, setGeneratedTokens] = useState<string[]>([]);
  const [isGeneratingTokens, setIsGeneratingTokens] = useState(false);

  // コピー状態
  const [copied, setCopied] = useState<string | null>(null);

  const updateFormData = (field: keyof EventFormData, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const addSubject = () => {
    if (!newSubject.title.trim()) return;
    setSubjects((prev) => [...prev, { ...newSubject }]);
    setNewSubject({ title: "", description: "", url: "" });
  };

  const removeSubject = (index: number) => {
    setSubjects((prev) => prev.filter((_, i) => i !== index));
  };

  const validateStep1 = (): boolean => {
    const newErrors: FormErrors = {};
    if (!formData.title.trim()) {
      newErrors.title = ["タイトルを入力してください"];
    }
    if (!formData.startDate) {
      newErrors.startDate = ["開始日時を入力してください"];
    }
    if (!formData.endDate) {
      newErrors.endDate = ["終了日時を入力してください"];
    }
    if (new Date(formData.endDate) <= new Date(formData.startDate)) {
      newErrors.endDate = ["終了日は開始日より後の日付を指定してください"];
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = (): boolean => {
    if (subjects.length === 0) {
      setGeneralError(t("wizard.atLeastOneSubject"));
      return false;
    }
    setGeneralError(null);
    return true;
  };

  const goToNextStep = () => {
    if (currentStep === 1 && !validateStep1()) return;
    if (currentStep === 2 && !validateStep2()) return;
    setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
  };

  const goToPrevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handlePublish = () => {
    setErrors({});
    setGeneralError(null);

    startTransition(async () => {
      const result = await createEventWithSubjects({
        title: formData.title,
        description: formData.description || undefined,
        slug: formData.slug || undefined,
        startDate: new Date(formData.startDate),
        endDate: new Date(formData.endDate),
        creditsPerVoter: formData.creditsPerVoter,
        votingMode: formData.votingMode,
        discordGuildId: formData.votingMode === "discord" ? formData.discordGuildId || undefined : undefined,
        discordGuildName: formData.votingMode === "discord" ? formData.discordGuildName || undefined : undefined,
        subjects,
      });

      if (result.success) {
        setCreatedEvent(result.event);
        setCurrentStep(4);
      } else {
        setGeneralError(result.error);
        if (result.fieldErrors) {
          setErrors(result.fieldErrors);
        }
      }
    });
  };

  const handleGenerateTokens = async () => {
    if (!createdEvent) return;
    setIsGeneratingTokens(true);

    const result = await generateAccessTokens(
      createdEvent.id,
      createdEvent.adminToken,
      tokenCount
    );

    if (result.success) {
      setGeneratedTokens(result.tokens.map((t) => t.token));
    }
    setIsGeneratingTokens(false);
  };

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

  const votingModeLabels = {
    individual: t("authModes.individual.title"),
    google: t("authModes.google.title"),
    line: t("authModes.line.title"),
  };

  // ステップインジケーター
  const StepIndicator = () => (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        {[1, 2, 3, 4].map((step) => (
          <div key={step} className="flex items-center">
            <div
              className={`flex size-10 items-center justify-center rounded-full border-2 font-semibold transition-colors ${
                step < currentStep
                  ? "border-green-500 bg-green-500 text-white"
                  : step === currentStep
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-muted-foreground/30 text-muted-foreground/50"
              }`}
            >
              {step < currentStep ? <Check className="size-5" /> : step}
            </div>
            {step < 4 && (
              <div
                className={`h-1 w-12 sm:w-24 ${
                  step < currentStep ? "bg-green-500" : "bg-muted-foreground/20"
                }`}
              />
            )}
          </div>
        ))}
      </div>
      <div className="mt-2 flex justify-between text-xs sm:text-sm">
        <span className={currentStep >= 1 ? "text-foreground" : "text-muted-foreground"}>
          {t("wizard.step1")}
        </span>
        <span className={currentStep >= 2 ? "text-foreground" : "text-muted-foreground"}>
          {t("wizard.step2")}
        </span>
        <span className={currentStep >= 3 ? "text-foreground" : "text-muted-foreground"}>
          {t("wizard.step3")}
        </span>
        <span className={currentStep >= 4 ? "text-foreground" : "text-muted-foreground"}>
          {t("wizard.step4")}
        </span>
      </div>
    </div>
  );

  // Step 1: 基本情報
  const Step1 = () => (
    <div className="space-y-6">
      {generalError && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          {generalError}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="title">
          {t("titleLabel")} <span className="text-destructive">*</span>
        </Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => updateFormData("title", e.target.value)}
          placeholder={t("titlePlaceholder")}
          maxLength={100}
        />
        {errors.title && <p className="text-sm text-destructive">{errors.title[0]}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">
          {t("descriptionLabel")}（{tCommon("optional")}）
        </Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => updateFormData("description", e.target.value)}
          placeholder={t("descriptionPlaceholder")}
          maxLength={2000}
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="slug">
          {t("customUrlLabel")}（{tCommon("optional")}）
        </Label>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">/events/</span>
          <Input
            id="slug"
            value={formData.slug}
            onChange={(e) => updateFormData("slug", e.target.value)}
            placeholder={t("customUrlPlaceholder")}
            pattern="[a-z0-9-]+"
            minLength={3}
            maxLength={50}
            className="flex-1"
          />
        </div>
        <p className="text-xs text-muted-foreground">{t("customUrlHint")}</p>
        {errors.slug && <p className="text-sm text-destructive">{errors.slug[0]}</p>}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="startDate">
            {t("startDateLabel")} <span className="text-destructive">*</span>
          </Label>
          <Input
            id="startDate"
            type="datetime-local"
            value={formData.startDate}
            onChange={(e) => updateFormData("startDate", e.target.value)}
          />
          {errors.startDate && (
            <p className="text-sm text-destructive">{errors.startDate[0]}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="endDate">
            {t("endDateLabel")} <span className="text-destructive">*</span>
          </Label>
          <Input
            id="endDate"
            type="datetime-local"
            value={formData.endDate}
            onChange={(e) => updateFormData("endDate", e.target.value)}
          />
          {errors.endDate && (
            <p className="text-sm text-destructive">{errors.endDate[0]}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="creditsPerVoter">{t("creditsLabel")}</Label>
        <Input
          id="creditsPerVoter"
          type="number"
          min={1}
          max={1000}
          value={formData.creditsPerVoter}
          onChange={(e) => updateFormData("creditsPerVoter", parseInt(e.target.value) || 100)}
        />
        <p className="text-xs text-muted-foreground">{t("creditsHint")}</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="votingMode">
          {t("authModeLabel")} <span className="text-destructive">*</span>
        </Label>
        <Select
          value={formData.votingMode}
          onValueChange={(v) => updateFormData("votingMode", v)}
        >
          <SelectTrigger id="votingMode">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="individual">
              <div className="flex flex-col items-start">
                <span className="font-medium">{t("authModes.individual.title")}</span>
                <span className="text-xs text-muted-foreground">
                  {t("authModes.individual.description")}
                </span>
              </div>
            </SelectItem>
            <SelectItem value="google">
              <div className="flex flex-col items-start">
                <span className="font-medium">{t("authModes.google.title")}</span>
                <span className="text-xs text-muted-foreground">
                  {t("authModes.google.description")}
                </span>
              </div>
            </SelectItem>
            <SelectItem value="line">
              <div className="flex flex-col items-start">
                <span className="font-medium">{t("authModes.line.title")}</span>
                <span className="text-xs text-muted-foreground">
                  {t("authModes.line.description")}
                </span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  // Step 2: 投票候補
  const Step2 = () => (
    <div className="space-y-6">
      {generalError && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
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
              className="flex items-center justify-between rounded-lg border bg-card p-4"
            >
              <div>
                <p className="font-medium">{subject.title}</p>
                {subject.description && (
                  <p className="text-sm text-muted-foreground">{subject.description}</p>
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
        <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
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
                setNewSubject((prev) => ({ ...prev, description: e.target.value }))
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

  // Step 3: 確認
  const Step3 = () => (
    <div className="space-y-6">
      {generalError && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          {generalError}
        </div>
      )}

      {/* 警告 */}
      <div className="rounded-lg border border-amber-500/50 bg-amber-50 p-4 dark:bg-amber-950/30">
        <div className="flex items-start gap-3">
          <Lock className="mt-0.5 size-5 text-amber-600" />
          <div>
            <p className="font-medium text-amber-800 dark:text-amber-200">
              {t("wizard.confirmWarning")}
            </p>
            <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">
              {t("wizard.confirmWarningDetail")}
            </p>
          </div>
        </div>
      </div>

      {/* 基本情報 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t("wizard.step1")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-2 sm:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">{t("titleLabel")}</p>
              <p className="font-medium">{formData.title}</p>
            </div>
            {formData.description && (
              <div>
                <p className="text-sm text-muted-foreground">{t("descriptionLabel")}</p>
                <p>{formData.description}</p>
              </div>
            )}
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">{t("startDateLabel")}</p>
              <p>{new Date(formData.startDate).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t("endDateLabel")}</p>
              <p>{new Date(formData.endDate).toLocaleString()}</p>
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">{t("creditsLabel")}</p>
              <p>{formData.creditsPerVoter}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t("authModeLabel")}</p>
              <p>{votingModeLabels[formData.votingMode]}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 投票候補 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {t("wizard.step2")}（{subjects.length}件）
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {subjects.map((subject, index) => (
              <div key={index} className="rounded border p-3">
                <p className="font-medium">{subject.title}</p>
                {subject.description && (
                  <p className="text-sm text-muted-foreground">{subject.description}</p>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Step 4: 完了
  const Step4 = () => {
    if (!createdEvent) return null;

    const eventPath = createdEvent.slug
      ? `/events/${createdEvent.slug}`
      : `/events/${createdEvent.id}`;
    const eventUrl = `${baseUrl}${eventPath}`;
    const adminUrl = `${baseUrl}/admin/${createdEvent.id}?token=${createdEvent.adminToken}`;

    return (
      <div className="space-y-6">
        {/* 成功メッセージ */}
        <div className="flex items-center justify-center gap-3 py-4">
          <div className="flex size-12 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900/30">
            <Check className="size-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold">公開完了！</h2>
            <p className="text-muted-foreground">{createdEvent.title}</p>
          </div>
        </div>

        {/* 管理URL警告 */}
        <Card className="border-amber-500/50 bg-amber-50 dark:bg-amber-950/30">
          <CardHeader className="pb-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 size-5 text-amber-600" />
              <div>
                <CardTitle className="text-amber-800 dark:text-amber-200">
                  管理用URL
                </CardTitle>
                <CardDescription className="text-amber-700 dark:text-amber-300">
                  このURLは今後表示されません。必ず安全な場所に保存してください。
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input value={adminUrl} readOnly className="bg-white font-mono text-sm dark:bg-black" />
              <Button
                variant="outline"
                onClick={() => copyToClipboard(adminUrl, "admin")}
              >
                {copied === "admin" ? <Check className="size-4" /> : <Copy className="size-4" />}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* イベントURL */}
        <Card>
          <CardHeader>
            <CardTitle>公開URL（参加者用）</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input value={eventUrl} readOnly className="font-mono text-sm" />
              <Button
                variant="outline"
                onClick={() => copyToClipboard(eventUrl, "event")}
              >
                {copied === "event" ? <Check className="size-4" /> : <Copy className="size-4" />}
              </Button>
              <Button variant="outline" asChild>
                <a href={eventPath} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="size-4" />
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 個別URL方式の場合のトークン生成 */}
        {createdEvent.votingMode === "individual" && (
          <Card>
            <CardHeader>
              <CardTitle>{t("wizard.generateTokens")}</CardTitle>
              <CardDescription>参加者に配布するURLを生成します</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {generatedTokens.length === 0 ? (
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Label>{t("wizard.tokenCount")}</Label>
                    <Input
                      type="number"
                      min={1}
                      max={100}
                      value={tokenCount}
                      onChange={(e) => setTokenCount(parseInt(e.target.value) || 10)}
                      className="w-24"
                    />
                  </div>
                  <Button onClick={handleGenerateTokens} disabled={isGeneratingTokens}>
                    {isGeneratingTokens ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Plus className="size-4" />
                    )}
                    生成
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    {t("wizard.tokensGenerated", { count: generatedTokens.length })}
                  </p>
                  <div className="max-h-60 space-y-1 overflow-y-auto rounded border p-2">
                    {generatedTokens.map((token, index) => (
                      <div key={token} className="flex items-center gap-2 text-sm">
                        <span className="w-6 text-muted-foreground">{index + 1}.</span>
                        <code className="flex-1 truncate font-mono">
                          {baseUrl}{eventPath}?token={token}
                        </code>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-6"
                          onClick={() =>
                            copyToClipboard(
                              `${baseUrl}${eventPath}?token=${token}`,
                              token
                            )
                          }
                        >
                          {copied === token ? (
                            <Check className="size-3" />
                          ) : (
                            <Copy className="size-3" />
                          )}
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* ナビゲーション */}
        <div className="flex gap-3">
          <Button asChild>
            <a href={`/admin/${createdEvent.id}?token=${createdEvent.adminToken}`}>
              管理画面へ
            </a>
          </Button>
          <Button variant="outline" onClick={() => router.push("/")}>
            トップへ戻る
          </Button>
        </div>
      </div>
    );
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="text-2xl">{t("title")}</CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardContent>
        <StepIndicator />

        {currentStep === 1 && <Step1 />}
        {currentStep === 2 && <Step2 />}
        {currentStep === 3 && <Step3 />}
        {currentStep === 4 && <Step4 />}
      </CardContent>

      {currentStep < 4 && (
        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={goToPrevStep}
            disabled={currentStep === 1}
          >
            <ChevronLeft className="size-4" />
            {tCommon("back")}
          </Button>

          {currentStep < 3 ? (
            <Button onClick={goToNextStep}>
              {tCommon("next")}
              <ChevronRight className="size-4" />
            </Button>
          ) : (
            <Button onClick={handlePublish} disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  {t("wizard.publishing")}
                </>
              ) : (
                <>
                  <Lock className="size-4" />
                  {t("wizard.publish")}
                </>
              )}
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  );
}

