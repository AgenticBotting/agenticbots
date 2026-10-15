# Runbook — Restore a client runtime

Every client's data volume (`/opt/agenticbots/data`) is snapshotted daily
(encrypted, 30-day retention, tag `agenticbots:backup=daily`). Snapshots are
kept even after a client cancels.

## Before you start
- Suspend the client in the console (blocks new work).
- Note the client's **tenant id** and **instance id** (client → Infrastructure).
- AWS console, selected Region `us-east-2` (Ohio), signed in through the project login.

## 1. Pick the snapshot
EC2 → **Snapshots** → filter tag `agenticbots:tenant = <tenant id>` → choose
the newest snapshot from before the problem. Note its **Snapshot ID**.

## 2. Create a volume from it
Snapshot → **Actions → Create volume from snapshot** → same **Availability
Zone** as the instance (shown on the instance) → type gp3 → encryption is
inherited → add tags `agenticbots:tenant=<tenant id>`,
`agenticbots:backup=daily`, `agenticbots:managed=true`.

## 3a. Same instance (most cases)
1. Session Manager into the instance:
   `sudo /opt/agenticbots/bin/lifecycle.sh stop-runtime none`
2. EC2 → Volumes → the **current** data volume → *Detach*. (Keep it until done.)
3. The **restored** volume → *Attach volume* → the instance → device `/dev/sdf`.
4. Session Manager: `sudo mount -a && ls /opt/agenticbots/data/engine`
   (you should see `config.yaml`, `profiles/`, `state.db`).

## 3b. Replacement instance (instance is broken)
1. `cd infra/terraform/envs/prod && terraform apply -replace='module.stack.module.tenant["<tenant id>"].aws_instance.runtime'`
   — creates a fresh instance; the data volume is protected and kept.
2. If the old data volume is damaged, attach the restored volume instead
   (step 3a.2–3a.4) and update Terraform state:
   `terraform state rm 'module.stack.module.tenant["<id>"].aws_ebs_volume.data'` then
   `terraform import 'module.stack.module.tenant["<id>"].aws_ebs_volume.data' <new vol id>`.
3. First boot mounts the volume (label `agb-data`) and starts the runtime.

## 4. Start the runtime
Session Manager: `sudo /opt/agenticbots/bin/lifecycle.sh start-runtime none`

## 5. Health verification
Console → client → **Refresh health**: Runtime *Healthy*, Ready *Yes*.
CLI: `npm run ops -- tenant:status --tenant <id>`.

## 6. Bot verification
For each Bot: open it → **View runtime details** (profile reachable, skills
listed) → start a short read-only run. Then **Reactivate client**.

## 7. Clean up
After a week of normal operation, delete the old detached volume (after one
more snapshot of it, if in doubt).
