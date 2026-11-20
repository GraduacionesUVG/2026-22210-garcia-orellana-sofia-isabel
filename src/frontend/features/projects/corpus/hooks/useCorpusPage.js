"use client";

import { useMemo } from "react";
import {
  getCorpusHref,
  getNewDocumentHref,
} from "@/features/projects/corpus/helpers/corpus.helpers";

export function useCorpusPage(projectId) {
  const routes = useMemo(
    () => ({
      corpusHref: getCorpusHref(projectId),
      newDocumentHref: getNewDocumentHref(projectId),
    }),
    [projectId]
  );

  const progress = 70;

  const workflowItems = useMemo(
    () => [
      {
        title: "Participantes",
        description:
          "Registra alias como P01, P02 o P03 para vincular entrevistas sin exponer datos personales.",
        state: "Listo",
      },
      {
        title: "Fuentes",
        description:
          "Clasifica textos por entrevista, grupo focal, nota de campo, observación, diario u otro tipo.",
        state: "Listo",
      },
      {
        title: "Documentos",
        description:
          "Lista, filtra y revisa las transcripciones o textos cualitativos del proyecto.",
        state: "Listo",
      },
      {
        title: "Versiones y segmentos",
        description:
          "Guarda snapshots y marca fragmentos relevantes antes de pasar a codificación formal.",
        state: "Backend listo",
      },
    ],
    []
  );

  return {
    projectId,
    progress,
    routes,
    workflowItems,
  };
}