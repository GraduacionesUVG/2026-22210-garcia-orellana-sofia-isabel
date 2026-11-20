import {fail,id,missing,now,ok,trim} from './common.mjs';

const emailOf = value => trim(value).toLowerCase();
const roles = ['editor','viewer'];
function addActivity(team,event_type,account) {
  team.activity.unshift({id:id(),event_type,actor_user_id:account.id,actor_name:account.full_name || account.email,created_at:now()});
}
function owner(project,account) {
  const team = project.team;
  if (project.owner_id === account.id && !team.members.some(member => member.user_id === account.id)) {
    team.members.unshift({user_id:account.id,full_name:account.full_name,email:account.email,role:'owner',created_at:project.created_at ?? now()});
  }
}
function removeExpired(team) {
  for (const invitation of team.invitations) {
    if (invitation.status === 'pending' && Date.parse(invitation.expires_at) <= Date.now()) invitation.status = 'expired';
  }
  team.presence = team.presence.filter(member => Date.now() - Date.parse(member.last_seen_at) <= 120_000);
}
export function handleTeam({project,account,body,method},parts) {
  const [,action,who,operation] = parts;
  const team = project.team;
  owner(project,account);
  removeExpired(team);
  const role = team.members.find(member => member.user_id === account.id)?.role;
  if (!role) return fail('Se necesita acceso al equipo de este proyecto.',403);
  if (!action && method === 'GET') {
    return ok({currentRole:role,members:team.members,invitations:role === 'owner' ? team.invitations : [],presence:team.presence,activity:team.activity});
  }
  if (action === 'presence' && method === 'POST') {
    const entry = team.presence.find(person => person.user_id === account.id) ?? {id:id(),user_id:account.id};
    Object.assign(entry,{display_name:account.full_name,email:account.email,resource_type:body.resource_type || 'project',
      presence_state:['viewing','editing','idle'].includes(body.presence_state) ? body.presence_state : 'viewing',last_seen_at:now()});
    if (!team.presence.includes(entry)) team.presence.push(entry);
    return ok({active:team.presence});
  }
  if (role !== 'owner') return fail('Solo la persona propietaria puede administrar el equipo.',403);
  if (!action && method === 'POST') {
    const email = emailOf(body.email);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !roles.includes(body.role)) return fail('Revisa el correo y el permiso.');
    if (team.members.some(person => emailOf(person.email) === email)) return fail('Esa persona ya pertenece al proyecto.',409);
    if (team.invitations.some(inv => inv.email === email && inv.status === 'pending')) return fail('Ya existe una invitación pendiente para ese correo.',409);
    const invitation = {id:id(),project_id:project.id,email,role:body.role,token:id(),status:'pending',created_at:now(),
      expires_at:new Date(Date.now() + 7*24*60*60*1000).toISOString(),created_by:account.id};
    team.invitations.unshift(invitation);
    addActivity(team,'invitation_created',account);
    return ok({invitation},201);
  }
  if (action === 'invitations' && operation === 'revoke' && method === 'POST') {
    const invitation = team.invitations.find(inv => inv.id === who);
    if (!invitation) return missing();
    if (invitation.status !== 'pending') return fail('La invitación ya no está pendiente.',409);
    invitation.status = 'revoked';
    addActivity(team,'invitation_revoked',account);
    return ok({invitation});
  }
  if (action === 'members') {
    const member = team.members.find(person => person.user_id === who);
    if (!member) return missing();
    if (member.role === 'owner') return fail('El proyecto debe conservar a su propietario.',409);
    if (method === 'PATCH') {
      if (!roles.includes(body.role)) return fail('Selecciona un permiso válido.');
      member.role = body.role;
      addActivity(team,'member_role_updated',account);
      return ok({member});
    }
    if (method === 'DELETE') {
      team.members = team.members.filter(person => person !== member);
      team.presence = team.presence.filter(person => person.user_id !== who);
      addActivity(team,'member_removed',account);
      return ok({removed:true});
    }
  }
}
export function acceptInvitation({db,body,account}) {
  if (!account) return fail('Inicia sesión con la cuenta local que recibió la invitación.',401);
  const token = trim(body?.token);
  const project = db.projects.find(project => token && project.team?.invitations.some(inv => inv.token === token));
  if (!project) return fail('Enlace de invitación local inválido.',404);
  const team = project.team;
  removeExpired(team);
  const invitation = team.invitations.find(inv => inv.token === token);
  if (emailOf(invitation.email) !== emailOf(account.email)) return fail('Inicia sesión con la dirección a la que se creó la invitación.',403);
  const member = team.members.find(person => person.user_id === account.id);
  if (invitation.status === 'accepted' && member) return ok({invitation});
  if (invitation.status !== 'pending') return fail('Esta invitación ya no está disponible.',410);
  if (!member) team.members.push({user_id:account.id,role:invitation.role,email:account.email,full_name:account.full_name,created_at:now()});
  invitation.status = 'accepted';
  invitation.accepted_at = now();
  invitation.accepted_by = account.id;
  addActivity(team,'invitation_accepted',account);
  return ok({invitation});
}
