import assert from 'node:assert/strict';
import { hasTechnicalRepairAccess, repairAccessRoles, canOpenTechnician, canChangeRepairStatus } from '../src/config/accessControl.js';
for (const roles of [['ADMIN'], ['FRONT_DESK'], ['TECHNICIAN'], ['FRONT_DESK','TECHNICIAN']]) {
  for (const assignedTechnicianId of [1,2,null]) {
    const user={id:1,roles}; const repair={assignedTechnicianId};
    const technical=roles.includes('ADMIN') || (roles.includes('TECHNICIAN') && assignedTechnicianId===1);
    assert.equal(hasTechnicalRepairAccess(user,repair),technical);
    const effective=repairAccessRoles(user,repair);
    for (const status of ['IN_PROGRESS','AWAITING_PARTS','READY_FOR_RELEASE']) assert.equal(canChangeRepairStatus(effective,status),technical);
    assert.equal(canChangeRepairStatus(effective,'COMPLETED'),roles.includes('ADMIN')||roles.includes('FRONT_DESK'));
  }
  assert.equal(canOpenTechnician({id:1,roles},2),roles.includes('ADMIN')||roles.includes('FRONT_DESK'));
}
assert.equal(hasTechnicalRepairAccess({roles:['TECHNICIAN']},{assignedTechnicianId:null}),false);
