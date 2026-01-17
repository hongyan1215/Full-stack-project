'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface MigrationStatus {
  needsMigration: boolean;
  eventsNeedingMigration: number;
  categoriesNeedingMigration: number;
}

interface MigrationResults {
  success: boolean;
  message: string;
  results: {
    eventsMigrated: number;
    eventsSkipped: number;
    categoriesMigrated: number;
    categoriesSkipped: number;
    errors: string[];
  };
}

export default function MigratePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [migrationStatus, setMigrationStatus] = useState<MigrationStatus | null>(null);
  const [migrationResults, setMigrationResults] = useState<MigrationResults | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
      return;
    }

    if (status === 'authenticated') {
      checkMigrationStatus();
    }
  }, [status, router]);

  const checkMigrationStatus = async () => {
    try {
      setIsChecking(true);
      const response = await fetch('/api/migrate');
      if (!response.ok) {
        throw new Error('Failed to check migration status');
      }
      const data = await response.json();
      setMigrationStatus(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check migration status');
    } finally {
      setIsChecking(false);
    }
  };

  const runMigration = async () => {
    if (!confirm('Are you sure you want to run the migration? This will update your events and categories to the new format.')) {
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch('/api/migrate', {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Migration failed');
      }

      const data = await response.json();
      setMigrationResults(data);
      
      // Refresh migration status
      await checkMigrationStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Migration failed');
    } finally {
      setIsLoading(false);
    }
  };

  if (status === 'loading' || isChecking) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Loading...</p>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return null;
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '1.5rem' }}>Database Migration</h1>
      
      <div style={{ 
        background: 'var(--bg-modal)', 
        padding: '1.5rem', 
        borderRadius: '8px',
        marginBottom: '1.5rem',
        border: '1px solid var(--border-light)'
      }}>
        <h2 style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>Migration Status</h2>
        
        {migrationStatus ? (
          <div>
            {migrationStatus.needsMigration ? (
              <div style={{ 
                padding: '1rem', 
                background: '#fff3cd', 
                border: '1px solid #ffc107',
                borderRadius: '4px',
                marginBottom: '1rem'
              }}>
                <p style={{ margin: 0, fontWeight: 'bold' }}>⚠️ Migration Needed</p>
                <ul style={{ marginTop: '0.5rem', marginBottom: 0 }}>
                  <li>Events needing migration: {migrationStatus.eventsNeedingMigration}</li>
                  <li>Categories needing migration: {migrationStatus.categoriesNeedingMigration}</li>
                </ul>
              </div>
            ) : (
              <div style={{ 
                padding: '1rem', 
                background: '#d4edda', 
                border: '1px solid #28a745',
                borderRadius: '4px',
                marginBottom: '1rem'
              }}>
                <p style={{ margin: 0, fontWeight: 'bold' }}>✅ No Migration Needed</p>
                <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem' }}>
                  Your data is already in the new format.
                </p>
              </div>
            )}
          </div>
        ) : (
          <p>Checking migration status...</p>
        )}

        {error && (
          <div style={{ 
            padding: '1rem', 
            background: '#f8d7da', 
            border: '1px solid #dc3545',
            borderRadius: '4px',
            marginBottom: '1rem',
            color: '#721c24'
          }}>
            <p style={{ margin: 0, fontWeight: 'bold' }}>Error</p>
            <p style={{ margin: '0.5rem 0 0 0' }}>{error}</p>
          </div>
        )}

        {migrationResults && (
          <div style={{ 
            padding: '1rem', 
            background: migrationResults.success ? '#d4edda' : '#f8d7da',
            border: `1px solid ${migrationResults.success ? '#28a745' : '#dc3545'}`,
            borderRadius: '4px',
            marginBottom: '1rem'
          }}>
            <p style={{ margin: 0, fontWeight: 'bold' }}>
              {migrationResults.success ? '✅ Migration Completed' : '❌ Migration Failed'}
            </p>
            <p style={{ margin: '0.5rem 0', fontSize: '0.875rem' }}>
              {migrationResults.message}
            </p>
            <div style={{ marginTop: '0.75rem', fontSize: '0.875rem' }}>
              <p style={{ margin: '0.25rem 0' }}>
                Events migrated: {migrationResults.results.eventsMigrated}
              </p>
              <p style={{ margin: '0.25rem 0' }}>
                Events skipped: {migrationResults.results.eventsSkipped}
              </p>
              <p style={{ margin: '0.25rem 0' }}>
                Categories migrated: {migrationResults.results.categoriesMigrated}
              </p>
              <p style={{ margin: '0.25rem 0' }}>
                Categories skipped: {migrationResults.results.categoriesSkipped}
              </p>
              {migrationResults.results.errors.length > 0 && (
                <div style={{ marginTop: '0.5rem' }}>
                  <p style={{ margin: '0.25rem 0', fontWeight: 'bold' }}>Errors:</p>
                  <ul style={{ margin: '0.25rem 0', paddingLeft: '1.5rem' }}>
                    {migrationResults.results.errors.map((err, idx) => (
                      <li key={idx} style={{ fontSize: '0.8rem' }}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
          <button
            onClick={runMigration}
            disabled={isLoading || !migrationStatus?.needsMigration}
            style={{
              padding: '0.75rem 1.5rem',
              background: isLoading || !migrationStatus?.needsMigration 
                ? '#ccc' 
                : 'var(--color-primary)',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: isLoading || !migrationStatus?.needsMigration 
                ? 'not-allowed' 
                : 'pointer',
              fontWeight: 'bold'
            }}
          >
            {isLoading ? 'Running Migration...' : 'Run Migration'}
          </button>
          <button
            onClick={checkMigrationStatus}
            disabled={isChecking}
            style={{
              padding: '0.75rem 1.5rem',
              background: 'var(--bg-input)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-light)',
              borderRadius: '4px',
              cursor: isChecking ? 'not-allowed' : 'pointer'
            }}
          >
            Refresh Status
          </button>
          <button
            onClick={() => router.push('/')}
            style={{
              padding: '0.75rem 1.5rem',
              background: 'var(--bg-input)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-light)',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Back to Calendar
          </button>
        </div>
      </div>

      <div style={{ 
        background: 'var(--bg-modal)', 
        padding: '1.5rem', 
        borderRadius: '8px',
        border: '1px solid var(--border-light)'
      }}>
        <h2 style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>What This Migration Does</h2>
        <ul style={{ lineHeight: '1.8' }}>
          <li>
            <strong>Events:</strong> Maps old category values (routine, assignment, activity, other) 
            to new category IDs (category-1 through category-8). Removes color property from 
            regular events (schedule events keep their color).
          </li>
          <li>
            <strong>Categories:</strong> Converts old custom categories to default category 
            overrides. Ensures all categories use the new 8-category system.
          </li>
        </ul>
        <p style={{ marginTop: '1rem', fontSize: '0.875rem', opacity: 0.8 }}>
          <strong>Note:</strong> This migration is safe to run multiple times. It will only 
          update data that needs migration and skip data that's already in the new format.
        </p>
      </div>
    </div>
  );
}

