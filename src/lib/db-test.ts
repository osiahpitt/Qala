/**
 * Database connection and basic CRUD operations test
 * This file tests the Supabase connection and verifies basic database operations
 */

/* eslint-disable no-console, @typescript-eslint/no-unused-vars */

import { supabase } from './supabase'
import type { Database } from '@/types/supabase'

type User = Database['public']['Tables']['users']['Row']
type UserInsert = Database['public']['Tables']['users']['Insert']

/**
 * Test database connection
 */
export async function testDatabaseConnection() {
  try {
    const { data, error } = await supabase.from('users').select('count', { count: 'exact' })

    if (error) {
      throw new Error(`Database connection failed: ${error.message}`)
    }

    console.log('✅ Database connection successful')
    console.log(`📊 Current user count: ${data?.length ?? 0}`)

    return true
  } catch (error) {
    console.error('❌ Database connection failed:', error)
    return false
  }
}

/**
 * Test user CRUD operations
 */
export async function testUserCRUD() {
  try {
    // Test user data
    const testUser: UserInsert = {
      email: 'test@qala.app',
      full_name: 'Test User',
      native_language: 'en',
      target_languages: ['es', 'fr'],
      proficiency_levels: { es: 'beginner', fr: 'intermediate' },
      age: 25,
      gender: 'prefer-not-to-say',
      country: 'USA',
      timezone: 'America/New_York',
    }

    // Test INSERT
    console.log('🔄 Testing user creation...')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: insertData, error: insertError } = await (supabase as any)
      .from('users')
      .insert(testUser)
      .select()
      .single()

    if (insertError) {
      throw new Error(`User creation failed: ${insertError.message}`)
    }

    console.log('✅ User creation successful')
    const userId = insertData.id

    // Test SELECT
    console.log('🔄 Testing user retrieval...')
    const { data: selectData, error: selectError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (selectError) {
      throw new Error(`User retrieval failed: ${selectError.message}`)
    }

    console.log('✅ User retrieval successful')

    // Test UPDATE
    console.log('🔄 Testing user update...')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateError } = await (supabase as any)
      .from('users')
      .update({ full_name: 'Updated Test User' })
      .eq('id', userId)

    if (updateError) {
      throw new Error(`User update failed: ${updateError.message}`)
    }

    console.log('✅ User update successful')

    // Test DELETE (cleanup)
    console.log('🔄 Testing user deletion...')
    const { error: deleteError } = await supabase
      .from('users')
      .delete()
      .eq('id', userId)

    if (deleteError) {
      throw new Error(`User deletion failed: ${deleteError.message}`)
    }

    console.log('✅ User deletion successful')
    console.log('🎉 All CRUD operations completed successfully')

    return true
  } catch (error) {
    console.error('❌ CRUD test failed:', error)
    return false
  }
}

/**
 * Test Row Level Security policies
 */
export async function testRLSPolicies() {
  try {
    console.log('🔄 Testing Row Level Security policies...')

    // Test unauthenticated access (should be restricted)
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .limit(1)

    if (error && error.message.includes('row-level security')) {
      console.log('✅ RLS policies are active and working')
      return true
    }

    console.warn('⚠️ RLS policies may not be properly configured')
    return false
  } catch (error) {
    console.error('❌ RLS test failed:', error)
    return false
  }
}

/**
 * Run all database tests
 */
export async function runDatabaseTests() {
  console.log('🚀 Starting database tests...')
  console.log('=' .repeat(50))

  const connectionResult = await testDatabaseConnection()
  const crudResult = await testUserCRUD()
  const rlsResult = await testRLSPolicies()

  console.log('=' .repeat(50))
  console.log('📋 Test Results:')
  console.log(`Database Connection: ${connectionResult ? '✅' : '❌'}`)
  console.log(`CRUD Operations: ${crudResult ? '✅' : '❌'}`)
  console.log(`RLS Policies: ${rlsResult ? '✅' : '❌'}`)

  const allTestsPassed = connectionResult && crudResult && rlsResult
  console.log(`Overall Result: ${allTestsPassed ? '🎉 PASS' : '❌ FAIL'}`)

  return allTestsPassed
}

/**
 * Test specific table schema
 */
export async function testTableSchema(tableName: keyof Database['public']['Tables']) {
  try {
    console.log(`🔄 Testing ${tableName} table schema...`)

    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(0)

    if (error) {
      throw new Error(`Schema test failed for ${tableName}: ${error.message}`)
    }

    console.log(`✅ ${tableName} table schema is valid`)
    return true
  } catch (error) {
    console.error(`❌ Schema test failed for ${tableName}:`, error)
    return false
  }
}

/**
 * Test all table schemas
 */
export async function testAllSchemas() {
  const tables: (keyof Database['public']['Tables'])[] = [
    'users',
    'sessions',
    'vocabulary',
    'reports',
    'matching_queue'
  ]

  console.log('🔄 Testing all table schemas...')

  const results = await Promise.all(
    tables.map(table => testTableSchema(table))
  )

  const allSchemasValid = results.every(Boolean)
  console.log(`Schema validation: ${allSchemasValid ? '✅ All tables valid' : '❌ Some tables invalid'}`)

  return allSchemasValid
}