import {seedMethodData} from './seed.mjs';
import {protocol,seedVersions} from './versions.mjs';
import {handleProtocol} from './protocol.mjs';
import {corpus} from './corpus.mjs';
import {handleTeam} from './team.mjs';

export {acceptInvitation} from './team.mjs';
export function seedMethod(projectId,rich = true) {
  const data = seedMethodData(projectId,rich);
  if (rich) seedVersions({id:projectId,...data});
  return data;
}
export async function handleMethod(options) {
  const ctx = {...options, body:options.body ?? {}};
  const parts = ctx.path.split('/').filter(Boolean);
  if (Object.hasOwn(protocol,parts[0])) return handleProtocol(ctx,parts);
  if (parts[0] === 'documents' || parts[0] === 'participants') return corpus(ctx,parts);
  if (parts[0] === 'team') return handleTeam(ctx,parts);
}
