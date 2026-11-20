import { analysisView, codeOrder, resolvedLinks, visible } from "./lecturas.mjs";

const names = {
  protocol: "Protocolo de investigación", codebook: "Libro de códigos", evidence: "Evidencias por código",
  quotes: "Citas textuales", dashboard: "Resumen del análisis", insights: "Bitácora de hallazgos",
};
const types = {
  md: "text/markdown; charset=utf-8", pdf: "application/pdf", zip: "application/zip",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};
const labels = {
  draft:"Borrador", reviewed:"Revisado", confirmed:"Confirmado", archived:"Archivado",
  low:"Baja", medium:"Media", high:"Alta", pattern:"Patrón", question:"Pregunta abierta",
  tension:"Tensión", exception:"Excepción", contrast:"Contraste", recommendation:"Recomendación", other:"Otro",
};
const option = (options, code) => options?.find(item=>item.code===code)?.label || code || "";
function evidenceByCode(segments, quotesOnly) {
  const groups = new Map();
  for (const row of segments) {
    for (const assignment of row.assignments) {
      if (quotesOnly && !assignment.is_quote) continue;
      if (!groups.has(assignment.code_id)) groups.set(assignment.code_id, []);
      const matches = groups.get(assignment.code_id);
      if (matches.at(-1) !== row) matches.push(row);
    }
  }
  return groups;
}

function model(project, type, getAnalysis) {
  const lines = [];
  const add = (style,text) => { if (text != null && String(text).trim()) lines.push({style,text:String(text)}); };
  const title = text => add("heading",text);
  const p = text => add("body",text);
  const field = (label,value) => { if (value != null && String(value).trim()) p(label + " · " + value); };
  if (type==="protocol") {
    const d = project.delimitation?.delim || {}, research = project.researchDesign || {}, sample = project.sampleConfig || {};
    const config = sample.config || {}, options = project.sampleOptions || {};
    title("Delimitación");
    for (const [label,key] of [["Tema","topic"],["Lugar","context_place"],["Población","population"],["Período","time_period"],["Recursos","resources"]]) field(label,d[key]);
    for (const row of visible(project.delimitation?.include)) field("Incluye",row.text);
    for (const row of visible(project.delimitation?.exclude)) field("Excluye",row.text);
    title("Diseño de investigación");
    field("Pregunta",research.design?.research_question);
    field("Objetivo general",research.design?.general_objective);
    for (const row of visible(research.specific_objectives).sort((a,b)=>a.position-b.position)) field("Objetivo específico",row.text);
    title("Muestra");
    field("Enfoque",option(options.main_approaches,config.main_approach_code));
    field("Alcance",option(options.scopes,config.scope_code));
    field("Fase de campo",config.field_phase); field("Tamaño previsto",config.target_sample_size); field("Justificación",config.sample_size_rationale);
    for (const row of visible(sample.collection_techniques)) field("Técnica",row.custom_label || option(options.collection_technique_options,row.technique_code));
  } else if (type==="insights") {
    const linked = resolvedLinks(project,project.insightLinks);
    for (const insight of visible(project.insights)) {
      title(insight.title);
      p([labels[insight.insight_type],labels[insight.status],insight.confidence && "Confianza " + (labels[insight.confidence] || insight.confidence)].filter(Boolean).join(" · "));
      p(insight.summary); p(insight.interpretation);
      field("Etiquetas",insight.tags?.join(", "));
      field("Origen",insight.metadata?.source_visual_title);
      for (const row of linked.filter(row=>row.insight_id===insight.id)) field("Vínculo",row.target_label);
    }
  } else if (type==="quotes" || type==="evidence") {
    const analysis = getAnalysis();
    const groups = evidenceByCode(analysis.segments(), type === "quotes");
    for (const code of analysis.codes.values()) {
      const matches = groups.get(code.id);
      if (!matches) continue;
      title(code.name);
      for (const row of matches) {
        p("«"+row.selected_text+"»");
        p([row.document_title,row.participant_label,"Caracteres "+row.start_char+"–"+row.end_char].join(" · "));
        const assignment = row.assignments.find(a=>a.code_id===code.id);
        field("Cita",assignment.quote_label); field("Nota analítica",assignment.analytic_note);
      }
    }
  } else {
    const analysis = getAnalysis(), codes = analysis.codes;
    if (type==="codebook") {
      const stats = new Map(analysis.stats().map(stat=>[stat.code_id,stat]));
      for (const code of [...codes.values()].sort(codeOrder)) {
        title(code.name); field("Código padre",codes.get(code.parent_code_id)?.name);
        field("Definición",code.definition); if (code.description!==code.definition) field("Descripción",code.description);
        field("Incluir",code.inclusion_criteria); field("Excluir",code.exclusion_criteria);
        const stat = stats.get(code.id);
        p(stat.coded_segments_count+" segmentos · "+stat.quotes_count+" citas");
      }
    } else {
      const overview = analysis.overview(), relationships = analysis.relationships();
      title("Cobertura del corpus");
      for (const [label,key] of [["Documentos","documents_count"],["Segmentos","segments_count"],["Codificados","coded_segments_count"],["Pendientes","uncoded_segments_count"],["Códigos","codes_count"],["Asignaciones","assignments_count"],["Citas","quotes_count"],["Memos","memos_count"],["Hallazgos","insights_count"]]) field(label,overview[key]);
      title("Frecuencia de códigos");
      for (const stat of analysis.stats()) field(stat.name,stat.coded_segments_count+" segmentos");
      if (relationships.length) title("Coocurrencias");
      for (const rel of relationships) field(codes.get(rel.source_code_id).name+" y "+codes.get(rel.target_code_id).name,rel.shared_segment_count+" segmentos compartidos");
    }
  }
  if (!lines.length) p("Aún no hay registros para esta sección.");
  return [{style:"title",text:names[type]}, {style:"subtitle",text:project.name || "Proyecto"}, {style:"caption",text:"Demostración local · " + new Date().toISOString().slice(0,10)}, ...lines];
}

const slug = value => String(value).normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"").slice(0,90);
const markdown = lines => lines.map(({style,text})=>(style==="title" ? "# " : style==="heading" ? "## " : "")+text).join("\n\n")+"\n";
const xml = value => value.replace(/[^\u0009\u000a\u000d\u0020-\ud7ff\ue000-\ufffd\u{10000}-\u{10ffff}]/gu,"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
const xmlHeader = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
async function makeDocx(lines) {
  const {default:Zip} = await import("jszip");
  const zip = new Zip();
  zip.file("[Content_Types].xml",xmlHeader+'<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>');
  zip.file("_rels/.rels",xmlHeader+'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>');
  const sizes = {title:40,subtitle:30,heading:28,body:22,caption:18};
  const paragraphs = lines.map(({style,text})=>{
    const heading = ["title","heading"].includes(style);
    const words = text.split(/\r\n?|\n/).map(part=>'<w:t xml:space="preserve">'+xml(part)+'</w:t>').join("<w:br/>");
    return '<w:p><w:pPr><w:spacing w:before="'+(heading ? 160 : 0)+'" w:after="95"/></w:pPr><w:r><w:rPr>'+(heading ? "<w:b/>" : "")+'<w:color w:val="'+(heading ? "005944" : "243238")+'"/><w:sz w:val="'+sizes[style]+'"/></w:rPr>'+words+'</w:r></w:p>';
  }).join("");
  zip.file("word/document.xml",xmlHeader+'<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>'+paragraphs+'<w:sectPr><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="1080" w:right="1080" w:bottom="1080" w:left="1080"/></w:sectPr></w:body></w:document>');
  return zip.generateAsync({type:"uint8array",compression:"DEFLATE"});
}
async function makePdf(lines) {
  const {PDFDocument, StandardFonts, rgb} = await import("pdf-lib");
  const pdf = await PDFDocument.create();
  const regular = await pdf.embedFont(StandardFonts.Helvetica), bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const characters = new Set(regular.getCharacterSet());
  let page, y;
  const newPage = () => { page = pdf.addPage([595,842]); y=786; };
  newPage();
  pdf.setTitle(lines[0].text);
  for (const {style,text} of lines) {
    const heading = style==="title" || style==="heading";
    const size = ({title:25,subtitle:17,heading:15,body:11,caption:9})[style];
    const font = heading ? bold : regular;
    const emitLine = line => {
      if (y<54+size) newPage();
      page.drawText(line,{x:48,y,font,size,color:heading ? rgb(0,0.35,0.27) : rgb(0.12,0.17,0.18)});
      y -= size*1.35;
    };
    const available = 499;
    if (heading) y-=5;
    for (const paragraph of text.replace(/\r\n?/g,"\n").split("\n")) {
      // Los caracteres fuera de Helvetica se representan con su código Unicode en el PDF.
      const safeText = Array.from(paragraph, ch => characters.has(ch.codePointAt(0)) ? ch :
        /\s/.test(ch) ? " " : "[U+"+ch.codePointAt(0).toString(16).toUpperCase()+"]").join("");
      let line="";
      for (const word of safeText.split(/\s+/)) {
        const next = line ? line+" "+word : word;
        if (font.widthOfTextAtSize(next,size)<=available) { line=next; continue; }
        if (line) emitLine(line);
        line="";
        for (const character of word) {
          if (line && font.widthOfTextAtSize(line+character,size)>available) {emitLine(line);line="";}
          line+=character;
        }
      }
      emitLine(line);
    }
    y -= style==="caption" ? 13 : 5;
  }
  return pdf.save();
}

const formats = {md:markdown,pdf:makePdf,docx:makeDocx};
const scopes = {protocol:["protocol"], evidence:["codebook","evidence","quotes"], report:["dashboard","insights"], all:Object.keys(names)};
export async function exportProject(project,type,q) {
  const format=q.get("format") || (type==="bundle" ? "zip" : "docx");
  let bytes, base, analysis;
  const getAnalysis = () => analysis ??= analysisView(project);
  if (type==="bundle" && format==="zip") {
    const scope = q.get("scope") || "all";
    if (!Object.hasOwn(scopes,scope)) return Response.json({ok:false,error:"INVALID_EXPORT_SCOPE"},{status:400});
    const {default:Zip} = await import("jszip");
    const zip = new Zip();
    const sections = scopes[scope].map(kind => ({lines: model(project, kind, getAnalysis), basename: slug(names[kind])}));
    for (const {lines, basename} of sections) {
      for (const [extension,render] of Object.entries(formats)) zip.file(basename+"."+extension,await render(lines));
    }
    bytes = await zip.generateAsync({type:"uint8array",compression:"DEFLATE"});
    base = {all:"proyecto",report:"reporte",protocol:"protocolo",evidence:"evidencias"}[scope];
  } else if (Object.hasOwn(names,type) && Object.hasOwn(formats,format)) {
    bytes = await formats[format](model(project, type, getAnalysis));
    base = slug(names[type]);
  } else {
    return Response.json({ok:false,error:"INVALID_EXPORT"},{status:400});
  }
  const filename = [base,slug(project.name || "")].filter(Boolean).join("-")+"."+format;
  return new Response(bytes,{headers:{"Content-Type":types[format],"Content-Disposition":'attachment; filename="'+filename+'"',"Cache-Control":"no-store"}});
}
