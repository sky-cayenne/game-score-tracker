import { createId, nowIso } from "@/lib/storage/localDb";
import type { AppData, CardTemplate, GameTemplate, GameTemplateRules, Id } from "@/types/domain";

export type CreateTemplateInput = {
  name: string;
  roundLimit: number | null;
  winningScoreLimit: number | null;
  scoreLimitMode?: GameTemplateRules["scoreLimitMode"];
  allowedRoundMultipliers?: number[];
};

export type UpdateTemplateInput = {
  name: string;
  rules: GameTemplateRules;
};

export type CreateCardInput = {
  name: string;
  points: number;
  suitOrColor: string;
};

export type UpdateCardInput = {
  name: string;
  points: number;
  suitOrColor: string;
};

export function createTemplate(data: AppData, input: CreateTemplateInput) {
  const createdAt = nowIso();
  const template: GameTemplate = {
    id: createId(),
    name: input.name,
    cards: [],
    rules: {
      roundLimit: input.roundLimit,
      winningScoreLimit: input.winningScoreLimit,
      scoreLimitMode: normalizeScoreLimitMode(input.scoreLimitMode),
      allowedRoundMultipliers: normalizeMultipliers(input.allowedRoundMultipliers ?? [1, 2, 3, 4])
    },
    createdAt,
    updatedAt: createdAt
  };

  return {
    ...data,
    templates: [template, ...data.templates]
  };
}

export function updateTemplate(data: AppData, templateId: Id, input: UpdateTemplateInput) {
  return {
    ...data,
    templates: data.templates.map((template) =>
      template.id === templateId
        ? {
            ...template,
            name: input.name,
            rules: {
              ...input.rules,
              scoreLimitMode: normalizeScoreLimitMode(input.rules.scoreLimitMode),
              allowedRoundMultipliers: normalizeMultipliers(input.rules.allowedRoundMultipliers)
            },
            updatedAt: nowIso()
          }
        : template
    )
  };
}

export function duplicateTemplate(data: AppData, templateId: Id) {
  const source = data.templates.find((template) => template.id === templateId);
  if (!source) {
    return data;
  }

  const createdAt = nowIso();
  const copy: GameTemplate = {
    ...source,
    id: createId(),
    name: `${source.name} копія`,
    createdAt,
    updatedAt: createdAt,
    cards: source.cards.map((card, index) => ({
      ...card,
      id: createId(),
      sortOrder: index,
      createdAt,
      updatedAt: createdAt
    }))
  };

  return {
    ...data,
    templates: [copy, ...data.templates]
  };
}

export function canDeleteTemplate(data: AppData, templateId: Id) {
  return !data.matches.some((match) => match.templateId === templateId && match.status === "active");
}

export function deleteTemplate(data: AppData, templateId: Id) {
  if (!canDeleteTemplate(data, templateId)) {
    return data;
  }

  return {
    ...data,
    templates: data.templates.filter((template) => template.id !== templateId)
  };
}

export function createCard(data: AppData, templateId: Id, input: CreateCardInput) {
  const createdAt = nowIso();
  const card: CardTemplate = {
    id: createId(),
    name: input.name,
    points: input.points,
    suitOrColor: input.suitOrColor,
    sortOrder: getTemplate(data, templateId)?.cards.length ?? 0,
    createdAt,
    updatedAt: createdAt
  };

  return updateTemplateCards(data, templateId, (cards) => [...cards, card]);
}

export function updateCard(data: AppData, templateId: Id, cardId: Id, input: UpdateCardInput) {
  return updateTemplateCards(data, templateId, (cards) =>
    cards.map((card) =>
      card.id === cardId
        ? {
            ...card,
            name: input.name,
            points: input.points,
            suitOrColor: input.suitOrColor,
            updatedAt: nowIso()
          }
        : card
    )
  );
}

export function deleteCard(data: AppData, templateId: Id, cardId: Id) {
  return updateTemplateCards(data, templateId, (cards) =>
    cards
      .filter((card) => card.id !== cardId)
      .map((card, index) => ({
        ...card,
        sortOrder: index
      }))
  );
}

export function moveCard(data: AppData, templateId: Id, cardId: Id, direction: "up" | "down") {
  return updateTemplateCards(data, templateId, (cards) => {
    const ordered = [...cards].sort((a, b) => a.sortOrder - b.sortOrder);
    const currentIndex = ordered.findIndex((card) => card.id === cardId);
    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;

    if (currentIndex < 0 || targetIndex < 0 || targetIndex >= ordered.length) {
      return ordered;
    }

    const next = [...ordered];
    const [card] = next.splice(currentIndex, 1);
    next.splice(targetIndex, 0, card);

    return next.map((item, index) => ({
      ...item,
      sortOrder: index,
      updatedAt: nowIso()
    }));
  });
}

export function parsePositiveInteger(value: FormDataEntryValue | null) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

export function parseInteger(value: FormDataEntryValue | null) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function parseScoreLimitMode(value: FormDataEntryValue | null) {
  return normalizeScoreLimitMode(value);
}

function getTemplate(data: AppData, templateId: Id) {
  return data.templates.find((template) => template.id === templateId);
}

function updateTemplateCards(data: AppData, templateId: Id, update: (cards: CardTemplate[]) => CardTemplate[]) {
  return {
    ...data,
    templates: data.templates.map((template) =>
      template.id === templateId
        ? {
            ...template,
            cards: update(template.cards).sort((a, b) => a.sortOrder - b.sortOrder),
            updatedAt: nowIso()
          }
        : template
    )
  };
}

function normalizeMultipliers(multipliers: number[]) {
  const normalized = [...new Set(multipliers.filter((item) => [1, 2, 3, 4].includes(item)))].sort((a, b) => a - b);
  return normalized.length > 0 ? normalized : [1];
}

function normalizeScoreLimitMode(value: unknown): GameTemplateRules["scoreLimitMode"] {
  return value === "lose" ? "lose" : "win";
}
