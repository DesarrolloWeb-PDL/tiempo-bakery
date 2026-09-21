import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

const schemaPath = path.resolve(process.cwd(), 'prisma', 'schema.prisma')
const migrationsDir = path.resolve(process.cwd(), 'prisma', 'migrations')

describe('delivery schema', () => {
  it('defines the five new delivery models in schema.prisma', () => {
    const schema = fs.readFileSync(schemaPath, 'utf8')
    expect(schema).toContain('model DeliveryZone')
    expect(schema).toContain('model DeliverySchedule')
    expect(schema).toContain('model DeliveryPerson')
    expect(schema).toContain('model DeliveryAssignment')
    expect(schema).toContain('model DeliveryAttempt')
  })

  it('adds nullable delivery fields and index to Order', () => {
    const schema = fs.readFileSync(schemaPath, 'utf8')
    expect(schema).toContain('deliveryZoneId String?')
    expect(schema).toContain('deliveryScheduleId String?')
    expect(schema).toContain('deliveryDate DateTime?')
    expect(schema).toContain('@@index([deliveryScheduleId, deliveryDate])')
  })

  it('has a migration with the required tables and partial unique index', () => {
    const migrationDirs = fs
      .readdirSync(migrationsDir)
      .filter((name) => fs.statSync(path.join(migrationsDir, name)).isDirectory())
      .sort()
    const allSql = migrationDirs
      .map((dir) => fs.readFileSync(path.join(migrationsDir, dir, 'migration.sql'), 'utf8'))
      .join('\n')

    expect(allSql).toContain('CREATE TABLE "DeliveryZone"')
    expect(allSql).toContain('CREATE TABLE "DeliverySchedule"')
    expect(allSql).toContain('CREATE TABLE "DeliveryPerson"')
    expect(allSql).toContain('CREATE TABLE "DeliveryAssignment"')
    expect(allSql).toContain('CREATE TABLE "DeliveryAttempt"')
    expect(allSql).toContain('CREATE UNIQUE INDEX "DeliverySchedule_active_day_idx"')
  })
})
