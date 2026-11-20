import { exampleDocuments } from '../documentos-ejemplo.mjs';
import {stamp, seedDate, demoOwner, setCounts} from './common.mjs';

const optionList = pairs => pairs.map(([code, label], position) => ({code, label, position, is_active: true}));
const options = {
  main_approaches: optionList([['qualitative','Cualitativo'],['quantitative','Cuantitativo'],['mixed','Mixto']]),
  scopes: optionList([['exploratory','Exploratorio'],['descriptive','Descriptivo'],['correlational','Correlacional'],['explanatory','Explicativo']]),
  collection_technique_options: optionList([['interview','Entrevista semiestructurada'],['observation','Observación participante'],['focus_group','Grupo focal'],['document_analysis','Análisis documental'],['survey','Encuesta']]),
};
const participantIds = ['55555555-5555-4555-8555-555555555551','55555555-5555-4555-8555-555555555552'];
const sourceIds = ['66666666-6666-4666-8666-666666666661','66666666-6666-4666-8666-666666666662'];

export function seedMethodData(projectId, rich = true) {
  const base = stamp(projectId, seedDate, rich ? demoOwner : null);
  const criterion = (kind, text, suffix) => ({...base, id: '91000000-0000-4000-8000-' + suffix, kind, text, position: 0});
  const delimitation = {
    delim: {...base, topic: rich ? 'Transmisión de la memoria comunitaria y redes de cuidado cotidiano.' : '',
      context_place: rich ? 'Patio y salón comunal del barrio ficticio Las Jacarandas, Guatemala.' : '',
      time_period: rich ? 'Agosto a octubre de 2026.' : '',
      population: rich ? 'Personas adultas de distintas generaciones que participan en encuentros vecinales.' : '',
      resources: rich ? 'Guía de entrevista, cuaderno de campo y transcripciones ficticias en español.' : ''},
    include: rich ? [criterion('include','Personas adultas que participan en encuentros del barrio y desean compartir sus experiencias.','000000000001')] : [],
    exclude: rich ? [criterion('exclude','Relatos de terceros que no hayan autorizado el uso de su testimonio.','000000000002')] : [],
  };
  const researchDesign = {
    design: {...base, research_question: rich ? '¿Cómo se entrelazan el cuidado cotidiano y la transmisión de historias entre generaciones en Las Jacarandas?' : '',
      general_objective: rich ? 'Comprender cómo las prácticas de cuidado sostienen la transmisión de memoria en encuentros del barrio Las Jacarandas.' : ''},
    specific_objectives: rich ? ['Describir quiénes narran, escuchan y documentan las historias durante los encuentros.', 'Identificar las tareas de cuidado que permiten participar en esas conversaciones.'].map((text, position) => ({...base, text, position, id: '92000000-0000-4000-8000-00000000000' + (position + 1)})) : [],
  };
  const sampleConfig = {
    config: {...base, main_approach_code: rich ? 'qualitative' : null, scope_code: rich ? 'exploratory' : null,
      target_sample_size: rich ? 6 : null, field_phase: rich ? 'Tres encuentros vecinales y entrevistas individuales posteriores, entre agosto y octubre.' : '',
      sample_size_rationale: rich ? 'Se proponen seis voces de dos generaciones para contrastar experiencias de narración y cuidado. La selección es intencional.' : ''},
    collection_techniques: rich ? ['interview','observation'].map((technique_code, position) => ({id: '93000000-0000-4000-8000-00000000000' + (position + 1), project_id: projectId, position, technique_code, is_custom: false, custom_label: null})) : [],
  };
  const participants = rich ? ['Narradora vecinal','Organizador del encuentro'].map((display_name, index) => ({
    ...base, id: participantIds[index], alias: 'P0' + (index + 1), display_name, status: 'active', notes: 'Perfil ficticio elaborado para la demostración.', deleted_at: null,
    attributes: {sample_group: index === 0 ? 'Personas mayores' : 'Jóvenes adultos', participant_type: index === 0 ? 'Narradora' : 'Organizador', community: 'Las Jacarandas', age_range: index === 0 ? '60–69' : '20–29', recruitment_channel: 'Convocatoria vecinal'},
  })) : [];
  const sources = rich ? [['entrevista','Entrevistas del barrio','Conversaciones individuales.'],['cuaderno','Cuaderno de campo','Registros de observación.']].map(([code,label,description],position) => ({
    ...base, id: sourceIds[position], code,label,description,position,is_default:false,is_active:true,deleted_at:null,
  })) : [];
  const documents = rich ? exampleDocuments.map(({ id, title, excerpts }, index) => {
    const content = excerpts.map(excerpt => excerpt.text).join('\n');
    const document = {...base, id, title, content, document_type: index === 0 ? 'interview' : 'field_note',status:'ready_for_coding',
      source_id:sourceIds[index], participant_id: participantIds[index], interview_date: index === 0 ? '2026-09-12' : null, field_date: index === 0 ? null : '2026-09-19',
      language:'es',location: index === 0 ? 'Patio vecinal, Las Jacarandas' : 'Salón comunal, Las Jacarandas',notes: index === 0 ? 'Testimonio ficticio sobre aprendizaje entre generaciones.' : 'Observación ficticia de una jornada de relatos.', metadata: {},deleted_at:null};
    setCounts(document);
    return document;
  }) : [];
  const members = rich ? [
    {user_id:demoOwner,full_name:'Ana Morales',email:'demo@example.test',role:'owner',created_at:seedDate},
    {user_id:'94000000-0000-4000-8000-000000000001',full_name:'Luis Pérez',email:'asistente@example.test',role:'editor',created_at:seedDate},
  ] : [];
  const activity = rich ? [{id:'94000000-0000-4000-8000-000000000002', actor_name:'Ana Morales',event_type:'member_role_updated',created_at:seedDate}] : [];
  return {delimitation, researchDesign, sampleConfig, sampleOptions:structuredClone(options), participants, sources, documents,
    methodVersions:{}, team:{members, invitations:[], presence:[], activity}};
}
