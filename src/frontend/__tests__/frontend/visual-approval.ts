export function assertVisualApproval(input: { updateSnapshots:string; expectedDigest:string; beforeDigest:string; afterDigest:string }):void {
  if(input.updateSnapshots!=='none')throw new Error('BASELINE_APPROVAL_REQUIRED: snapshot update mode is forbidden');
  if(!input.expectedDigest || input.beforeDigest!==input.expectedDigest || input.afterDigest!==input.expectedDigest)throw new Error('BASELINE_APPROVAL_REQUIRED: baseline differs from exact approved bytes');
}
