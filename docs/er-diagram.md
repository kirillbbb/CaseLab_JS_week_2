# ER diagram

```text
sites
  PK id
  UQ code
      │ 1
      │
      └──────────────< N equipment
                         PK id
                         FK site_id
                         UQ serial_number
                         │ 1
                         │
                         └────────── 1 equipment_passports
                                      UQ/FK equipment_id

equipment
    │ 1
    └──────────────< N maintenance_requests
                       PK id
                       FK equipment_id
                       │
                       ├──────────< N request_status_history
                       │             FK request_id
                       │
                       └──────────< N request_assignees >──────────1 technicians
                                     PK (request_id, technician_id)
                                     role, hours
```

`request_assignees` реализует N:M и хранит атрибуты самой связи.

История статусов не имеет API для изменения/удаления, а FK `maintenance_requests -> request_status_history` использует `ON DELETE RESTRICT`.