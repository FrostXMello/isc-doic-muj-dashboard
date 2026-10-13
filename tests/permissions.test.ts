import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { appRoles, canAccessArea, defaultDestination, primaryRole } from "@/lib/auth/roles";
import {
  type AppRole,
  assignableRoles,
  can,
  canAssignRole,
  canManageAccount,
  contentResources,
  rolesForNewAccount,
} from "@/lib/internal/permissions";

const account = (id: string, ...roles: AppRole[]) => ({ id, roles });
const superAdmin = account("s", "super_admin");
const doic = account("d", "doic_admin");
const iscAdmin = account("i", "isc_admin");
const team = account("t", "isc_team");
const leader = account("l", "leadership");
const student = account("u", "student");
const pending = account("p");

describe("permission matrix", () => {
  it("lets every internal role read records and reports", () => {
    for (const roles of [superAdmin, doic, iscAdmin, team, leader].map((a) => a.roles)) {
      for (const resource of contentResources) assert.ok(can(roles, `${resource}:read`));
      assert.ok(can(roles, "reports:export"));
    }
    assert.ok(!can(student.roles, "institutions:read"));
    assert.ok(!can(pending.roles, "institutions:read"));
  });

  it("lets editors create, edit, archive, and upload but not delete", () => {
    for (const resource of contentResources) {
      assert.ok(can(team.roles, `${resource}:create`));
      assert.ok(can(team.roles, `${resource}:update`));
      assert.ok(can(team.roles, `${resource}:archive`));
      assert.ok(!can(team.roles, `${resource}:delete`));
    }
    assert.ok(can(team.roles, "documents:upload"));
  });

  it("keeps leadership read-only", () => {
    for (const resource of contentResources) {
      for (const action of ["create", "update", "archive", "delete"] as const) {
        assert.ok(!can(leader.roles, `${resource}:${action}`), `${resource}:${action}`);
      }
    }
    assert.ok(!can(leader.roles, "documents:upload"));
    assert.ok(!can(leader.roles, "users:manage"));
    assert.ok(!can(leader.roles, "settings:update"));
    assert.ok(can(leader.roles, "audit:read"));
  });

  it("gives deletes, settings, users, and audit to every administrator only", () => {
    for (const roles of [superAdmin, doic, iscAdmin].map((a) => a.roles)) {
      for (const resource of contentResources) assert.ok(can(roles, `${resource}:delete`));
      assert.ok(can(roles, "settings:update"));
      assert.ok(can(roles, "users:manage"));
      assert.ok(can(roles, "audit:read"));
    }
    assert.ok(!can(team.roles, "audit:read"));
    assert.ok(!can(team.roles, "settings:update"));
  });
});

describe("role assignment", () => {
  it("never lets anyone change their own roles or account", () => {
    for (const actor of [superAdmin, doic, iscAdmin]) {
      assert.deepEqual(assignableRoles(actor, actor), []);
      assert.ok(!canManageAccount(actor, actor));
    }
  });

  it("reserves administrator roles for super_admin", () => {
    for (const role of ["super_admin", "doic_admin", "isc_admin"] as const) {
      assert.ok(canAssignRole(superAdmin, pending, role));
      assert.ok(!canAssignRole(doic, pending, role));
      assert.ok(!canAssignRole(iscAdmin, pending, role));
    }
    assert.ok(!rolesForNewAccount(doic.roles).includes("doic_admin"));
    assert.ok(rolesForNewAccount(superAdmin.roles).includes("super_admin"));
  });

  it("bounds ordinary role management per administrator", () => {
    assert.deepEqual(assignableRoles(doic, pending).sort(), ["isc_team", "leadership", "student"]);
    assert.deepEqual(assignableRoles(iscAdmin, pending).sort(), ["isc_team", "student"]);
    assert.deepEqual(assignableRoles(team, pending), []);
    assert.deepEqual(assignableRoles(leader, pending), []);
  });

  it("protects administrator accounts from other administrators", () => {
    assert.ok(!canManageAccount(doic, iscAdmin));
    assert.ok(!canManageAccount(iscAdmin, doic));
    assert.ok(!canManageAccount(doic, account("d2", "doic_admin")));
    assert.ok(!canManageAccount(doic, superAdmin));
    assert.deepEqual(assignableRoles(doic, account("x", "isc_team", "isc_admin")), []);
    assert.ok(canManageAccount(superAdmin, doic));
    assert.ok(canManageAccount(superAdmin, account("s2", "super_admin")));
    assert.ok(canManageAccount(doic, team));
  });
});

describe("routing with the new roles", () => {
  it("treats administrator roles as internal and ranks super_admin first", () => {
    assert.equal(primaryRole(["student", "isc_admin"]), "isc_admin");
    assert.equal(primaryRole(["doic_admin", "super_admin"]), "super_admin");
    assert.ok(canAccessArea("internal", ["isc_admin"]));
    assert.ok(canAccessArea("internal", ["super_admin"]));
    assert.equal(defaultDestination(["isc_admin"]), "/internal");
    assert.equal(defaultDestination([]), "/access-pending");
  });
});

describe("app and database stay in step", () => {
  const migration = readFileSync("supabase/migrations/20261005090100_admin_control.sql", "utf8");
  const listAfter = (role: string) => {
    const match = migration.match(
      new RegExp(`has_role\\('${role}'::public\\.app_role\\)\\s+and check_role in \\(([^)]+)\\)`),
    );
    assert.ok(match, `can_assign_role lists roles for ${role}`);
    return match[1].split(",").map((value) => value.trim().replace(/'/g, "")).sort();
  };

  it("grants the same ordinary roles in SQL and TypeScript", () => {
    assert.deepEqual(listAfter("doic_admin"), assignableRoles(doic, pending).sort());
    assert.deepEqual(listAfter("isc_admin"), assignableRoles(iscAdmin, pending).sort());
  });

  it("knows every enum value the migrations define", () => {
    const enumValues = [
      ...readFileSync("supabase/migrations/20260930120000_foundation.sql", "utf8")
        .match(/create type public\.app_role as enum \(([^)]+)\)/)![1]
        .matchAll(/'([a-z_]+)'/g),
      ...readFileSync("supabase/migrations/20261005090000_admin_role_values.sql", "utf8").matchAll(
        /add value if not exists '([a-z_]+)'/g,
      ),
    ].map((match) => match[1]);
    assert.deepEqual([...enumValues].sort(), [...appRoles].sort());
  });
});
