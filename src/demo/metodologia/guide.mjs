import { chatResponse } from '../respuesta-chat.mjs';
import {ok, trim} from './common.mjs';

const checklist = {
  topic:['tema','Describe una práctica que puedas observar en una situación concreta.'],
  context_place:['lugar','Nombra el espacio donde observarías esa práctica.'],
  time_period:['período','Indica entre qué fechas recogerías los relatos.'],
  population:['población','Describe quién participaría y qué relación tiene con el tema.'],
  resources:['recursos','Indica con qué materiales y tiempo cuentas.'],
  include:['criterios de inclusión','Especifica qué experiencia debe tener una persona para participar.'],
  exclude:['criterios de exclusión','Aclara en qué circunstancias descartarías un testimonio.'],
};
function has(value) {
  return Array.isArray(value) ? value.length > 0 : Boolean(trim(value));
}
function checkDelim(project, draft) {
  const model = draft ?? {...project.delimitation.delim,include:project.delimitation.include,exclude:project.delimitation.exclude};
  const fields = {}, findings = [];
  for (const [key,[label,suggestion]] of Object.entries(checklist)) {
    const present = has(model[key]);
    fields[key] = {score:present ? 100 : 0,status:present ? 'aceptable' : 'pendiente',note:present ? 'Hay contenido registrado.' : 'Falta completar este apartado.',priority:present ? 'baja' : 'alta'};
    if (!present) findings.push({field:key,kind:'mejora',severity:'media',title:'Completar ' + label,message:'Este apartado está vacío.',suggestion});
  }
  const score = Math.round(100*(7-findings.length)/7);
  return {source:'heuristic',fields,findings,summary:'Revisión local de demostración. Hay contenido en ' + (7-findings.length) + ' de 7 apartados.',
    overall:{score,verdict:score === 100 ? 'bien_delimitada' : 'mejorable',rationale:'El indicador cuenta los apartados con contenido.'},
    jackQuestion:'¿Qué caso concreto quedaría fuera del alcance definido?',suggestedNextStep:findings[0]?.suggestion ?? 'Comprueba los criterios de inclusión con un caso de ejemplo.'};
}
function studyDesign(project) {
  const {design,specific_objectives} = project.researchDesign;
  const question = has(design.research_question), general = has(design.general_objective), specific = specific_objectives.length;
  const checks = [
    ['research_question',question,'Agrega la pregunta que guiará el trabajo.'],
    ['general_objective',general,'Escribe qué buscas comprender.'],
    ['specific_objectives',specific,'Agrega una acción de investigación concreta.'],
  ];
  const issues = checks.filter(([,present]) => !present).map(([field,,message]) => ({field,title:'Apartado pendiente',message,explanation:message,suggestion:message,severity:'warning'}));
  const section = field => ({status:issues.some(i => i.field === field) ? 'warning' : 'good',issues:issues.filter(i => i.field === field)});
  return {summary:{has_question:question,has_general_objective:general,specific_objectives_count:specific,total_issues:issues.length,
    critical_issues:0,warning_issues:issues.length,alignment_issues:0,overall_status:issues.length === 3 ? 'empty' : issues.length ? 'warning' : 'good'},
    question:section('research_question'),general_objective:section('general_objective'),specific_objectives:{...section('specific_objectives'),items:specific_objectives.map(o => ({id:o.id,text:o.text,position:o.position,status:'good',issues:[]}))},
    coherence:{status:'not_applicable',issues:[]},alignment:{status:'not_applicable',issues:[],explanation:'La relación entre la pregunta y los objetivos requiere lectura del equipo.'}};
}
function sampleCheck(project) {
  const {config,collection_techniques} = project.sampleConfig;
  const fields = [
    ['main_approach',config.main_approach_code,'Selecciona el enfoque.'],['scope',config.scope_code,'Selecciona el alcance.'],
    ['collection_techniques',collection_techniques,'Agrega una técnica de recolección.'],['field_phase',config.field_phase,'Indica cuándo y dónde realizarías el trabajo de campo.'],
    ['target_sample_size',config.target_sample_size,'Define un tamaño de muestra inicial.'],['sample_size_rationale',config.sample_size_rationale,'Explica por qué esa muestra responde a tu pregunta.'],
  ];
  const signals = fields.filter(([,value]) => !has(value)).map(([field,,message]) => ({field,severity:'warning',title:'Apartado pendiente',explanation:message,message,suggestion:message}));
  const score = Math.round(100*(6-signals.length)/6);
  return {summary:{overall_status:signals.length ? 'warning' : 'good',overall_score:score,completeness_score:score,warning_signals:signals.length,critical_signals:0,total_signals:signals.length,collection_techniques_count:collection_techniques.length,target_sample_size:config.target_sample_size},
    signals,concise_summary:'Comprobación local de demostración. La ficha tiene ' + (6-signals.length) + ' de 6 apartados completos.'};
}
const guidance = {
  delimitation: {question:'¿Podrías decidir si un caso concreto pertenece al estudio?',step:'Escribe un ejemplo que cumpla los criterios y otro que quede fuera.'},
  'research-design':{question:'¿Qué material tendrías que recoger para responder a la pregunta?',step:'Vincula cada objetivo específico con una observación, una entrevista o un documento.'},
  'sample-config':{question:'¿Qué experiencias quedarían fuera de la muestra prevista?',step:'Contrasta el criterio de selección con la pregunta y documenta por qué incluirías cada grupo.'},
};
export function evaluateDesign(project) {
  return studyDesign(project);
}
export function guide({project,body},scope,action) {
  if (action === 'chat') {
    const example = scope === 'delimitation' ? body.draft?.topic : scope === 'research-design' ? body.draft?.research_question : body.draft?.field_phase;
    const guide = guidance[scope];
    const reply = 'Guía simulada de demostración. ' + (trim(example) ? 'En tu borrador aparece «' + trim(example).slice(0,180) + '». ' : '') + guide.question + ' ' + guide.step;
    return chatResponse(reply);
  }
  if (scope === 'delimitation') {
    const review = checkDelim(project,body.draft);
    return ok({review,evaluation:review,data:review});
  }
  const design = scope === 'research-design';
  const evaluation = design ? studyDesign(project) : sampleCheck(project);
  if (action === 'evaluate') return ok({data:evaluation});
  const issues = design ? [...evaluation.question.issues,...evaluation.general_objective.issues,...evaluation.specific_objectives.issues] : evaluation.signals;
  const next = guidance[scope];
  const ai_review = {
    overall_status:issues.length ? 'warning' : 'good',overall_score:design ? Math.round(100*(3-issues.length)/3) : evaluation.summary.overall_score,
    concise_summary:design ? 'Revisión simulada del formulario. Se registraron ' + evaluation.summary.specific_objectives_count + ' objetivos específicos.' : evaluation.concise_summary,
    issues,strengths:[],guiding_questions:[{question:next.question,purpose:'Contrastar las decisiones del protocolo con un ejemplo del estudio.'}],
    improvement_suggestions:[{field:design ? 'specific_objectives' : 'sample_size_rationale',suggestion:next.step}],next_step:issues[0]?.suggestion ?? next.step,
  };
  return ok({data:{evaluation,ai_review,meta:{model:'Guía local simulada'}}});
}
