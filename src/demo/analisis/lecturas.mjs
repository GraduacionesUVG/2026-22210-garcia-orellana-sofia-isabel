export const visible = rows => (rows || []).filter(row => !row.deleted_at);
export const byId = rows => new Map(rows.map(row => [row.id, row]));
export const normalize = value => String(value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es");
export const latestFirst = (left, right) => String(right.updated_at).localeCompare(String(left.updated_at)) || right.id.localeCompare(left.id);
export const codeOrder = (left, right) => left.position - right.position || left.name.localeCompare(right.name, "es");

export function paginate(rows, query) {
  const start = Math.max(0, Number(query.get("offset")) || 0);
  const limit = Math.max(1, Math.min(200, Number(query.get("limit")) || 100));
  return rows.slice(start, start + limit);
}

function indexCorpus(project) {
  const documents = byId(visible(project.documents));
  const codes = byId(visible(project.codes));
  const segments = visible(project.segments).filter(row => documents.has(row.document_id));
  const assignments = new Map();
  for (const item of visible(project.assignments)) {
    if (!codes.has(item.code_id)) continue;
    if (!assignments.has(item.segment_id)) assignments.set(item.segment_id, []);
    assignments.get(item.segment_id).push(item);
  }
  return { documents, codes, segments, assignments };
}

const segmentOrder = (a, b) => a.document_id.localeCompare(b.document_id)
  || a.start_char - b.start_char || a.end_char - b.end_char;

function segmentWithContext(corpus, participants, row) {
  const document = corpus.documents.get(row.document_id);
  const participant = participants.get(document.participant_id);
  const assignments = corpus.assignments.get(row.id) || [];
  const codes = assignments.map(item => corpus.codes.get(item.code_id)).sort(codeOrder);
  return {
    ...row, segment_id: row.id, document_title: document.title, document_type: document.document_type,
    participant_id: document.participant_id, participant_label: participant?.display_name || participant?.alias || "Sin participante",
    code_ids: codes.map(code => code.id), codes, code_count: codes.length, is_coded: codes.length > 0, assignments,
  };
}

function codingQueue(corpus, hydrate, q) {
  const status = q.get("status"), document = q.get("document_id"), text = normalize(q.get("search"));
  const counts = { all: corpus.segments.length, coded: 0, uncoded: 0 };
  let matches = corpus.segments.filter(row => {
    const coded = corpus.assignments.has(row.id);
    if (coded) counts.coded++;
    else counts.uncoded++;
    return (!document || document === row.document_id)
      && (status !== "coded" || coded) && (status !== "uncoded" || !coded);
  }).sort(segmentOrder);
  if (text) {
    matches = matches.map(hydrate).filter(row => normalize([
      row.note, row.selected_text, row.document_title, row.participant_label, ...row.codes.map(code => code.name),
    ].join(" ")).includes(text));
  }
  const page = paginate(matches, q);
  return { segments: text ? page : page.map(hydrate), total: matches.length, counts };
}

function analysisOverview(project, corpus) {
  let coded = 0, assignments = 0, quotes = 0;
  for (const segment of corpus.segments) {
    const assigned = corpus.assignments.get(segment.id);
    if (!assigned) continue;
    coded++;
    assignments += assigned.length;
    for (const item of assigned) if (item.is_quote) quotes++;
  }
  return {
    project_id: project.id, documents_count: corpus.documents.size, segments_count: corpus.segments.length, codes_count: corpus.codes.size,
    coded_segments_count: coded, uncoded_segments_count: corpus.segments.length - coded, assignments_count: assignments,
    memos_count: visible(project.memos).length, insights_count: visible(project.insights).length, quotes_count: quotes,
  };
}

function codeStats(project, corpus) {
  const stats = new Map();
  for (const code of corpus.codes.values()) {
    stats.set(code.id, {
      project_id: project.id, code_id: code.id, parent_code_id: code.parent_code_id, name: code.name, color: code.color,
      position: code.position, definition: code.definition, description: code.description,
      coded_segments_count: 0, quotes_count: 0, last_coded_at: null,
    });
  }
  for (const segment of corpus.segments) {
    for (const item of corpus.assignments.get(segment.id) || []) {
      const stat = stats.get(item.code_id);
      stat.coded_segments_count++;
      if (item.is_quote) stat.quotes_count++;
      const date = item.updated_at || "";
      if (stat.last_coded_at === null || date > stat.last_coded_at) stat.last_coded_at = date;
    }
  }
  return [...stats.values()].sort((a, b) => b.coded_segments_count - a.coded_segments_count || b.quotes_count - a.quotes_count || codeOrder(a, b));
}

function codeRelationships(segments) {
  const pairs = new Map();
  for (const segment of segments) {
    if (segment.code_ids.length < 2) continue;
    const { assignments, ...evidence } = segment;
    const ids = [...segment.code_ids].sort();
    for (let i = 0; i < ids.length - 1; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        const source = ids[i], target = ids[j], key = source + ":" + target;
        if (!pairs.has(key)) pairs.set(key, { source_code_id: source, target_code_id: target, segment_ids: [], segments: [], shared_segment_count: 0 });
        const pair = pairs.get(key);
        pair.segment_ids.push(segment.id);
        pair.segments.push(evidence);
        pair.shared_segment_count++;
      }
    }
  }
  return [...pairs.values()].sort((a, b) => b.shared_segment_count - a.shared_segment_count);
}

function documentPatterns(segments, participants) {
  const documents = new Map(), patterns = new Map();
  for (const segment of segments) {
    if (!segment.is_coded) continue;
    const { assignments, ...evidence } = segment;
    const { document_id, document_title, document_type, participant_id, participant_label } = segment;
    if (!documents.has(document_id)) {
      documents.set(document_id, {
        id: document_id, title: document_title, document_type, participant_id, participant_label,
        participant_attributes: participants.get(participant_id)?.attributes || {},
      });
    }
    for (const item of assignments) {
      if (!patterns.has(item.code_id)) patterns.set(item.code_id, { code_id: item.code_id, documents: new Map(), total_segments: 0, quote_count: 0 });
      const pattern = patterns.get(item.code_id);
      if (!pattern.documents.has(document_id)) {
        pattern.documents.set(document_id, { document_id, document_title, document_type, participant_id, participant_label, segment_count: 0, quote_count: 0, segments: [] });
      }
      const entry = pattern.documents.get(document_id);
      entry.segment_count++;
      pattern.total_segments++;
      if (item.is_quote) { entry.quote_count++; pattern.quote_count++; }
      entry.segments.push({ ...evidence, is_quote: Boolean(item.is_quote) });
    }
  }
  const ranked = [...patterns.values()].map(pattern => ({
    code_id: pattern.code_id, documents: [...pattern.documents.values()].sort((a, b) => b.segment_count - a.segment_count),
    document_count: pattern.documents.size, total_segments: pattern.total_segments, quote_count: pattern.quote_count,
  })).sort((a, b) => b.document_count - a.document_count || b.total_segments - a.total_segments);
  return { documents: [...documents.values()], patterns: ranked };
}

function documentGroup(doc, participant) {
  for (const attribute of ["sample_group","participant_type","community","age_range","gender_identity"]) {
    const key = String(participant?.attributes?.[attribute] ?? "").trim();
    if (key) return { key, label: key, attribute };
  }
  if (participant) return { key: participant.id, label: participant.display_name || participant.alias, attribute: "participant" };
  const key = doc?.document_type || "Sin contexto";
  return { key, label: key, attribute: "document_type" };
}

function groupComparisons(corpus, segments, participants) {
  const groupData = new Map(), perCode = new Map(), groupByDocument = new Map();
  for (const segment of segments) {
    if (!segment.is_coded) continue;
    const id = segment.document_id;
    if (!groupByDocument.has(id)) {
      const document = corpus.documents.get(id), participant = participants.get(document.participant_id);
      const group = documentGroup(document, participant);
      if (!groupData.has(group.key)) groupData.set(group.key, {...group, documents: new Set(), participants: new Set(), segment_count: 0});
      const entry = groupData.get(group.key);
      entry.documents.add(id);
      if (participant) entry.participants.add(participant.id);
      groupByDocument.set(id, entry);
    }
    const group = groupByDocument.get(id);
    group.segment_count += segment.assignments.length;
    for (const item of segment.assignments) {
      if (!perCode.has(item.code_id)) {
        const code = corpus.codes.get(item.code_id);
        perCode.set(code.id, { code_id: code.id, code_name: code.name, color: code.color, total_segments: 0, counts: new Map() });
      }
      const row = perCode.get(item.code_id);
      row.total_segments++;
      row.counts.set(group.key, (row.counts.get(group.key) || 0) + 1);
    }
  }
  const groups = [...groupData.values()].sort((a, b) => b.segment_count - a.segment_count).map(({participants, documents, ...details}) =>
    ({...details, participant_count: participants.size, document_count: documents.size}));
  const rows = [...perCode.values()].sort((a, b) => b.total_segments - a.total_segments || a.code_name.localeCompare(b.code_name, "es"))
    .map(row => ({...row, counts: Object.fromEntries(row.counts)}));
  return { attribute: groups[0]?.attribute || "sample_group", groups, rows };
}

// Las vistas pertenecen a una sola solicitud. Las escrituras se reflejan en la siguiente lectura.
export function analysisView(project) {
  const corpus = indexCorpus(project);
  let participantIndex, contextualSegments;
  const participants = () => participantIndex ??= byId(visible(project.participants));
  const hydrate = row => segmentWithContext(corpus, participants(), row);
  const segments = () => contextualSegments ??= corpus.segments.slice().sort(segmentOrder).map(hydrate);
  return {
    codes: corpus.codes,
    segments,
    queue: q => codingQueue(corpus, hydrate, q),
    overview: () => analysisOverview(project, corpus),
    stats: () => codeStats(project, corpus),
    relationships: () => codeRelationships(segments()),
    documentPatterns: () => documentPatterns(segments(), participants()),
    uncoded(q) {
      const pending = corpus.segments.filter(row => !corpus.assignments.has(row.id)).sort(segmentOrder);
      return paginate(pending, q).map(hydrate);
    },
    dashboard() {
      return {
        overview: this.overview(), codes: [...corpus.codes.values()].sort(codeOrder), stats: this.stats().slice(0, 8),
        uncodedSegments: segments().filter(row => !row.is_coded).slice(0, 8),
        insights: visible(project.insights).sort(latestFirst), relationships: this.relationships(),
        documentPatterns: this.documentPatterns(), groupComparisons: groupComparisons(corpus, segments(), participants()),
      };
    },
  };
}

const targets = { document: "documents", segment: "segments", code: "codes", memo: "memos", participant: "participants" };
export function targetFor(project, type, id) {
  const row = project[targets[type]]?.find(item => item.id === id && !item.deleted_at);
  if (type === "segment" && row && !project.documents?.some(doc => doc.id === row.document_id && !doc.deleted_at)) return undefined;
  return row;
}
export function resolvedLinks(project, links) {
  return visible(links).flatMap(link=>{
    const type = link.link_type;
    const target = targetFor(project, type, link[type + "_id"]);
    return target ? [{...link, target_label: target.title || target.name || target.selected_text || target.display_name || target.alias}] : [];
  });
}
